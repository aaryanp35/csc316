// Sketch 15: small multiples of box plots, certified versus not, for carbon, water, waste, price.
import { BaseVisual } from "./base.js";
import { palette, fmt, attachTooltip } from "../utils.js";

const METRICS = [
  { key: "carbon_kg_per_tonne", title: "Carbon footprint (kg CO₂e per t)" },
  { key: "water_m3_per_tonne", title: "Water usage (m³ per t)" },
  { key: "waste_kg_per_tonne", title: "Waste produced (kg per t)" },
  { key: "avg_price_usd", title: "Avg price (USD)" },
];

export function boxStats(values) {
  const v = values.slice().sort(d3.ascending);
  const q1 = d3.quantile(v, 0.25), med = d3.quantile(v, 0.5), q3 = d3.quantile(v, 0.75);
  const iqr = q3 - q1;
  const lo = d3.min(v.filter((d) => d >= q1 - 1.5 * iqr));
  const hi = d3.max(v.filter((d) => d <= q3 + 1.5 * iqr));
  return { q1, med, q3, lo, hi, outliers: v.filter((d) => d < lo || d > hi), n: v.length };
}

export class CertBoxplots extends BaseVisual {
  constructor(selector, data) {
    super(selector, data, { margin: { top: 28, right: 12, bottom: 32, left: 52 }, aspect: 0.9 });
  }

  wrangle() {
    this.view = METRICS.map((m) => ({
      ...m,
      groups: [0, 1].map((c) => ({ certified: c, stats: boxStats(this.data.filter((d) => d.certified === c).map((d) => d[m.key])) })),
    }));
  }

  draw() {
    const { g, width, height, view } = this;
    const cols = width < 520 ? 1 : 2;
    const rows = Math.ceil(view.length / cols);
    const gapX = 40, gapY = 56;
    const cellW = (width - gapX * (cols - 1)) / cols;
    const cellH = (height - gapY * (rows - 1)) / rows;

    g.selectAll("*").remove();
    view.forEach((m, i) => {
      const cell = g.append("g").attr("transform", `translate(${(i % cols) * (cellW + gapX)},${Math.floor(i / cols) * (cellH + gapY)})`);
      const top = d3.max(m.groups, (d) => d3.max([d.stats.hi, ...d.stats.outliers]));
      const y = d3.scaleLinear().domain([0, top * 1.05]).nice().range([cellH, 0]);
      const x = d3.scaleBand().domain([0, 1]).range([0, cellW]).padding(0.45);
      cell.append("text").attr("class", "panel-title").attr("x", 0).attr("y", -10).text(m.title);
      cell.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4));
      cell.append("g").attr("class", "axis").attr("transform", `translate(0,${cellH})`)
        .call(d3.axisBottom(x).tickFormat((c) => (c ? "Certified" : "No certification")).tickSize(0)).select(".domain").remove();

      m.groups.forEach(({ certified, stats: s }) => {
        const cx = x(certified) + x.bandwidth() / 2;
        const color = palette.certified[certified ? "yes" : "no"];
        const b = cell.append("g");
        b.append("line").attr("class", "whisker").attr("x1", cx).attr("x2", cx).attr("y1", y(s.lo)).attr("y2", y(s.hi));
        [s.lo, s.hi].forEach((v) => b.append("line").attr("class", "whisker").attr("x1", cx - x.bandwidth() / 4).attr("x2", cx + x.bandwidth() / 4).attr("y1", y(v)).attr("y2", y(v)));
        const box = b.append("rect").attr("x", x(certified)).attr("width", x.bandwidth()).attr("y", y(s.q3)).attr("height", y(s.q1) - y(s.q3))
          .attr("fill", color).attr("fill-opacity", 0.35).attr("stroke", color).attr("stroke-width", 1.5);
        b.append("line").attr("x1", x(certified)).attr("x2", x(certified) + x.bandwidth()).attr("y1", y(s.med)).attr("y2", y(s.med)).attr("stroke", color).attr("stroke-width", 3);
        b.selectAll("circle").data(s.outliers).join("circle").attr("cx", cx).attr("cy", (d) => y(d)).attr("r", 3).attr("fill", color);
        attachTooltip(box, () => `<b>${certified ? "Certified" : "No certification"}</b><br>median ${fmt.one(s.med)}<br>IQR ${fmt.one(s.q1)} to ${fmt.one(s.q3)}<br>${s.n} brands`);
      });
    });
    this.describe("Box plots comparing certified and non-certified brands on carbon, water, waste and price");
  }
}
