// One interface per CSV in public/data. Keep in sync with public/data/README.md.

export interface StageRow { garment: string; material: string; stage: string; kg_co2e: number; water_litres: number }
export interface BlendRow { fabric: string; co2_pct_change: number; water_pct_change: number; co2_kg: number; water_litres: number; n_garments: number }
export interface TrendRow { year: number; production_index: number; water_index: number; wears_per_garment_index: number; emissions_index: number }
export interface CountryRow { country: string; year: number; avg_monthly_production_t: number; monthly_co2_t: number }
export interface BrandRow { brand: string; certified: 0 | 1; carbon_kg_per_tonne: number; water_m3_per_tonne: number; waste_kg_per_tonne: number; avg_price_usd: number }

export interface Dataset {
  stages: StageRow[];
  blends: BlendRow[];
  trends: TrendRow[];
  countries: CountryRow[];
  brands: BrandRow[];
}
