import { csv, autoType } from "d3";
import type { BlendRow, BrandRow, CountryRow, Dataset, StageRow, TrendRow } from "./types";

const url = (file: string) => `${import.meta.env.BASE_URL}data/${file}`;

// autoType converts numeric columns; strings (garment, material, ...) stay strings.
export async function loadDataset(): Promise<Dataset> {
  const [stages, blends, trends, countries, brands] = await Promise.all([
    csv(url("lca_stages.csv"), autoType) as Promise<StageRow[]>,
    csv(url("blends.csv"), autoType) as Promise<BlendRow[]>,
    csv(url("industry_trends.csv"), autoType) as Promise<TrendRow[]>,
    csv(url("country_footprint.csv"), autoType) as Promise<CountryRow[]>,
    csv(url("brand_certification.csv"), autoType) as Promise<BrandRow[]>,
  ]);
  return { stages, blends, trends, countries, brands };
}
