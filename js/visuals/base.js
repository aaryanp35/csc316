// Base class every visual extends. Subclasses implement wrangle() and draw();
// call update(state) from filters/controls and it redraws.
//
//   constructor(selector, data, options)  -> builds svg, calls wrangle() then draw()
//   wrangle()                             -> derive this.view from this.data + this.state
//   draw()                                -> render this.view with D3 (must be re-runnable)
//   update(patch)                         -> merge patch into this.state, wrangle, draw
//   resize()                              -> automatic on container resize
export class BaseVisual {
  constructor(selector, data, { margin = { top: 24, right: 24, bottom: 48, left: 64 }, aspect = 0.6, state = {} } = {}) {
    this.container = d3.select(selector);
    this.data = data;
    this.margin = margin;
    this.aspect = aspect;
    this.state = state;

    this.svg = this.container.append("svg").attr("role", "img");
    this.g = this.svg.append("g");
    this.measure();
    this.wrangle();
    this.draw();

    new ResizeObserver(() => {
      const prev = this.outerWidth;
      this.measure();
      if (this.outerWidth !== prev) this.draw();
    }).observe(this.container.node());
  }

  measure() {
    this.outerWidth = Math.max(280, this.container.node().clientWidth);
    this.outerHeight = Math.max(260, Math.round(this.outerWidth * this.aspect));
    this.width = this.outerWidth - this.margin.left - this.margin.right;
    this.height = this.outerHeight - this.margin.top - this.margin.bottom;
    this.svg.attr("viewBox", `0 0 ${this.outerWidth} ${this.outerHeight}`);
    this.g.attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  update(patch = {}) {
    Object.assign(this.state, patch);
    this.wrangle();
    this.draw();
  }

  wrangle() {
    this.view = this.data;
  }

  draw() {
    throw new Error("draw() not implemented");
  }

  // Accessible text summary for screen readers.
  describe(text) {
    this.svg.attr("aria-label", text);
  }
}
