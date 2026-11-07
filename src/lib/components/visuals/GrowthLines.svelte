<!-- Sketch 2 + storyboard frame 4: growth since 2000 (lines). Data: Kaggle "Fast Fashion Industry 2000-2023"
(McKinsey garments and wears, EPA US textile waste) and Eurostat env_wasgen (EU textile waste by sector).
Main: x = year, y = growth index (first year = 100); one line per measure, dot = year with a real figure (series
have different years), dashed baseline at 100. Side panel: EU textile waste from households vs textile factories,
indexed to 2004 = 100; a dashed segment bridges years Eurostat did not publish.
Hover/arrow keys: crosshair snaps to the nearest year with data; tooltip lists every measure that has a figure then.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { scaleLinear, line, curveMonotoneX, extent, max, pointer, group } from "d3";
  import ChartFrame from "../ui/ChartFrame.svelte";
  import Tooltip from "../ui/Tooltip.svelte";
  import { fmtInt, fmtNum, fmtOne, fmtPct } from "../../utils/format";
  import type { EuWasteRow, GrowthRow } from "../../data/types";

  interface Props { data: GrowthRow[]; eu: EuWasteRow[] }
  let { data, eu }: Props = $props();

  const series = [
    { key: "Garments produced", label: "Clothes made", color: "var(--series-1)" },
    { key: "US textile waste", label: "US textile waste", color: "var(--series-2)" },
    { key: "Wears per garment", label: "Wears per garment", color: "var(--series-3)" },
  ];
  const bySeries = $derived(group([...data].sort((a, b) => a.year - b.year), (d) => d.series));
  const pts = (k: string) => bySeries.get(k) ?? [];
  const firstOf = (k: string) => pts(k)[0];
  const lastOf = (k: string) => pts(k)[pts(k).length - 1];
  const years = $derived([...new Set(data.map((d) => d.year))].sort((a, b) => a - b));
  const firstYear = $derived(years[0]);
  const times = (v: number) => `${+(v / 100).toFixed(1)}×`; // 260 -> "2.6×"
  const unitOf = (k: string) => {
    const u = firstOf(k)?.unit ?? "";
    return u === "billion pieces" ? "bn garments" : u === "million tons" ? "Mt" : u;
  };

  // Headline numbers come from the data so they stay right when the pipeline reruns.
  const prod = $derived({ first: firstOf("Garments produced"), last: lastOf("Garments produced") });
  const wears = $derived({ first: firstOf("Wears per garment"), last: lastOf("Wears per garment") });
  const waste = $derived(lastOf("US textile waste"));

  let focus = $state<string | null>(null); // legend hover
  let hoverYear = $state<number | null>(null);
  let euHover = $state<EuWasteRow | null>(null);
  let tip = $state({ x: 0, y: 0 });
  let drawn = $state(false);
  let mainWidth = $state(640);
  onMount(() => requestAnimationFrame(() => (drawn = true)));

  const opacity = (k: string) => (focus && focus !== k ? 0.15 : 1);

  // Spread end-of-line labels so they never overlap (min 30px apart).
  function dodge(ys: number[], gap = 30) {
    const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
    for (let j = 1; j < order.length; j++) order[j].y = Math.max(order[j].y, order[j - 1].y + gap);
    const out = [...ys];
    for (const o of order) out[o.i] = o.y;
    return out;
  }
  const nearest = (year: number) => years.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a));

  function onKey(e: KeyboardEvent, el: Element, xpos: (y: number) => number, w: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = hoverYear === null ? (e.key === "ArrowRight" ? -1 : years.length) : years.indexOf(hoverYear);
    hoverYear = years[Math.min(years.length - 1, Math.max(0, i + (e.key === "ArrowRight" ? 1 : -1)))];
    const box = el.getBoundingClientRect();
    tip = { x: box.left + (xpos(hoverYear) / w) * box.width, y: box.top + 24 };
  }

  // EU panel
  const euSectors = [
    { key: "Households", label: "Households", cls: "hh" },
    { key: "Textile & clothing factories", label: "Factories", cls: "fac" },
  ];
  const euBy = $derived(group([...eu].sort((a, b) => a.year - b.year), (d) => d.sector));
  const euPts = (k: string) => euBy.get(k) ?? [];
  const euLast = (k: string) => euPts(k)[euPts(k).length - 1];
  const crossover = $derived(euPts("Households").find((h) => {
    const f = euPts("Textile & clothing factories").find((x) => x.year === h.year);
    return f && h.tonnes > f.tonnes;
  }));
  // split a series into solid runs and dashed bridges where Eurostat skipped a reporting year (> 2 years apart)
  function runs(rows: EuWasteRow[]) {
    const solid: EuWasteRow[][] = [[]], gaps: [EuWasteRow, EuWasteRow][] = [];
    rows.forEach((r, i) => {
      if (i && r.year - rows[i - 1].year > 2) { gaps.push([rows[i - 1], r]); solid.push([]); }
      solid[solid.length - 1].push(r);
    });
    return { solid, gaps };
  }
