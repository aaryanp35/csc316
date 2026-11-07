"""Clean the raw datasets in data/raw/ into the small tidy CSVs the site loads from public/data/.

Run after scripts/pipeline/fetch_all.sh:   python -I scripts/pipeline/build_data.py data/raw public/data

Sources (see public/data/README.md for licences and links):
  carbonfact/   Carbonfact open LCA database (GitHub), impact-scores.csv per process. GHG = kg CO2e, WTU = m3 world-eq
                (water-scarcity weighted water use), both per kg of output.
  norway/       Norway post-consumer garment data table (Zenodo 20440761), 16,464 garments.
  sweden/       Swedish second-hand sorting labels (Zenodo 12518734; label counts from the authors' Hugging Face copy).
  eurostat/     env_wasgen, textile wastes (W076), EU27_2020, tonnes.
  kaggle/       The Fast Fashion Industry Dataset 2000-2023 (harshinigande): sourced figures (McKinsey, EPA, WWF).
"""
import csv
import json
import os
import sys
from collections import Counter

import pandas as pd

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
facts = {}  # headline numbers used in the story text


def write(name, df):
    df.to_csv(os.path.join(OUT, name), index=False, lineterminator="\n")
    print(f"{name}: {len(df)} rows")


# ---------------------------------------------------------------- Carbonfact
def carbonfact():
    rows = {}
    for proc in ["spinning", "weaving", "knitting", "dyeing", "finishing", "textile-assembly"]:
        with open(os.path.join(RAW, "carbonfact", "datasets", proc, "impact-scores.csv"), encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                rows[r["descriptor"]] = (float(r["GHG"]), float(r["WTU"]))
    return rows


CF = carbonfact()


def cf(key):
    """Look up one Carbonfact dataset by a unique substring of its descriptor."""
    hits = [d for d in CF if key in d]
    assert len(hits) == 1, (key, hits)
    return CF[hits[0]]


SPIN = {  # 1 kg of yarn, world average
    "cotton": cf("SPINNING/FOR_WOVEN/RING#PLANT_FIBERS/COTTON?DTEX=150@"),
    "polyester": cf("SPINNING/RING#SYNTHETIC_FIBERS/POLYESTER?DTEX=150@"),
    "elastane": cf("SPINNING/DRY#SYNTHETIC_FIBERS/ELASTANE@"),  # spandex is dry-spun filament
}
DYE = {  # each fibre family needs its own dye class; a blend goes through both baths
    "cotton": ("reactive dyeing (cotton)", cf("DYEING/FABRIC/REACTIVE/BATCH/SOFTFLOW_JET#NATURAL_FIBERS@")),
    "polyester": ("disperse dyeing (polyester)", cf("DYEING/FABRIC/DISPERSE/BATCH/SOFTFLOW_JET#SYNTHETIC_FIBERS@")),
}


def woven_fabric(mix):
    """Factory steps to make 1 kg of dyed woven fabric from a fibre mix {fibre: share}.
    Same chain for every fabric so only the fibre-dependent steps differ:
    spinning (share-weighted) -> sizing -> air-jet weaving -> desizing -> dyeing (one bath per fibre family with
    >= 10% share) -> heat-setting (only if the fabric has synthetic fibre). Material losses are not applied."""
    steps = [("spinning", tuple(sum(SPIN[f][i] * s for f, s in mix.items()) for i in (0, 1)))]
    steps.append(("sizing", cf("PREPARATION/SIZING/NATURAL_FIBERS#")))
    steps.append(("weaving", cf("WEAVING/AIR_JET#ANY?DTEX=150@")))
    steps.append(("desizing", cf("PREPARATION/DESIZING#")))
    for fibre in ("cotton", "polyester"):
        if mix.get(fibre, 0) >= 0.10:
            steps.append(DYE[fibre])
    if mix.get("polyester", 0) + mix.get("elastane", 0) > 0:
        steps.append(("heat-setting", cf("FINISHING/HEAT_SETTING#")))
    return steps


FABRICS = [
    ("100% cotton", {"cotton": 1.0}),
    ("100% polyester", {"polyester": 1.0}),
    ("65/35 poly-cotton", {"polyester": 0.65, "cotton": 0.35}),
    ("95/5 stretch cotton", {"cotton": 0.95, "elastane": 0.05}),
]

# ---------------------------------------------------------------- Norway
NOR = pd.read_csv(os.path.join(RAW, "norway", "NPCGA_datatable_1.1.csv"), sep=";", encoding="utf-8-sig", low_memory=False)
NOR.columns = [c.strip() for c in NOR.columns]
fibre_cols = [c for c in NOR.columns if c.startswith("Fibre") and not c.endswith("[%]")]
SYN = {"polyamid": "polyamide", "polyamide or nylon": "polyamide", "acryl": "acrylic", "polypropylenee": "polypropylene",
       "polyeurathane": "polyurethane", "eco cotton": "cotton"}


def fibres(row):
    """Set of fibre names in layer 1 (the shell fabric), normalised."""
    out = set()
    for c in [c for c in fibre_cols if c.endswith("Layer 1")]:
        v = row[c]
        if isinstance(v, str) and v.strip():
            v = v.strip().lower()
            out.add(SYN.get(v, v))
    return frozenset(out)


NOR["fibres"] = NOR.apply(fibres, axis=1)
kinds = {
    "100% cotton": lambda s: s == {"cotton"},
    "100% polyester": lambda s: s == {"polyester"},
    "65/35 poly-cotton": lambda s: s == {"cotton", "polyester"},  # any poly-cotton ratio
    "95/5 stretch cotton": lambda s: s == {"cotton", "elastane"},  # any cotton/elastane ratio
}

blend_rows, step_rows = [], []
for name, mix in FABRICS:
    steps = woven_fabric(mix)
    co2, water = sum(s[1][0] for s in steps), sum(s[1][1] for s in steps)
    blend_rows.append({"fabric": name, "co2_kg": round(co2, 3), "water_m3": round(water, 3),
                       "n_norway": int(NOR["fibres"].map(kinds[name]).sum())})
    for step, (g, w) in steps:
        step_rows.append({"fabric": name, "step": step, "co2_kg": round(g, 3), "water_m3": round(w, 3)})
blends = pd.DataFrame(blend_rows)
steps_df = pd.DataFrame(step_rows)

# Frame 3 uses the group's agreed figures from the updated Sketch 3 (% change vs 100% cotton, CO2 and water), not the
# full-chain result above. 100% cotton keeps its Carbonfact totals; the other fabrics are scaled from it, and each
# fabric's factory steps are scaled by the same factor so the tooltip breakdown still adds up to the total.
SKETCH3_VS_COTTON = {  # fabric: (CO2 %, water-scarcity %)
    "100% cotton": (0, 0),
    "100% polyester": (-7, -12),
    "65/35 poly-cotton": (31, 22),
    "95/5 stretch cotton": (1, 1),
}
cot = blends.set_index("fabric").loc["100% cotton"]
for name, (dc, dw) in SKETCH3_VS_COTTON.items():
    i = blends.fabric == name
    kc, kw = cot.co2_kg * (1 + dc / 100) / blends.loc[i, "co2_kg"].iloc[0], cot.water_m3 * (1 + dw / 100) / blends.loc[i, "water_m3"].iloc[0]
    blends.loc[i, "co2_kg"] = round(cot.co2_kg * (1 + dc / 100), 3)
    blends.loc[i, "water_m3"] = round(cot.water_m3 * (1 + dw / 100), 3)
    j = steps_df.fabric == name
    steps_df.loc[j, "co2_kg"] = (steps_df.loc[j, "co2_kg"] * kc).round(3)
    steps_df.loc[j, "water_m3"] = (steps_df.loc[j, "water_m3"] * kw).round(3)

for base, col in (("100% cotton", "cotton"), ("100% polyester", "polyester")):
    b = blends.set_index("fabric").loc[base]
    blends[f"co2_vs_{col}_pct"] = ((blends.co2_kg / b.co2_kg - 1) * 100).round(1)
    blends[f"water_vs_{col}_pct"] = ((blends.water_m3 / b.water_m3 - 1) * 100).round(1)
write("blends.csv", blends)
write("blend_steps.csv", steps_df)
facts["norway_garments"] = len(NOR)
facts["norway_with_fibre_label"] = int((NOR["fibres"].map(len) > 0).sum())
facts["norway_blend_share"] = round(float((NOR["fibres"].map(len) > 1).sum() / (NOR["fibres"].map(len) > 0).sum()), 3)

# Frame 2 draft: footprint of making a knitted T-shirt, by stage, per kg of garment
TSHIRT_STEPS = lambda fibre: [
    ("spinning", SPIN.get(fibre) or cf("SPINNING/RING#ANIMAL_FIBERS/WOOL_WORSTED?DTEX=150@")),
    ("knitting", cf("KNITTING/CIRCULAR#ANY?DTEX=150@")),
    ("dyeing", {"cotton": DYE["cotton"][1], "polyester": DYE["polyester"][1],
                "wool": cf("DYEING/FABRIC/ACID/BATCH/SOFTFLOW_JET#WOOL_AND_SILK@")}[fibre]),
    ("sewing", cf("ASSEMBLY/GENERIC#TSHIRT@")),
]
stage_rows = []
for fibre in ("cotton", "polyester", "wool"):
    for step, (g, w) in TSHIRT_STEPS(fibre):
        stage_rows.append({"material": fibre, "stage": step, "co2_kg": round(g, 3), "water_m3": round(w, 3)})
stages = pd.DataFrame(stage_rows)
write("tshirt_stages.csv", stages)
fabric_share = stages[stages.stage != "sewing"].co2_kg.sum() / stages.co2_kg.sum()
facts["fabric_making_share_of_factory_co2"] = round(float(fabric_share), 3)
facts["sewing_share_of_factory_co2"] = round(1 - float(fabric_share), 3)

# T-shirt used by the novel view: median weight of the 2,536 T-shirts in the Norway data
tshirt_kg = float(NOR.loc[NOR["Product type (#)"] == 1, "Weight [gram]"].median()) / 1000
cotton_tshirt = stages[stages.material == "cotton"]
facts["tshirt_weight_kg"] = round(tshirt_kg, 3)
facts["tshirt_factory_co2_kg"] = round(float(cotton_tshirt.co2_kg.sum()) * tshirt_kg, 3)

# Frame 7: condition of garments in the "textile waste, not for reuse" stream
waste = NOR[NOR.Sorted_as == "T_waste"]
grade = waste["Degree-of-wear (Condition scale, 1-5)"].dropna().astype(int)
labels = {1: "Beyond repair", 2: "Unusable but repairable", 3: "Noticeable wear", 4: "Minor signs of use", 5: "Looks new"}
cond = grade.value_counts().sort_index()
write("waste_condition.csv", pd.DataFrame({
    "grade": cond.index, "label": [labels[g] for g in cond.index], "count": cond.values,
    "per100": (cond.values / cond.sum() * 100).round(1), "wearable": [g >= 4 for g in cond.index]}))
tag = waste["Price Tag (0,1)"].dropna()
facts["waste_garments_graded"] = int(cond.sum())
facts["waste_wearable_share"] = round(float((grade >= 4).mean()), 3)
facts["waste_looks_new_share"] = round(float((grade == 5).mean()), 3)
facts["waste_price_tag_share"] = round(float(tag.mean()), 4)

# Frame 6: how many garments are simple enough for fibre-to-fibre recycling (sequential filters)
num = lambda c: pd.to_numeric(NOR[c], errors="coerce").fillna(0)
known = NOR[NOR["Number of fibre (1+)"].notna() & NOR["Number of Layers (1+)"].notna()].copy()
# hard parts that must be cut off before shredding
trims = sum(num(c) for c in ["Number of velcro  (0,1+)", "Number of metal buttons  (0,1+)", "Number of plastic buttons  (0,1+)",
                             "Number of metal zippers  (0,1+)", "Number of plastic zippers  (0,1+)",
                             "Number of metal rivets, eyelets or aglets (0,1+)"]).loc[known.index]
# coatings and decorations that contaminate the fibre stream
decor = sum(num(c) for c in ["Sequins (0,1)", "Number of pearls (0,1+)", "Membrane (0,1)", "Reflector (0,1+)",
                             "All over printed (0,1)", [c for c in NOR.columns if c.startswith("Print >")][0]]).loc[known.index]
steps = [("All garments", pd.Series(True, index=known.index)),
         ("Single fibre (no blends)", known["Number of fibre (1+)"] == 1)]
steps.append(("One layer", steps[-1][1] & (known["Number of Layers (1+)"] == 1)))
steps.append(("No zips, buttons, rivets or velcro", steps[-1][1] & (trims == 0)))
steps.append(("No sequins, membranes or big prints", steps[-1][1] & (decor == 0)))
write("recycling_funnel.csv", pd.DataFrame({
    "step": [s for s, _ in steps], "count": [int(m.sum()) for _, m in steps],
    "per100": [round(m.sum() / len(known) * 100, 1) for _, m in steps]}))
facts["recyclable_share"] = round(float(steps[-1][1].mean()), 3)

# ---------------------------------------------------------------- Sweden
# Exact label frequencies over all 31,638 labelled items (train + test), from the dataset server's statistics.
usage = Counter()
for split in ("train", "test"):
    with open(os.path.join(RAW, "sweden", f"hf_statistics_{split}.json"), encoding="utf-8") as f:
        col = next(c for c in json.load(f)["statistics"] if c["column_name"] == "usage")
    for label, n in col["column_statistics"]["frequencies"].items():
        label = {"Rcycle": "Recycle", "Energy Recovery": "Energy recovery"}.get(label.strip(), label.strip())  # typos
        usage[label] += n
names = {"Reuse": "Resold in Sweden", "Export": "Exported", "Recycle": "Sent to recycling"}
order = ["Resold in Sweden", "Exported", "Sent to recycling", "Other"]
dest = Counter()
for label, n in usage.items():
    dest[names.get(label, "Other")] += n  # Other = repair, remake, energy recovery
total = sum(dest.values())
write("donations.csv", pd.DataFrame({"destination": order, "count": [dest[d] for d in order],
                                     "per100": [round(dest[d] / total * 100, 1) for d in order]}))
facts["sweden_items"] = total
facts["sweden_usage_raw"] = dict(usage.most_common())
facts["sweden_export_share"] = round(dest["Exported"] / total, 3)

# ---------------------------------------------------------------- Eurostat
eu = pd.read_csv(os.path.join(RAW, "eurostat", "env_wasgen_textiles.csv"))
eu = eu[(eu.geo == "EU27_2020") & (eu.unit == "T") & eu.nace_r2.isin(["EP_HH", "C13-C15"])]
eu = eu.dropna(subset=["OBS_VALUE"])
eu["sector"] = eu.nace_r2.map({"EP_HH": "Households", "C13-C15": "Textile & clothing factories"})
eu = eu.rename(columns={"TIME_PERIOD": "year", "OBS_VALUE": "tonnes"})[["sector", "year", "tonnes"]].sort_values(["sector", "year"])
base = eu[eu.year == eu.year.min()].set_index("sector").tonnes
eu["index"] = (eu.tonnes / eu.sector.map(base) * 100).round(1)
write("eu_textile_waste.csv", eu)
last = eu[eu.year == eu.year.max()].set_index("sector")
facts["eu_years"] = [int(eu.year.min()), int(eu.year.max())]
facts["eu_households_tonnes_last"] = int(last.loc["Households", "tonnes"])
facts["eu_households_change"] = round(float(last.loc["Households", "index"] / 100 - 1), 3)
facts["eu_factories_change"] = round(float(last.loc["Textile & clothing factories", "index"] / 100 - 1), 3)

# ---------------------------------------------------------------- Kaggle (sourced industry figures)
kg = pd.read_csv(os.path.join(RAW, "kaggle", "fast_fashion_data.csv"))
SERIES = {
    "Garments produced": ("Garments produced globally", "McKinsey"),
    "US textile waste": ("US textile waste ", "EPA"),
    "Wears per garment": ("Avg times garment worn before discard", "McKinsey"),
}
growth = []
for name, (prefix, _) in SERIES.items():
    s = kg[kg.metric.str.startswith(prefix)].sort_values("year")
    first = s.value.iloc[0]
    for _, r in s.iterrows():
        growth.append({"series": name, "year": int(r.year), "value": r.value, "unit": r.unit,
                       "index": round(r.value / first * 100, 1), "source": r.source})
write("growth.csv", pd.DataFrame(growth))
pick = lambda m: float(kg.loc[kg.metric == m, "value"].iloc[0])
facts["tshirt_water_litres"] = pick("Liters to produce one cotton t-shirt")
facts["wears_2000"] = pick("Avg times garment worn before discard 2000")
facts["wears_2022"] = pick("Avg times garment worn before discard 2022")

with open(os.path.join(OUT, "facts.json"), "w", encoding="utf-8") as f:
    json.dump(facts, f, indent=2)
print(json.dumps(facts, indent=2))
