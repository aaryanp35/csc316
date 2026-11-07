// One interface per file in public/data (built by scripts/pipeline/build_data.py). Keep in sync with public/data/README.md.

/** Carbonfact: making 1 kg of dyed woven fabric. water_m3 = water-scarcity score (m³ world-eq). */
export interface BlendRow {
  fabric: string; co2_kg: number; water_m3: number; n_norway: number;
  co2_vs_cotton_pct: number; water_vs_cotton_pct: number; co2_vs_polyester_pct: number; water_vs_polyester_pct: number;
}
export interface BlendStepRow { fabric: string; step: string; co2_kg: number; water_m3: number }
/** Kaggle "Fast Fashion Industry 2000-2023" (McKinsey, EPA); index = value / first year's value × 100. */
export interface GrowthRow { series: string; year: number; value: number; unit: string; index: number; source: string }
/** Eurostat env_wasgen, EU27, textile waste (W076); index = 2004 = 100. */
export interface EuWasteRow { sector: string; year: number; tonnes: number; index: number }

export interface Facts {
  tshirt_water_litres: number; tshirt_factory_co2_kg: number; tshirt_weight_kg: number;
  wears_2000: number; wears_2022: number;
  fabric_making_share_of_factory_co2: number; sewing_share_of_factory_co2: number;
  norway_blend_share: number; norway_garments: number;
  waste_wearable_share: number; waste_looks_new_share: number; waste_price_tag_share: number; waste_garments_graded: number;
  recyclable_share: number; sweden_export_share: number; sweden_items: number;
  eu_households_change: number; eu_factories_change: number; eu_households_tonnes_last: number; eu_years: [number, number];
}

export interface Dataset {
  blends: BlendRow[];
  blendSteps: BlendStepRow[];
  growth: GrowthRow[];
  euWaste: EuWasteRow[];
  facts: Facts;
}
