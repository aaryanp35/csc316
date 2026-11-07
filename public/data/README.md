# Data

Every file here is **built from the real datasets** by `scripts/pipeline/build_data.py`. Do not edit by hand.

```
bash scripts/pipeline/fetch_all.sh                          # downloads raw data into data/raw/ (git-ignored)
python -I scripts/pipeline/build_data.py data/raw public/data
```

## Sources

| Folder in data/raw | Dataset | What we use |
| --- | --- | --- |
| `carbonfact/` | [Carbonfact open LCA database](https://github.com/carbonfact/lca-database-footwear-apparel) v1.1 (CC BY-SA 4.0) | `impact-scores.csv` per process: GHG (kg CO₂e/kg) and WTU (water scarcity, m³ world-eq/kg), world averages |
| `norway/` | [Norway post-consumer garments](https://zenodo.org/records/20440761) (data table only, not the images) | 16,464 garments: stream (donation / textile waste), condition 1–5, price tag, fibres per layer, layers, trims |
| `sweden/` | [Clothing Dataset for Second-Hand Fashion](https://zenodo.org/records/12518734) | `usage` label (where sorters sent each garment) for all 31,638 labelled items. The Zenodo release is a single 27 GB zip of images; exact label counts come from the authors' Hugging Face copy (`fnauman/fashion-second-hand-front-only-rgb`) |
| `eurostat/` | [Eurostat env_wasgen](https://ec.europa.eu/eurostat/databrowser/view/env_wasgen/default/table) | Textile wastes (W076), EU27_2020, tonnes, households (EP_HH) vs textile/clothing manufacturing (C13–C15), 2004–2024 biennial |
| `kaggle/` | [The Fast Fashion Industry Dataset 2000–2023](https://www.kaggle.com/datasets/harshinigande/the-fast-fashion-industry-dataset-2000-2023) | Sourced figures only: garments produced and wears per garment (McKinsey), US textile waste (EPA), litres per cotton T-shirt (WWF) |

## Files

| File | Used by | Columns | How it is made |
| --- | --- | --- | --- |
| `blends.csv` | Frame 3 (BlendDiverge) | `fabric, co2_kg, water_m3, n_norway, co2_vs_cotton_pct, water_vs_cotton_pct, co2_vs_polyester_pct, water_vs_polyester_pct` | Same factory chain for every fabric, per 1 kg woven fabric: ring spinning (share-weighted; elastane is dry-spun) → sizing → air-jet weaving → desizing → one dye bath per fibre family with ≥10% share (reactive for cotton, disperse for polyester) → heat-setting if any synthetic. `n_norway` = Norway garments whose shell fabric is that fibre mix (any cotton/polyester or cotton/elastane ratio) |
| `blend_steps.csv` | Frame 3 tooltip | `fabric, step, co2_kg, water_m3` | The steps above |
| `tshirt_stages.csv` | Frame 2 draft | `material, stage, co2_kg, water_m3` | Knitted T-shirt per kg: spinning, circular knitting, dyeing, generic T-shirt assembly ("sewing") |
| `growth.csv` | Frame 4 (GrowthLines) | `series, year, value, unit, index, source` | Kaggle rows for the three series; `index` = value / first year × 100 |
| `eu_textile_waste.csv` | Frame 4 side panel | `sector, year, tonnes, index` | Eurostat; `index` = 2004 = 100. Households has no 2012/2014 value |
| `donations.csv` | Frame 5 | `destination, count, per100` | Swedish `usage` labels; typo `Rcycle` → Recycle; repair, remake and energy recovery grouped as Other |
| `recycling_funnel.csv` | Frame 6 | `step, count, per100` | Norway garments with known fibre and layer counts, filtered in order: single fibre → one layer → no zips, buttons, rivets or velcro → no sequins, pearls, membranes, reflectors, all-over or >100 cm² prints |
| `waste_condition.csv` | Frame 7 | `grade, label, count, per100, wearable` | Norway "textile waste, not for reuse" stream, condition 1–5; 4–5 = wearable |
| `facts.json` | Story text, Frame 8–9 | headline numbers | T-shirt CO₂ = cotton T-shirt chain × median weight of the 2,536 Norway T-shirts (140 g) |

## Notes and caveats

- Carbonfact values are factory steps only (no fibre farming, transport, use or end of life) and use a global energy mix.
  Our blend chain gives +23% CO₂ for 65/35 poly-cotton vs 100% cotton; the process book's hand calculation (31%) used
  only spinning and dyeing. Material losses (`Input required (kg)`) are not applied.
- The Kaggle file collects figures from named sources (McKinsey, EPA, WWF); the series have different years, so the
  chart only draws points where a figure exists.
- Recycling-funnel shares depend on the rule set above, and the process book used a slightly different one (19% vs our 22%).
