import { format } from "d3";

export const fmtInt = format(",.0f");
export const fmtOne = format(",.1f");
export const fmtTwo = format(",.2f");
/** Up to one decimal, trailing zero dropped: 130 -> "130", 17.7 -> "17.7" */
export const fmtNum = format(",.1~f");
/** Signed whole percent; values that round to zero print as "0%" (never "−0%"). */
export const fmtPct = (v: number) => {
  const r = Math.round(v);
  return r === 0 ? "0%" : `${r > 0 ? "+" : ""}${format(".0f")(r)}%`;
};
/** 0.689 -> "69%" */
export const fmtShare = (v: number) => `${Math.round(v * 100)}%`;
