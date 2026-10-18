import { format } from "d3";

export const fmtInt = format(",.0f");
export const fmtOne = format(",.1f");
export const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${format(".0f")(v)}%`;
