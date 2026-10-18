import { StageBars } from "./visuals/stageBars.js";
import { BlendDiverge } from "./visuals/blendDiverge.js";
import { GrowthLines } from "./visuals/growthLines.js";
import { CountryBubbles } from "./visuals/countryBubbles.js";
import { CertBoxplots } from "./visuals/certBoxplots.js";

const num = (keys) => (row) => {
  for (const k of keys) row[k] = +row[k];
  return row;
};

async function load() {
  const [stages, blends, trends, countries, brands] = await Promise.all([
    d3.csv("data/lca_stages.csv", num(["kg_co2e", "water_litres"])),
    d3.csv("data/blends.csv", num(["co2_pct_change", "water_pct_change", "co2_kg", "water_litres", "n_garments"])),
    d3.csv("data/industry_trends.csv", num(["year", "production_index", "water_index", "wears_per_garment_index", "emissions_index"])),
    d3.csv("data/country_footprint.csv", num(["year", "avg_monthly_production_t", "monthly_co2_t"])),
    d3.csv("data/brand_certification.csv", num(["certified", "carbon_kg_per_tonne", "water_m3_per_tonne", "waste_kg_per_tonne", "avg_price_usd"])),
  ]);
  return { stages, blends, trends, countries, brands };
}

// Fill a <select> or button group and call onChange(value).
function bindSelect(id, options, initial, onChange) {
  const sel = d3.select(id);
  sel.selectAll("option").data(options).join("option").attr("value", (d) => d.value).text((d) => d.label);
  sel.property("value", initial).on("change", (e) => onChange(e.target.value));
}

load()
  .then(({ stages, blends, trends, countries, brands }) => {
    const stageBars = new StageBars("#vis-stages", stages);
    const garments = Array.from(new Set(stages.map((d) => d.garment)));
    bindSelect("#ctl-garment", garments.map((g) => ({ value: g, label: g })), stageBars.state.garment, (v) => stageBars.update({ garment: v }));
    bindSelect("#ctl-metric", [{ value: "co2", label: "Carbon (kg CO₂e)" }, { value: "water", label: "Water (litres)" }], "co2", (v) => stageBars.update({ metric: v }));

    new BlendDiverge("#vis-blends", blends);
    new GrowthLines("#vis-growth", trends);

    const bubbles = new CountryBubbles("#vis-countries", countries);
    const slider = d3.select("#ctl-year").attr("min", d3.min(bubbles.years)).attr("max", d3.max(bubbles.years)).attr("step", 1).property("value", bubbles.state.year);
    slider.on("input", (e) => {
      d3.select("#ctl-year-label").text(e.target.value);
      bubbles.update({ year: +e.target.value });
    });
    d3.select("#ctl-year-label").text(bubbles.state.year);

    new CertBoxplots("#vis-cert", brands);
  })
  .catch((err) => {
    console.error(err);
    d3.select("#load-error").style("display", "block").text(`Could not load data: ${err.message}. Serve the folder over http (see README).`);
  });
