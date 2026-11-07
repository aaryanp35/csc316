# csc316: The True Cost of Fast Fashion

CSC316 group project (Shaurya Sareen, Aaryan Patel, Kai Tano Bague). A D3 + Svelte 5 (Vite, TypeScript) data story for
young consumers (18 to 30), following the Milestone 6 storyboard: one T-shirt's hidden cost → how it is made → buying
more and wearing less → where clothes end up → what you can do.

**Main message:** much of a garment's footprint is fixed before purchase, and most discarded clothes are still wearable,
so the most effective thing a shopper can do is wear each piece longer.

| Chapter | Storyboard frame | Status | Component |
| --- | --- | --- | --- |
| Hook | 1. One T-shirt, 2,700 L | done (hero) | `src/App.svelte` |
| I. Making it | 2. Making the fabric | placeholder; draft in `drafts/` | `Placeholder` |
| | 3. Blends are worse (Sketch 3) | **functional D3** | `src/lib/components/visuals/BlendDiverge.svelte` |
| II. Buying more | 4. Growth since 2000 + EU waste moved home (Sketch 2) | **functional D3** | `.../GrowthLines.svelte` |
| III. After you | 5. Where donations go | placeholder | `Placeholder` |
| | 6. Is recycling the fix? | placeholder | `Placeholder` |
| | 7. Thrown out, still wearable | placeholder; draft in `drafts/` | `Placeholder` |
| IV. What you can do | 8. The "so what" receipt | done (HTML) | `src/App.svelte` |
| | 9. Wear it longer (novel view) | **functional D3** | `.../WearItLonger.svelte` |

Every number on the page comes from the cleaned data; see `public/data/README.md`.

## Run

```
npm install
npm run dev       # dev server
npm run build     # static site in dist/ (relative base, works on any static host)
npm run check     # svelte-check / TypeScript
```

## Data pipeline

```
bash scripts/pipeline/fetch_all.sh                           # Carbonfact, Norway, Sweden, Eurostat, Kaggle -> data/raw/
python -I scripts/pipeline/build_data.py data/raw public/data # clean + calculate -> public/data/*.csv, facts.json
```

Needs Python 3 with pandas. Raw data is git-ignored; the cleaned outputs in `public/data/` are committed.

## Layout

```
index.html                         Vite entry
src/main.ts, App.svelte, app.css   mount, story page (nav, hero, chapters, receipt, footer), global tokens (light + dark)
src/lib/components/visuals/        BlendDiverge (frame 3), GrowthLines (frame 4), WearItLonger (frame 9)
src/lib/components/ui/             ChartFrame (responsive svg + margins), VisCard (frame card), Tooltip, Placeholder
src/lib/data/types.ts, load.ts     one interface per data file; loads them with d3.csv / d3.json
src/lib/utils/format.ts            number formatting
public/data/                       cleaned data + README (sources, method, caveats)
scripts/pipeline/                  fetch_all.sh, build_data.py
drafts/                            two standalone design drafts (frames 2 and 7) + PNG screenshots; not part of the site
```

## Conventions

- D3 does the maths (scales, axes, shapes, stacks); Svelte owns the DOM. Draw inside `ChartFrame`'s `children` snippet.
- Colours come from CSS tokens in `app.css` (validated colour-blind-safe categorical slots, red/blue diverging for worse/better).
- Every chart has a hover/keyboard layer and a "Show the numbers" table.
