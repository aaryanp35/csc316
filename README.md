# csc316: The True Cost of Fast Fashion

CSC316 group project. A D3 + Svelte 5 (Vite, TypeScript) story for young consumers (18 to 30) built from the five sketches
chosen in Milestone 4. The visual components are **stubs**; chart code is not written yet.

| Group | Sketch | Component |
| --- | --- | --- |
| 1. What goes into one garment? | 11 Stacked bars by supply-chain stage | `src/lib/components/visuals/StageBars.svelte` |
| | 3 Blends vs pure fibres (diverging bars) | `.../BlendDiverge.svelte` |
| 2. How big is the problem, and where? | 2 Indexed growth since 2000 (lines) | `.../GrowthLines.svelte` |
| | 14 Country production vs carbon (bubbles, year filter) | `.../CountryBubbles.svelte` |
| 3. What can I do about it? | 15 Certified vs not (box plots) | `.../CertBoxplots.svelte` |

Each stub's header comment lists the encodings, controls and tooltip content from its sketch.

## Run

```
npm install
npm run dev       # dev server
npm run build     # static site in dist/ (relative base, works on any static host)
npm run check     # svelte-check / TypeScript
```

## Layout

```
index.html                         Vite entry
src/main.ts, App.svelte, app.css   mount, page structure (three story groups), global styles
src/lib/components/visuals/        one component per sketch, props: { data: Row[] }
src/lib/components/ui/             ChartFrame (responsive svg + margins), VisCard, Tooltip (stub)
src/lib/data/types.ts              one interface per CSV
src/lib/data/load.ts               loads all CSVs with d3.csv + autoType
src/lib/utils/                     palette.ts, format.ts
public/data/                       CSVs + README (schemas, real sources)
scripts/generate_placeholder_data.py   regenerates the placeholder CSVs
```

## Conventions

- D3 does the maths (scales, axes, shapes, stacks); Svelte owns the DOM where practical. Drawing into a bound `<g>` with D3
  is fine for axes or complex layouts.
- Draw inside `ChartFrame`'s `children` snippet, which gives you the inner `width` and `height`.
- Controls (garment, metric, year) are `$state` in the visual, or in `App.svelte` if shared. Pass derived data down.
- Data is placeholder until replaced; keep column names or update `types.ts`.
- The earlier vanilla D3 prototype is in git history (commit "Scaffold D3 app for the five selected fast-fashion visuals").