</script>

<p class="headline">
  Between {prod.first.year} and {prod.last.year} the world went from <strong>{fmtInt(prod.first.value)}</strong> to
  <strong>{fmtInt(prod.last.value)} billion</strong> new garments a year, while each one is now worn
  <strong>{fmtInt(wears.last.value)} times</strong> on average, down from {fmtInt(wears.first.value)}.
</p>
<p class="sub">
  Each line starts at 100 in its first year with data. Above the dashed line means it grew; below means it shrank.
  US textile waste reached {fmtOne(waste.value)} million tons in {waste.year} ({times(waste.index)} its {firstYear} level).
</p>

<ul class="legend" aria-label="Legend">
  {#each series as s (s.key)}
    <li onpointerenter={() => (focus = s.key)} onpointerleave={() => (focus = null)} class:dim={focus && focus !== s.key}>
      <svg width="20" height="10" aria-hidden="true"><line x1="0" x2="20" y1="5" y2="5" style:stroke={s.color} stroke-width="2.5" stroke-linecap="round" /></svg>
      {s.label}
    </li>
  {/each}
  <li class="base"><svg width="20" height="10" aria-hidden="true"><line x1="0" x2="20" y1="5" y2="5" stroke-dasharray="4 3" /></svg>{firstYear} level</li>
</ul>

<div class="layout">
  <div class="main" bind:clientWidth={mainWidth}>
    <ChartFrame height={mainWidth < 520 ? 320 : undefined} label="Line chart of growth since {firstYear}: garments produced rise to {fmtInt(prod.last.index)}, US textile waste to {fmtInt(waste.index)}, wears per garment fall to {fmtInt(wears.last.index)}." aspect={0.62} margin={{ top: 28, right: 128, bottom: 32, left: 44 }}>
      {#snippet children({ width, height })}
        {@const x = scaleLinear().domain(extent(years) as [number, number]).range([0, width])}
        {@const y = scaleLinear().domain([0, (max(data, (d) => d.index) ?? 100) * 1.05]).nice().range([height, 0])}
        {@const path = (k: string) => line<GrowthRow>().x((d) => x(d.year)).y((d) => y(d.index)).curve(curveMonotoneX)(pts(k)) ?? ""}
        {@const ends = dodge(series.map((s) => y(lastOf(s.key).index)))}
        {@const xTicks = x.ticks(width > 420 ? 6 : 3).filter((t) => Number.isInteger(t))}

        <text class="axis-label" x={-44} y={-14}>Growth index (first year = 100)</text>
        {#each y.ticks(5) as t (t)}
          <g class="tick" transform="translate(0,{y(t)})">
            <line x1="0" x2={width} />
            <text x="-8" dy="0.32em" text-anchor="end">{t}</text>
          </g>
        {/each}
        {#each xTicks as t (t)}
          <g class="tick" transform="translate({x(t)},{height})"><text y="20" text-anchor="middle">{t}</text></g>
        {/each}
        <line class="axis" x1="0" x2={width} y1={height} y2={height} />

        <line class="baseline" x1="0" x2={width} y1={y(100)} y2={y(100)} />
        <text class="base-label" x={width - 4} y={y(100) - 6} text-anchor="end">{firstYear} level</text>

        {#if hoverYear !== null}
          <line class="crosshair" x1={x(hoverYear)} x2={x(hoverYear)} y1="0" y2={height} />
        {/if}

        {#each series as s, si (s.key)}
          {@const end = lastOf(s.key)}
          <g style:opacity={opacity(s.key)} class="series">
            <path d={path(s.key)} pathLength="1" class="line" class:drawn style:stroke={s.color} />
            {#each pts(s.key) as d, i (d.year)}
              <circle cx={x(d.year)} cy={y(d.index)} r={hoverYear === d.year ? 6 : 4} class="dot" class:shown={drawn}
                style:fill={s.color} style:transition-delay="{drawn ? 300 + i * 120 : 0}ms" />
            {/each}
            <line class="leader" class:shown={drawn} x1={x(end.year) + 6} x2={width + 6} y1={y(end.index)} y2={ends[si]} />
            <g transform="translate({width + 10},{ends[si]})" class="end" class:shown={drawn}>
              <text dy="-0.2em" class="end-name">{s.label}</text>
              <text dy="1.05em" class="end-val">{fmtNum(end.value)} {unitOf(s.key)} · {times(end.index)}</text>
            </g>
          </g>
        {/each}

        <!-- hit area: the crosshair finds the year, so the pointer never has to land on a 2px line -->
        <rect class="hit" width={width} height={height} role="slider" tabindex="0"
          aria-label="Year. Use left and right arrow keys to read values." aria-valuemin={firstYear} aria-valuemax={years[years.length - 1]}
          aria-valuenow={hoverYear ?? firstYear}
          onpointermove={(e) => { hoverYear = nearest(x.invert(pointer(e, e.currentTarget)[0])); tip = { x: e.clientX, y: e.clientY }; }}
          onpointerleave={() => (hoverYear = null)}
          onkeydown={(e) => onKey(e, e.currentTarget, (yr) => x(yr), width)}
          onblur={() => (hoverYear = null)} />
      {/snippet}
    </ChartFrame>
  </div>

  <aside class="inset">
    <p class="inset-title">In the EU, the waste moved home</p>
    <p class="inset-sub">
      Textile waste from <strong>households</strong> is up <strong>{Math.round(euLast("Households").index - 100)}%</strong>
      ({fmtOne(euLast("Households").tonnes / 1e6)} Mt in {euLast("Households").year}), while waste from
      <strong>textile factories</strong> fell <strong>{fmtPct(euLast("Textile & clothing factories").index - 100).replace("−", "")}</strong>
      as Europe stopped making its own clothes.{#if crossover}{" "}Households overtook factories in {crossover.year}.{/if}
    </p>
    <ChartFrame label="EU textile waste index, 2004 = 100: households rise to {fmtInt(euLast('Households').index)}, textile factories fall to {fmtInt(euLast('Textile & clothing factories').index)}." aspect={0.78} margin={{ top: 14, right: 78, bottom: 26, left: 34 }}>
      {#snippet children({ width, height })}
        {@const ex = scaleLinear().domain(extent(eu, (d) => d.year) as [number, number]).range([0, width])}
        {@const ey = scaleLinear().domain([0, (max(eu, (d) => d.index) ?? 100) * 1.08]).nice().range([height, 0])}
        {@const eLine = (rows: EuWasteRow[]) => line<EuWasteRow>().x((d) => ex(d.year)).y((d) => ey(d.index))(rows) ?? ""}
        {@const ends = dodge(euSectors.map((s) => ey(euLast(s.key).index)), 28)}
        {#each ey.ticks(4) as t (t)}
          <g class="tick" transform="translate(0,{ey(t)})"><line x1="0" x2={width} /><text x="-6" dy="0.32em" text-anchor="end">{t}</text></g>
        {/each}
        <line class="baseline" x1="0" x2={width} y1={ey(100)} y2={ey(100)} />
        {#each ex.ticks(3).filter((t) => Number.isInteger(t)) as t (t)}
          <text class="axis-label" x={ex(t)} y={height + 18} text-anchor="middle">{t}</text>
        {/each}
        {#each euSectors as s, si (s.key)}
          {@const r = runs(euPts(s.key))}
          {#each r.solid as seg}<path d={eLine(seg)} class="eu-line {s.cls}" />{/each}
          {#each r.gaps as [a, b]}<line class="eu-gap {s.cls}" x1={ex(a.year)} x2={ex(b.year)} y1={ey(a.index)} y2={ey(b.index)} />{/each}
          {#each euPts(s.key) as d (d.year)}
            <circle cx={ex(d.year)} cy={ey(d.index)} r={euHover === d ? 5.5 : 3.5} class="eu-dot {s.cls}" />
            <circle cx={ex(d.year)} cy={ey(d.index)} r="11" class="em-hit" role="img" aria-label="{s.label} {d.year}: {fmtInt(d.tonnes)} tonnes"
              onpointerenter={(e) => { euHover = d; tip = { x: e.clientX, y: e.clientY }; }}
              onpointermove={(e) => (tip = { x: e.clientX, y: e.clientY })}
              onpointerleave={() => (euHover = null)} />
          {/each}
          <text class="eu-end {s.cls}" x={width + 6} y={ends[si]} dy="0.32em">{s.label}</text>
        {/each}
      {/snippet}
    </ChartFrame>
    <p class="inset-note">Index, 2004 = 100. Dashed = years Eurostat did not report. Source: Eurostat env_wasgen (EU27).</p>
  </aside>
</div>

<Tooltip x={tip.x} y={tip.y} visible={hoverYear !== null || euHover !== null}>
  {#if hoverYear !== null}
    <div class="tt-head">{hoverYear}</div>
    {#each series as s (s.key)}
      {@const d = pts(s.key).find((p) => p.year === hoverYear)}
      <div class="tt-row" class:none={!d}>
        <span class="key" style:background={s.color}></span>
        {#if d}
          <strong>{fmtNum(d.value)}</strong>
          <span class="tt-label">{unitOf(s.key)} · {s.label.toLowerCase()} · {times(d.index)}</span>
        {:else}
          <span class="tt-label">{s.label}: no figure for {hoverYear}</span>
        {/if}
      </div>
    {/each}
  {:else if euHover}
    <div class="tt-head">{euHover.sector}, {euHover.year}</div>
    <div><strong>{fmtInt(euHover.tonnes)}</strong> tonnes of textile waste</div>
    <div class="tt-label">{times(euHover.index)} the 2004 level</div>
  {/if}
</Tooltip>

<details class="table">
  <summary>Show the numbers</summary>
  <table>
    <thead><tr><th>Measure</th><th>Year</th><th>Value</th><th>Index</th><th>Source</th></tr></thead>
    <tbody>{#each data as d (d.series + d.year)}<tr><td>{d.series}</td><td>{d.year}</td><td>{d.value} {d.unit}</td><td>{d.index}</td><td>{d.source}</td></tr>{/each}</tbody>
  </table>
  <table>
    <thead><tr><th>EU sector</th><th>Year</th><th>Tonnes</th><th>Index</th></tr></thead>
    <tbody>{#each eu as d (d.sector + d.year)}<tr><td>{d.sector}</td><td>{d.year}</td><td>{fmtInt(d.tonnes)}</td><td>{d.index}</td></tr>{/each}</tbody>
  </table>
</details>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; list-style: none; margin: 0 0 8px; padding: 0; font-size: 0.85rem; color: var(--muted); }
  .legend li { display: flex; align-items: center; gap: 6px; cursor: default; transition: opacity 150ms; }
  .legend li.dim { opacity: 0.4; }
  .legend .base line { stroke: var(--faint); stroke-width: 1.5; }

  .layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  @media (min-width: 860px) { .layout { grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); align-items: start; } }

  .axis { stroke: var(--axis); }
  .baseline { stroke: var(--faint); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .base-label { fill: var(--faint); font-size: 11px; }
  .crosshair { stroke: var(--faint); stroke-width: 1; }

  .series { transition: opacity 150ms; }
  .line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.4s cubic-bezier(.3,.7,.3,1); }
  .line.drawn { stroke-dashoffset: 0; }
  .dot { stroke: var(--card); stroke-width: 2; opacity: 0; transition: opacity 300ms, r 120ms; }
  .dot.shown { opacity: 1; }
  .leader { stroke: var(--rule); stroke-width: 1; stroke-dasharray: 2 2; opacity: 0; transition: opacity 400ms 1s; }
  .leader.shown { opacity: 1; }
  .end { opacity: 0; transition: opacity 400ms 1s; }
  .end.shown { opacity: 1; }
  .end-name { font-size: 12px; font-weight: 600; }
  .end-val { font-size: 11px; fill: var(--muted); font-variant-numeric: tabular-nums; }
  .hit { fill: transparent; cursor: crosshair; outline: none; }
  .hit:focus-visible { stroke: var(--faint); stroke-dasharray: 2 2; }

  .inset { border: 1px solid var(--rule); border-radius: 8px; padding: 12px 12px 8px; background: var(--wash); }
  .inset-title { margin: 0; font-weight: 700; font-size: 0.95rem; }
  .inset-sub { margin: 4px 0 8px; font-size: 0.82rem; color: var(--muted); }
  .inset-note { margin: 4px 0 0; font-size: 0.72rem; color: var(--faint); }
  .eu-line { fill: none; stroke-width: 2.5; stroke-linejoin: round; }
  .eu-gap { stroke-width: 1.5; stroke-dasharray: 3 3; }
  .hh { stroke: var(--ink); fill: var(--ink); }
  .fac { stroke: var(--faint); fill: var(--faint); }
  .eu-line.hh, .eu-line.fac, .eu-gap.hh, .eu-gap.fac { fill: none; }
  .eu-dot { stroke: var(--card); stroke-width: 1.5; pointer-events: none; transition: r 120ms; }
  .eu-end { font-size: 11px; font-weight: 600; stroke: none; }
  .eu-end.hh { fill: var(--ink); }
  .eu-end.fac { fill: var(--muted); }
  .em-hit { fill: transparent; }

  .tt-head { font-weight: 700; margin-bottom: 4px; }
  .tt-row { display: flex; align-items: center; gap: 6px; }
  .tt-row.none { opacity: 0.6; }
  .tt-row .key { width: 12px; height: 2.5px; border-radius: 2px; flex: none; }
  .tt-label { opacity: 0.8; }

  @media (prefers-reduced-motion: reduce) {
    .line, .dot, .end, .leader { transition: none; }
  }
</style>
