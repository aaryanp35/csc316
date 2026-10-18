// Sketch 14: bubble scatter of production versus CO2 per country, filterable by year.
// Bubble colour = carbon tier (terciles of CO2 per tonne produced).
import { BaseVisual } from "./base.js";
import { palette, fmt, attachTooltip } from "../utils.js";

export class CountryBubbles extends BaseVisual {
  constructor(selector, data) {
    data.forEach((d) => (d.intensity = d.monthly_co2_t / d.avg_monthly_production_t));
    const years = Array.from(new Set(data.map((d) => d.year))).sort(d3.ascending);
    super(selector, data, { state: { year: years[years.length - 1] }, aspect: 0.62, margin: { top: 24, right: 24, bottom: 56, left: 72 } });
    this.years = years;
  }

  wrangle() {
    const rows = this.data.filter((d) => d.year === this.state.year);
    const cuts = d3.scaleQuantile().domain(rows.map((d) => d.intensity)).range(["low", "medium", "high"]);
    this.view = rows.map((d) => ({ ...d, tier: cuts(d.intensity) }));
  }

  draw() {
    const { g, width, height, view } = this;
    const x = d3.scaleLinear().domain(d3.extent(this.data, (d) => d.avg_monthly_production_t)).nice().range([0, width]);
    const y = d3.scaleLinear().domain(d3.extent(this.data, (d) => d.monthly_co2_t)).nice().range([height, 0]);
    const r = d3.scaleSqrt().domain([0, d3.max(this.data, (d) => d.intensity)]).range([4, 16]);

    g.selectAll("*").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(6));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));
    g.append("text").attr("class", "axis-label").attr("x", width / 2).attr("y", height + 44).attr("text-anchor", "middle").text("Avg monthly production (tonnes)");
    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -56).attr("text-anchor", "middle").text("Monthly CO₂e (tonnes)");

    const dots = g.selectAll("circle").data(view, (d) => d.country).join("circle")
      .attr("cx", (d) => x(d.avg_monthly_production_t)).attr("cy", (d) => y(d.monthly_co2_t))
      .attr("r", (d) => r(d.intensity)).attr("fill", (d) => palette.tier[d.tier]).attr("fill-opacity", 0.85).attr("stroke", "#fff");
    attachTooltip(dots, (d) => `<b>${d.country}</b> (${d.year})<br>${fmt.int(d.avg_monthly_production_t)} t produced<br>${fmt.int(d.monthly_co2_t)} t CO₂e<br>${d.intensity.toFixed(2)} t CO₂e per t`);
    g.selectAll(".name").data(view, (d) => d.country).join("text").attr("class", "dot-label")
      .attr("x", (d) => x(d.avg_monthly_production_t) + r(d.intensity) + 4).attr("y", (d) => y(d.monthly_co2_t) + 4).text((d) => d.country);

    const legend = g.append("g").attr("class", "legend").attr("transform", "translate(8,0)");
    ["high", "medium", "low"].forEach((t, i) => {
      const row = legend.append("g").attr("transform", `translate(0,${i * 18})`);
      row.append("circle").attr("r", 6).attr("cx", 6).attr("cy", 6).attr("fill", palette.tier[t]);
      row.append("text").attr("x", 20).attr("y", 10).text(`${t} carbon intensity`);
    });
    this.describe(`Bubble chart of production versus CO2 emissions by country in ${this.state.year}`);
  }
}
