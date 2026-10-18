# Data

Every CSV here is **placeholder data** produced by `scripts/generate_placeholder_data.py` so the charts render during
development. Do not present these numbers as fact. Replace each file with the real, cleaned data and keep the column names
(or update the matching `num([...])` list in `js/main.js` and the visual's `wrangle()`).

| File | Visual (sketch) | Columns | Real source to use |
| --- | --- | --- | --- |
| `lca_stages.csv` | Stage bars (11) | `garment, material, stage, kg_co2e, water_litres` | Carbonfact open LCA database (github.com/carbonfact/lca-database-footwear-apparel). Stages: fibre, spinning, dyeing, sewing, transport |
| `blends.csv` | Blend diverging bars (3) | `fabric, co2_pct_change, water_pct_change, co2_kg, water_litres, n_garments` | Carbonfact; percent change is versus 100% cotton |
| `industry_trends.csv` | Growth lines (2) | `year, production_index, water_index, wears_per_garment_index, emissions_index` | Kaggle fast-fashion 2000-2023 set (verify it is not synthetic); index each series to 2000 = 100 |
| `country_footprint.csv` | Country bubbles (14) | `country, year, avg_monthly_production_t, monthly_co2_t` | "True Cost of Fast Fashion Impact" Kaggle set; Carbonfact/energy mix for country adjustment |
| `brand_certification.csv` | Certification box plots (15) | `brand, certified (0/1), carbon_kg_per_tonne, water_m3_per_tonne, waste_kg_per_tonne, avg_price_usd` | Kaggle sustainable fashion sets; check for synthetic data first |

Data integration notes from the process book: standardize units, garment categories and fibres before combining sources, and
avoid direct comparisons where methodologies differ.
