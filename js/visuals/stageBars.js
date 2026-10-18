// Sketch 11: stacked bars of footprint by supply-chain stage, one bar per material.
import { BaseVisual } from "./base.js";
import { palette, fmt, attachTooltip } from "../utils.js";

const STAGES = ["fibre", "spinning", "dyeing", "sewing", "transport"];
const METRICS = {
  co2: { field: "kg_co2e", label: "GHG footprint (kg CO₂e)" },
  water: { field: "water_litres", label: "Water use (litres)" },
};

export class StageBars extends BaseVisual {
  constructor(selector, data) {
    super(selector, data, { state: { garment: "t-shirt", metric: "co2" }, aspect: 0.62 });
  }

  wrangle() {
    const { garment, metric } = this.state;
    const field = METRICS[metric].field;
    const rows = this.data.filter((d) => d.garment === garment);
    const byMaterial = d3.group(rows, (d) => d.material);
    this.view = Array.from(byMaterial, ([material, rs]) => {
      const values = Object.fromEntries(STAGES.map((s) => [s, d3.sum(rs.filter((r) => r.stage === s), (r) => r[field])]));
      return { material, values, total: d3.sum(STAGES, (s) => values[s]) };
    });
  }

  draw() {
    const { g, width, height, view } = this;
    const x = d3.scaleBand().domain(view.map((d) => d.material)).range([0, width]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(view, (d) => d.total) * 1.1]).nice().range([height, 0]);
    const stack = d3.stack().keys(STAGES).value((d, k) => d.values[k])(view);

    g.selectAll("*").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -this.margin.left + 14)
      .attr("text-anchor", "middle").text(METRICS[this.state.metric].label);

    const layers = g.selectAll(".layer").data(stack).join("g").attr("class", "layer").attr("fill", (d) => palette.stage[d.key]);
    const rects = layers.selectAll("rect").data((d) => d.map((v) => ({ ...v, stage: d.key }))).join("rect")
      .attr("x", (d) => x(d.data.material)).attr("width", x.bandwidth())
      .attr("y", (d) => y(d[1])).attr("height", (d) => y(d[0]) - y(d[1]));
    attachTooltip(rects, (d) => `<b>${d.data.material}</b> · ${d.stage}<br>${fmt.one(d[1] - d[0])} (${fmt.int(((d[1] - d[0]) / d.data.total) * 100)}% of total)`);

    g.selectAll(".total").data(view).join("text").attr("class", "bar-total").attr("text-anchor", "middle")
      .attr("x", (d) => x(d.material) + x.bandwidth() / 2).attr("y", (d) => y(d.total) - 6).text((d) => fmt.one(d.total));

    const legend = g.append("g").attr("class", "legend").attr("transform", `translate(${width - 90},0)`);
    STAGES.slice().reverse().forEach((s, i) => {
      const row = legend.append("g").attr("transform", `translate(0,${i * 18})`);
      row.append("rect").attr("width", 12).attr("height", 12).attr("fill", palette.stage[s]);
      row.append("text").attr("x", 18).attr("y", 10).text(s);
    });
    this.describe(`Stacked bars of ${METRICS[this.state.metric].label} by supply-chain stage for ${this.state.garment}`);
  }
}
