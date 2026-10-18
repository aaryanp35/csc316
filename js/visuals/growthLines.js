// Sketch 2: indexed growth since 2000 (2000 = 100) for production, water, and wears per garment,
// with a small emissions inset.
import { BaseVisual } from "./base.js";
import { palette, attachTooltip } from "../utils.js";

const SERIES = [
  { key: "production_index", label: "Garments made", color: palette.line.production },
  { key: "water_index", label: "Textile water use", color: palette.line.water },
  { key: "wears_per_garment_index", label: "Times each item is worn", color: palette.line.wears },
];

export class GrowthLines extends BaseVisual {
  constructor(selector, data) {
    super(selector, data, { margin: { top: 24, right: 150, bottom: 48, left: 56 }, aspect: 0.55 });
  }

  draw() {
    const { g, width, height, data } = this;
    const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.year)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d3.max(SERIES, (s) => d[s.key])) * 1.05]).nice().range([height, 0]);

    g.selectAll("*").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(6));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -40)
      .attr("text-anchor", "middle").text("Index (2000 = 100)");
    g.append("line").attr("class", "baseline dashed").attr("x1", 0).attr("x2", width).attr("y1", y(100)).attr("y2", y(100));

    SERIES.forEach((s) => {
      g.append("path").datum(data).attr("fill", "none").attr("stroke", s.color).attr("stroke-width", 2.5)
        .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d[s.key])));
      const pts = g.selectAll(`.pt-${s.key}`).data(data).join("circle").attr("class", `pt-${s.key}`)
        .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d[s.key])).attr("r", 4.5).attr("fill", s.color);
      attachTooltip(pts, (d) => `<b>${d.year}</b><br>${s.label}: ${d[s.key]}`);
      const last = data[data.length - 1];
      g.append("text").attr("class", "line-label").attr("x", width + 8).attr("y", y(last[s.key]) + 4).attr("fill", s.color).text(s.label);
    });
    this.describe("Line chart of garments made, water use and wears per garment indexed to 2000");
  }
}
