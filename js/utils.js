// Shared helpers: tooltip, number formats, palette.

export const palette = {
  stage: { fibre: "#8c6d31", spinning: "#3b6fb6", dyeing: "#c2418f", sewing: "#9a9a9a", transport: "#e0a030" },
  tier: { high: "#d94841", medium: "#e8a33d", low: "#5aa469" },
  certified: { yes: "#3b8f6b", no: "#8a8f98" },
  line: { production: "#c8553d", water: "#3b6fb6", wears: "#6a7bd1", emissions: "#555" },
  up: "#c8553d",
  down: "#3b8f6b",
};

export const fmt = {
  int: d3.format(",.0f"),
  one: d3.format(",.1f"),
  pct: (v) => `${v > 0 ? "+" : ""}${d3.format(".0f")(v)}%`,
};

const tip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

export const tooltip = {
  show(event, html) {
    tip.html(html).style("opacity", 1);
    this.move(event);
  },
  move(event) {
    const { innerWidth } = window;
    const w = tip.node().offsetWidth;
    const x = Math.min(event.clientX + 14, innerWidth - w - 8);
    tip.style("left", `${x}px`).style("top", `${event.clientY + 14}px`);
  },
  hide() {
    tip.style("opacity", 0);
  },
};

export function attachTooltip(selection, htmlFn) {
  selection
    .on("mouseenter mousemove", (event, d) => tooltip.show(event, htmlFn(d)))
    .on("mouseleave", () => tooltip.hide());
}
