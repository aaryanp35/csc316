import { csv, json, autoType } from "d3";
import type { BlendRow, BlendStepRow, Dataset, EuWasteRow, Facts, GrowthRow } from "./types";

const url = (file: string) => `${import.meta.env.BASE_URL}data/${file}`;

// autoType converts numeric columns; strings (fabric, series, ...) stay strings.
export async function loadDataset(): Promise<Dataset> {
  const [blends, blendSteps, growth, euWaste, facts] = await Promise.all([
    csv(url("blends.csv"), autoType) as Promise<BlendRow[]>,
    csv(url("blend_steps.csv"), autoType) as Promise<BlendStepRow[]>,
    csv(url("growth.csv"), autoType) as Promise<GrowthRow[]>,
    csv(url("eu_textile_waste.csv"), autoType) as Promise<EuWasteRow[]>,
    json(url("facts.json")) as Promise<Facts>,
  ]);
  return { blends, blendSteps, growth, euWaste, facts };
}
