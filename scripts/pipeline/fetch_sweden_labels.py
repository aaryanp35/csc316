"""Read only the JSON annotations out of the Swedish second-hand dataset (Zenodo 12518734, one 27 GB zip of images)
with HTTP range requests, and write one row per labelled garment to <out_dir>/zenodo_labels.csv (path, station, usage).

Run from fetch_all.sh:   python -I scripts/pipeline/fetch_sweden_labels.py data/raw/sweden
No images are downloaded: the zip's central directory (~16 MB) says where each of the ~32,000 small JSON files sits,
and they are fetched 150 at a time as multi-range requests (~70 MB in total, a few minutes).
The station is in each file's path: station1/station2 = Wargön Innovation's sorting plant, station3 = Myrorna's shops.
"""
import csv
import json
import os
import re
import struct
import sys
import time
import urllib.error
import urllib.request
import zlib

URL = "https://zenodo.org/api/records/12518734/files/circular_fashion_v2.zip/content"
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)


def get(ranges, total):
    """Fetch one or more inclusive byte ranges; returns their bytes in the same order."""
    spec = ",".join(f"{a}-{b}" for a, b in ranges)
    for _ in range(6):
        req = urllib.request.Request(URL, headers={"Range": f"bytes={spec}", "User-Agent": "csc316-pipeline"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                body, ctype, left = r.read(), r.headers.get("Content-Type", ""), r.headers.get("X-RateLimit-Remaining")
                crange = r.headers.get("Content-Range", "")
            break
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(int(e.headers.get("Retry-After", "30")) + 1)  # rate limited
        except OSError as e:  # transient network errors
            print("  retrying after:", e, flush=True)
            time.sleep(5)
    else:
        raise RuntimeError("too many retries")
    if left is not None and int(left) < 5:
        time.sleep(30)
    span = lambda cr: tuple(int(x) for x in cr.split("bytes")[1].strip().split("/")[0].split("-"))
    # Zenodo sends multi-range replies as "application/octet-stream" with this boundary, so detect them from the body
    boundary = b"--" + (ctype.split("boundary=")[1].strip().encode() if "boundary=" in ctype else b"EOSMULTIPARTBOUNDARY")
    if boundary not in body[:200]:  # one range, or several the server merged into one
        if len(ranges) == 1:
            return [body]
        pa, pb = span(crange)
        parts = [(pa, pb, body)]
    else:  # the server merges nearby ranges, so map each request onto the part that contains it
        parts = []
        for chunk in body.split(boundary)[1:]:
            if chunk.startswith(b"--"):
                break
            i, sep = min((chunk.find(s), s) for s in (b"\r\n\r\n", b"\n\n") if chunk.find(s) != -1)
            head, data = chunk[:i], chunk[i + len(sep):]
            pa, pb = span(next(l for l in head.decode("latin1").splitlines() if l.lower().startswith("content-range")))
            parts.append((pa, pb, data[:pb - pa + 1]))
    out = []
    for a, b in ranges:
        pa, pb, data = next(p for p in parts if p[0] <= a and min(b, total - 1) <= p[1])
        out.append(data[a - pa:b - pa + 1])
    return out


# 1. size, then the end-of-central-directory records (ZIP64) from the tail
with urllib.request.urlopen(urllib.request.Request(URL, headers={"Range": "bytes=0-0"})) as r:
    total = int(r.headers["Content-Range"].split("/")[1])
tail = get([(total - (1 << 16), total - 1)], total)[0]
loc64 = tail.rfind(b"PK\x06\x07")
if loc64 != -1:
    z64 = struct.unpack("<Q", tail[loc64 + 8:loc64 + 16])[0]
    rec = get([(z64, z64 + 55)], total)[0]
    n_entries, cd_size, cd_off = struct.unpack("<QQQ", rec[32:56])
else:
    eocd = tail.rfind(b"PK\x05\x06")
    n_entries = struct.unpack("<H", tail[eocd + 10:eocd + 12])[0]
    cd_size, cd_off = struct.unpack("<II", tail[eocd + 12:eocd + 20])

# 2. the central directory, in 8 MB chunks
cd = b"".join(get([(p, min(p + (8 << 20), cd_off + cd_size) - 1)], total)[0] for p in range(cd_off, cd_off + cd_size, 8 << 20))
entries, p = [], 0
while p < len(cd) and cd[p:p + 4] == b"PK\x01\x02":
    method, = struct.unpack("<H", cd[p + 10:p + 12])
    csize, usize = struct.unpack("<II", cd[p + 20:p + 28])
    nlen, xlen, clen = struct.unpack("<HHH", cd[p + 28:p + 34])
    offset, = struct.unpack("<I", cd[p + 42:p + 46])
    name = cd[p + 46:p + 46 + nlen].decode("utf-8", "replace")
    extra, q = cd[p + 46 + nlen:p + 46 + nlen + xlen], 0
    while q + 4 <= len(extra):  # ZIP64 extra field holds the real sizes/offset when the 32-bit ones are maxed out
        hid, hlen = struct.unpack("<HH", extra[q:q + 4])
        if hid == 1:
            vals, k = extra[q + 4:q + 4 + hlen], 0
            if usize == 0xFFFFFFFF:
                usize, k = struct.unpack("<Q", vals[k:k + 8])[0], k + 8
            if csize == 0xFFFFFFFF:
                csize, k = struct.unpack("<Q", vals[k:k + 8])[0], k + 8
            if offset == 0xFFFFFFFF:
                offset = struct.unpack("<Q", vals[k:k + 8])[0]
        q += 4 + hlen
    if name.lower().endswith(".json"):
        entries.append((name, method, csize, offset))
    p += 46 + nlen + xlen + clen
print(f"{n_entries} files in the zip, {len(entries)} JSON annotations", flush=True)

# 3. the JSON files, 150 byte ranges per request (local header + name + extra fit in the 400-byte slack)
rows, bad = [], 0
for i in range(0, len(entries), 150):
    batch = entries[i:i + 150]
    for (name, method, csize, offset), d in zip(batch, get([(e[3], e[3] + 430 + e[2]) for e in batch], total)):
        assert d[:4] == b"PK\x03\x04", name
        nlen, xlen = struct.unpack("<HH", d[26:30])
        raw = d[30 + nlen + xlen:30 + nlen + xlen + csize]
        text = (zlib.decompress(raw, -15) if method == 8 else raw).decode("utf-8", "replace")
        try:
            label = json.loads(text)
        except ValueError:  # a few files were written with Python's True/False
            try:
                label = json.loads(re.sub(r"\bFalse\b", "false", re.sub(r"\bTrue\b", "true", text)))
            except ValueError:
                bad += 1
                continue
        station = re.search(r"station\d", name)
        rows.append({"path": name, "station": station.group(0) if station else "", "usage": str(label.get("usage", "")).strip()})
    if i // 150 % 40 == 0:
        print(f"  {i + len(batch)}/{len(entries)}", flush=True)

with open(os.path.join(OUT, "zenodo_labels.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["path", "station", "usage"], lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
print(f"zenodo_labels.csv: {len(rows)} rows ({bad} unreadable JSON files skipped)")
