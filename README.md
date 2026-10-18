# csc316: The True Cost of Fast Fashion

CSC316 group project. A scrolling D3 story for young consumers (18 to 30) in three parts, built from the five sketches
chosen in Milestone 4.

| Group | Sketch | Visual | File |
| --- | --- | --- | --- |
| 1. What goes into one garment? | 11 | Stacked bars by supply-chain stage | `js/visuals/stageBars.js` |
| | 3 | Blends vs pure fibres (diverging bars) | `js/visuals/blendDiverge.js` |
| 2. How big is the problem, and where? | 2 | Indexed growth since 2000 (lines) | `js/visuals/growthLines.js` |
| | 14 | Country production vs carbon (bubbles, year filter) | `js/visuals/countryBubbles.js` |
| 3. What can I do about it? | 15 | Certified vs not (box plots) | `js/visuals/certBoxplots.js` |

## Run

No build step. Serve the folder over http (ES modules and `d3.csv` do not work from `file://`):

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Layout

```
index.html            page and section structure
css/style.css         styles and chart text classes
js/main.js            loads CSVs, creates each visual, wires controls
js/utils.js           palette, number formats, tooltip
js/visuals/base.js    BaseVisual: svg setup, resize, update(); extend this
js/visuals/*.js       one class per sketch
js/lib/d3.min.js      D3 v7.9.0 (vendored)
data/                 CSVs plus data/README.md (schema and sources)
scripts/              placeholder data generator
```

## Adding or changing a visual

1. Extend `BaseVisual`, implement `wrangle()` (derive `this.view` from `this.data` and `this.state`) and `draw()`
   (must be safe to run repeatedly; it clears `this.g` first).
2. Add a `.vis-card` with a `div.vis#vis-...` in `index.html`.
3. Construct it in `js/main.js` and call `visual.update({...})` from controls.

## Next steps (from the process book)

- Swap placeholder CSVs for the cleaned real data (see `data/README.md`) and verify the Kaggle sets are not synthetic.
- Add plain-language annotations and clearer tooltips for the box plots, as planned.
- Relatable units ("days of drinking water", "km driven") and the ~$20 garment assumption in the stage chart.
- Sketch 15 also mentions a bubble scatterplot; not built yet.
