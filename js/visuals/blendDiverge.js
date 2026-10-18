// Sketch 3: diverging bars showing percent change versus a 100% cotton baseline, for CO2 and water.
import { BaseVisual } from "./base.js";
import { palette, fmt, attachTooltip } from "../utils.js";

export class BlendDiverge extends BaseVisual {
  constructor(selector, data) {
    super(selector, data, { margin: { top: 40, right: 24, bottom: 40, left: 150 }, aspect: 0.45 });
  }

  wrangle() {
    this.view = this.data.map((d) => ({ fabric: d.fabric, n: d.n_garments, co2: d.co2_pct_change, water: d.water_pct_change, raw: d }));
  }

  draw() {
    const { g, width, height, view } = this;
    const gap = 48;
    const panelW = (width - gap) / 2;
    const extent = d3.max(view, (d) => Math.max(Math.abs(d.co2), Math.abs(d.water)));
    const y = d3.scaleBand().domain(view.map((d) => d.fabric)).range([0, height]).padding(0.3);

    g.selectAll("*").remove();
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

    [["co2", "CO₂ change vs 100% cotton", 0], ["water", "Water change vs 100% cotton", panelW + gap]].forEach(([key, title, dx]) => {
      const x = d3.scaleLinear().domain([-extent, extent]).nice().range([0, panelW]);
      const p = g.append("g").attr("transform", `translate(${dx},0)`);
      p.append("text").attr("class", "panel-title").attr("x", panelW / 2).attr("y", -18).attr("text-anchor", "middle").text(title);
      p.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(4).tickFormat((v) => `${v}%`));
      p.append("line").attr("class", "baseline").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", height);
      const bars = p.selectAll("rect").data(view).join("rect")
        .attr("y", (d) => y(d.fabric)).attr("height", y.bandwidth())
        .attr("x", (d) => x(Math.min(0, d[key]))).attr("width", (d) => Math.abs(x(d[key]) - x(0)))
        .attr("fill", (d) => (d[key] > 0 ? palette.up : palette.down));
      attachTooltip(bars, (d) => `<b>${d.fabric}</b><br>${fmt.pct(d[key])} vs 100% cotton<br>${fmt.int(d.n)} garments sampled`);
      p.selectAll(".val").data(view).join("text").attr("class", "bar-total")
        .attr("y", (d) => y(d.fabric) + y.bandwidth() / 2 + 4)
        .attr("x", (d) => x(d[key]) + (d[key] >= 0 ? 6 : -6)).attr("text-anchor", (d) => (d[key] >= 0 ? "start" : "end"))
        .text((d) => fmt.pct(d[key]));
    });
    this.describe("Diverging bars comparing CO2 and water use of fibre blends against 100% cotton");
  }
}
