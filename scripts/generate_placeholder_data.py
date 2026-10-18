"""Writes small PLACEHOLDER csv files into data/ so every visual renders during development.

The numbers are illustrative only (loosely based on the hand sketches). Replace each file
with the real, cleaned data described in data/README.md and keep the same column names.
Run: python3 scripts/generate_placeholder_data.py
"""
import csv
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data"
rng = random.Random(316)


def write(name, header, rows):
    with open(OUT / name, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


# Sketch 11: footprint per supply-chain stage, per material and garment
stages = ["fibre", "spinning", "dyeing", "sewing", "transport"]
share = {  # share of the total CO2e / water by stage
    "cotton": ([0.12, 0.38, 0.30, 0.08, 0.12], [0.90, 0.04, 0.04, 0.01, 0.01]),
    "polyester": ([0.28, 0.20, 0.30, 0.08, 0.14], [0.05, 0.20, 0.70, 0.04, 0.01]),
    "wool": ([0.40, 0.25, 0.18, 0.08, 0.09], [0.60, 0.15, 0.22, 0.02, 0.01]),
}
totals = {"cotton": (10.29, 2700), "polyester": (9.88, 120), "wool": (12.10, 1100)}  # kg CO2e, litres (T-shirt)
garment_scale = {"t-shirt": 1.0, "jeans": 3.2, "dress": 1.8}
rows = []
for g, k in garment_scale.items():
    for m, (co2s, ws) in share.items():
        for i, s in enumerate(stages):
            rows.append([g, m, s, round(totals[m][0] * k * co2s[i], 3), round(totals[m][1] * k * ws[i], 1)])
write("lca_stages.csv", ["garment", "material", "stage", "kg_co2e", "water_litres"], rows)

# Sketch 3: blends versus 100% cotton (percent change, so 0 = same as cotton)
write("blends.csv", ["fabric", "co2_pct_change", "water_pct_change", "co2_kg", "water_litres", "n_garments"], [
    ["100% polyester", -4, -87, 9.88, 350, 1777],
    ["65/35 poly-cotton", 25, 22, 12.9, 3300, 2410],
    ["95/5 stretch cotton", 4, 5, 10.7, 2840, 1850],
])

# Sketch 2: indexed growth since 2000 (2000 = 100)
years = [2000, 2005, 2010, 2015, 2020, 2023]
prod = [100, 138, 172, 205, 262, 305]
water = [100, 122, 148, 165, 180, 190]
wears = [100, 92, 80, 68, 58, 50]
co2 = [100, 112, 108, 125, 119, 133]
write("industry_trends.csv", ["year", "production_index", "water_index", "wears_per_garment_index", "emissions_index"],
      list(zip(years, prod, water, wears, co2)))

# Sketch 14: country production and footprint over time
countries = {  # avg monthly production (tonnes), tonnes CO2e per tonne produced
    "China": (505, 2.6), "Bangladesh": (503, 1.5), "India": (470, 2.3), "Turkey": (440, 2.7),
    "Indonesia": (498, 2.5), "Vietnam": (480, 2.1), "Brazil": (452, 2.4), "Germany": (487, 1.9), "UK": (500, 1.6),
}
rows = []
for c, (p, i) in countries.items():
    for y in range(2018, 2024):
        prod_t = p * (1 + 0.02 * (y - 2018)) * rng.uniform(0.97, 1.03)
        rows.append([c, y, round(prod_t, 1), round(prod_t * i * rng.uniform(0.95, 1.05), 1)])
write("country_footprint.csv", ["country", "year", "avg_monthly_production_t", "monthly_co2_t"], rows)

# Sketch 15: brand footprints by certification
rows = []
for n in range(80):
    cert = n % 2
    base = 0.75 if cert else 1.0
    rows.append([f"Brand {n + 1:02d}", cert,
                 round(rng.gauss(1500, 450) * base), round(rng.gauss(80, 20) * base, 1),
                 round(max(5, rng.gauss(55, 18) * base), 1), round(max(8, rng.gauss(60, 20) * (1.4 if cert else 1)), 2)])
write("brand_certification.csv", ["brand", "certified", "carbon_kg_per_tonne", "water_m3_per_tonne", "waste_kg_per_tonne", "avg_price_usd"], rows)
