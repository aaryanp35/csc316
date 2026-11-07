<!-- Sketch 3 / storyboard frame 3: blends vs pure fibres (diverging arrows + bars). Data: Carbonfact, 1 kg woven fabric.
Top: one row per fabric, two panels (CO2, water scarcity). Arrow starts at the 100% cotton line; length = % change,
red = worse, blue = better, gray dot = about the same (within ±1%). Figures follow the updated Sketch 3.
Right column: how common the fibre mix is in the Norway post-consumer data (circle area = garments counted).
Bottom: absolute footprint per kg of fabric, one bar per fabric; the focused fabric is hatched.
Hovering any row or bar focuses that fabric everywhere; the tooltip breaks it down by factory step.
-->
<script lang="ts">
  import { scaleLinear, scaleBand, scaleSqrt, max } from "d3";
  import ChartFrame from "../ui/ChartFrame.svelte";
  import Tooltip from "../ui/Tooltip.svelte";
  import { fmtInt, fmtOne, fmtTwo, fmtPct } from "../../utils/format";
  import type { BlendRow, BlendStepRow } from "../../data/types";

  interface Props { data: BlendRow[]; steps: BlendStepRow[] }
  let { data, steps }: Props = $props();

  const uid = $props.id();
  const SAME = 1; // |% change| at or below this reads as "about the same"
  const bases = [
    { key: "cotton", fabric: "100% cotton" },
    { key: "polyester", fabric: "100% polyester" },
  ] as const;
  const base: "cotton" | "polyester" = "cotton"; // Sketch 3 compares with 100% cotton only

  type Row = BlendRow & { co2_pct: number; water_pct: number };
  const rows: Row[] = $derived(data.map((d) => ({
    ...d,
    co2_pct: base === "cotton" ? d.co2_vs_cotton_pct : d.co2_vs_polyester_pct,
    water_pct: base === "cotton" ? d.water_vs_cotton_pct : d.water_vs_polyester_pct,
  })));
  const baseline = $derived(rows.find((d) => d.fabric === bases.find((b) => b.key === base)!.fabric) ?? rows[0]);
  const others = $derived(rows.filter((d) => d.fabric !== baseline.fabric));
  const score = (d: Row) => d.co2_pct + d.water_pct;
  const worst = $derived(others.reduce((a, b) => (score(b) > score(a) ? b : a)));
  const similar = $derived(others.filter((d) => Math.abs(d.co2_pct) <= SAME && Math.abs(d.water_pct) <= SAME));
  const stepsOf = (fabric: string) => steps.filter((s) => s.fabric === fabric);
  const dyeBaths = (fabric: string) => stepsOf(fabric).filter((s) => s.step.includes("dyeing")).length;

  let hovered = $state<string | null>(null);
  let tip = $state({ x: 0, y: 0 });
  const focus = $derived(rows.find((d) => d.fabric === hovered) ?? worst);
  const hoveredRow = $derived(rows.find((d) => d.fabric === hovered));

  const panels = [
    { key: "co2_pct", title: "CO₂ change" },
    { key: "water_pct", title: "Water-scarcity change" },
  ] as const;
  const bars = [
    { key: "co2_kg", pct: "co2_pct", title: "CO₂ per kg of fabric", unit: "kg CO₂e", fmt: fmtOne },
    { key: "water_m3", pct: "water_pct", title: "Water scarcity per kg of fabric", unit: "m³ world-eq", fmt: fmtTwo },
  ] as const;

  const tone = (v: number) => (Math.abs(v) <= SAME ? "same" : v > 0 ? "worse" : "better");
  const split = (name: string) => { const i = name.indexOf(" "); return i < 0 ? [name] : [name.slice(0, i), name.slice(i + 1)]; };
  const enter = (d: Row, e: PointerEvent) => { hovered = d.fabric; tip = { x: e.clientX, y: e.clientY }; };
  const move = (e: PointerEvent) => (tip = { x: e.clientX, y: e.clientY });
  const leave = () => (hovered = null);

  // Bar with 4px rounded top corners, anchored flat on the baseline.
  function bar(x: number, y: number, w: number, h: number, r = 4) {
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
</script>

<p class="headline">
  Blending isn't a middle ground: <strong>{worst.fabric}</strong> emits <strong>{fmtPct(worst.co2_pct)} CO₂</strong>
  and scores <strong>{fmtPct(worst.water_pct)} on water scarcity</strong> compared with {baseline.fabric}.
</p>
<p class="sub">
  It goes through {dyeBaths(worst.fabric) === 2 ? "two dye baths" : `${dyeBaths(worst.fabric)} dye bath(s)`}, one for each fibre{#if similar.length},
  while {similar.map((d) => d.fabric).join(" and ")} {similar.length > 1 ? "are" : "is"} about the same as {baseline.fabric}{/if}.
  Factory steps only (spinning to dyeing) for 1 kg of woven fabric.
</p>

<ul class="legend" aria-label="Legend">
  <li><svg width="26" height="10" aria-hidden="true"><line x1="1" x2="18" y1="5" y2="5" class="a-worse" /><path d="M25,5 L17,1 L17,9 Z" class="h-worse" /></svg>Worse than {baseline.fabric}</li>
  <li><svg width="26" height="10" aria-hidden="true"><line x1="25" x2="8" y1="5" y2="5" class="a-better" /><path d="M1,5 L9,1 L9,9 Z" class="h-better" /></svg>Better</li>
  <li><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" class="h-same" /></svg>About the same (within ±{SAME}%)</li>
  <li class="muted">Arrow length = % change</li>
</ul>

<ChartFrame label="Diverging arrows: percent change in CO2 and water scarcity versus {baseline.fabric} for {others.map((d) => `${d.fabric} (CO2 ${fmtPct(d.co2_pct)}, water ${fmtPct(d.water_pct)})`).join('; ')}."
  height={64 + others.length * 76 + 34} margin={{ top: 56, right: 4, bottom: 34, left: 0 }}>
  {#snippet children({ width, height })}
    {@const narrow = width < 560}
    {@const labelW = narrow ? 0 : 150}
    {@const countW = narrow ? 58 : 128}
    {@const gap = narrow ? 14 : 24}
    {@const shift = narrow ? 12 : 0}
    {@const panelW = (width - labelW - countW - gap * 2) / 2}
    {@const lim = Math.max(30, Math.ceil((max(rows, (d) => Math.max(Math.abs(d.co2_pct), Math.abs(d.water_pct))) ?? 10) / 10 + 0.5) * 10)}
    {@const x = scaleLinear().domain([-lim, lim]).range([0, panelW])}
    {@const row = scaleBand<string>().domain(others.map((d) => d.fabric)).range([0, height]).paddingInner(0.12)}
    {@const rMax = Math.min(row.bandwidth() / 2 - 4, narrow ? 16 : 24)}
    {@const r = scaleSqrt().domain([0, max(rows, (d) => d.n_norway) || 1]).range([0, rMax])}
    {@const countX = labelW + panelW * 2 + gap * 2}

    <!-- row bands double as hit targets: hovering a fabric anywhere in its row focuses it -->
    {#each others as d (d.fabric)}
      <rect class="band" class:on={hovered === d.fabric} x="0" y={row(d.fabric)} width={width} height={row.bandwidth()} rx="6"
        role="img" aria-label="{d.fabric}: CO2 {fmtPct(d.co2_pct)}, water scarcity {fmtPct(d.water_pct)} versus {baseline.fabric}"
        onpointerenter={(e) => enter(d, e)} onpointermove={move} onpointerleave={leave} />
      <text class="fabric" x={narrow ? 4 : 10} y={(row(d.fabric) ?? 0) + (narrow ? 14 : row.bandwidth() / 2)} dy={narrow ? null : "0.35em"}>{d.fabric}</text>
    {/each}

    {#each panels as p, pi (p.key)}
      {@const px = labelW + pi * (panelW + gap)}
      <g transform="translate({px},0)">
        <text class="panel-title" x={panelW / 2} y="-36" text-anchor="middle">{narrow ? (pi ? "Water" : "CO₂") : p.title}</text>
        <text class="axis-label" class:small={narrow} x={x(0) - 5} y="-16" text-anchor="end">← less</text>
        <text class="axis-label" class:small={narrow} x={x(0) + 5} y="-16">more →</text>
        {#each (narrow ? [-20, 0, 20] : x.ticks(5)).filter((t) => Math.abs(t) < lim) as t (t)}
          <g class="tick" transform="translate({x(t)},0)">
            {#if t !== 0}<line y1="0" y2={height} />{/if}
            {#if !(narrow && t === 0)}<text y={height + 18} text-anchor="middle">{t === 0 ? "0" : fmtPct(t)}</text>{/if}
          </g>
        {/each}
        <line class="zero" x1={x(0)} x2={x(0)} y1="-6" y2={height} />

        {#each others as d (d.fabric)}
          {@const v = d[p.key]}
          {@const cy = (row(d.fabric) ?? 0) + row.bandwidth() / 2 + shift}
          {@const dir = Math.sign(v)}
          {@const t = tone(v)}
          <g class="mark" class:dim={hovered && hovered !== d.fabric}>
            {#if t === "same"}
              <circle cx={x(v)} cy={cy} r="6" class="h-same" />
              <text class="val" x={x(v) + 10} y={cy} dy="0.35em">{fmtPct(v)}</text>
            {:else}
              {@const head = Math.min(11, Math.abs(x(v) - x(0)))}
              <line x1={x(0)} x2={x(v) - dir * head * 0.8} y1={cy} y2={cy} class="a-{t} grow" />
              <path d="M{x(v)},{cy} L{x(v) - dir * head},{cy - 6} L{x(v) - dir * head},{cy + 6} Z" class="h-{t}" />
              {#if narrow}
                <text class="val" x={x(v)} y={cy - 12} text-anchor="middle">{fmtPct(v)}</text>
              {:else}
                <text class="val" x={x(v) + dir * 6} y={cy} dy="0.35em" text-anchor={dir > 0 ? "start" : "end"}>{fmtPct(v)}</text>
              {/if}
            {/if}
          </g>
        {/each}
      </g>
    {/each}
    <text class="axis-label" x={labelW + panelW / 2} y={height + 32} text-anchor="middle" style:display={narrow ? "none" : null}>0 = same as {baseline.fabric}</text>
    <text class="axis-label" x={labelW + panelW * 1.5 + gap} y={height + 32} text-anchor="middle" style:display={narrow ? "none" : null}>0 = same as {baseline.fabric}</text>

    <g transform="translate({countX},0)">
      <text class="panel-title" x={countW / 2} y="-36" text-anchor="middle">{narrow ? "Norway" : "Found in Norway"}</text>
      <text class="axis-label" x={countW / 2} y="-16" text-anchor="middle">{narrow ? "garments" : "garments counted"}</text>
      {#each others as d (d.fabric)}
        {@const cy = (row(d.fabric) ?? 0) + row.bandwidth() / 2 + shift}
        <g class="mark" class:dim={hovered && hovered !== d.fabric}>
          <circle cx={narrow ? countW / 2 : rMax + 4} cy={narrow ? cy - 8 : cy} r={r(d.n_norway)} class="count" />
          <text class="val" x={narrow ? countW / 2 : rMax * 2 + 14} y={narrow ? cy + rMax : cy} dy="0.35em" text-anchor={narrow ? "middle" : "start"}>{fmtInt(d.n_norway)}</text>
        </g>
      {/each}
    </g>
  {/snippet}
</ChartFrame>

<div class="bars">
  {#each bars as b (b.key)}
    <figure>
      <figcaption>{b.title} <span>({b.unit})</span></figcaption>
      <ChartFrame label="Bar chart of {b.title}: {rows.map((d) => `${d.fabric} ${b.fmt(d[b.key])} ${b.unit}`).join(', ')}." height={240} margin={{ top: 34, right: 8, bottom: 52, left: 44 }}>
        {#snippet children({ width, height })}
          {@const x = scaleBand<string>().domain(rows.map((d) => d.fabric)).range([0, width]).paddingInner(0.28).paddingOuter(0.1)}
          {@const y = scaleLinear().domain([0, (max(rows, (d) => d[b.key]) ?? 1) * 1.12]).nice().range([height, 0])}
          {#each y.ticks(4) as t (t)}
            <g class="tick" transform="translate(0,{y(t)})"><line x1="0" x2={width} /><text x="-8" dy="0.32em" text-anchor="end">{b.fmt(t)}</text></g>
          {/each}
          <line class="axis" x1="0" x2={width} y1={height} y2={height} />
          <line class="ref" x1="0" x2={width} y1={y(baseline[b.key])} y2={y(baseline[b.key])} />
          {#each rows as d (d.fabric)}
            {@const bx = x(d.fabric) ?? 0}
            {@const by = y(d[b.key])}
            {@const isFocus = d.fabric === focus.fabric}
            <g class="mark" class:dim={hovered && !isFocus} role="img" aria-label="{d.fabric}: {b.fmt(d[b.key])} {b.unit}"
              onpointerenter={(e) => enter(d, e)} onpointermove={move} onpointerleave={leave}>
              <!-- hit area is the whole column, bigger than the bar -->
              <rect x={bx - 4} y="-30" width={x.bandwidth() + 8} height={height + 30} fill="transparent" />
              <path d={bar(bx, by, x.bandwidth(), height - by)} class="bar" class:base={d.fabric === baseline.fabric} />
              {#if isFocus}<path d={bar(bx, by, x.bandwidth(), height - by)} fill="url(#{uid}-hatch)" class="hatch" />{/if}
              <text class="val" x={bx + x.bandwidth() / 2} y={by - 8} text-anchor="middle">{b.fmt(d[b.key])}</text>
              {#if d.fabric !== baseline.fabric}
                <text class="pct" x={bx + x.bandwidth() / 2} y={by - 22} text-anchor="middle">{fmtPct(d[b.pct])}</text>
              {/if}
              {#each width < 420 ? d.fabric.split(" ") : split(d.fabric) as l, i}
                <text class="axis-label" x={bx + x.bandwidth() / 2} y={height + 16 + i * 13} text-anchor="middle">{l}</text>
              {/each}
            </g>
          {/each}
        {/snippet}
      </ChartFrame>
    </figure>
  {/each}
</div>
<p class="note">
  <svg class="swatch" width="14" height="14" aria-hidden="true"><rect width="14" height="14" rx="3" fill="url(#{uid}-hatch)" /></svg>
  Hatched bar = {focus.fabric}{hovered ? "" : " (the biggest footprint; hover any fabric to compare)"}. Dashed line = {baseline.fabric}.
  Water scarcity weights each litre by how scarce water is where it's used. Source: Carbonfact open LCA database (world average), % changes as agreed in Sketch 3;
  Norway counts any cotton/polyester or cotton/elastane mix.
</p>

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <pattern id="{uid}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" class="hatch-bg" />
      <line x1="0" y1="0" x2="0" y2="6" class="hatch-line" />
    </pattern>
  </defs>
</svg>

<Tooltip x={tip.x} y={tip.y} visible={!!hoveredRow}>
  {#if hoveredRow}
    {@const d = hoveredRow}
    <div class="tt-head">{d.fabric}</div>
    <div><strong>{fmtOne(d.co2_kg)}</strong> kg CO₂e per kg {#if d.fabric !== baseline.fabric}<span class="tt-dim">({fmtPct(d.co2_pct)})</span>{/if}</div>
    <div><strong>{fmtTwo(d.water_m3)}</strong> m³ water-scarcity {#if d.fabric !== baseline.fabric}<span class="tt-dim">({fmtPct(d.water_pct)})</span>{/if}</div>
    <table class="tt-steps"><tbody>
      {#each stepsOf(d.fabric) as s (s.step)}
        <tr><td>{s.step}</td><td>{fmtOne(s.co2_kg)} kg</td></tr>
      {/each}
    </tbody></table>
    <div class="tt-dim">{fmtInt(d.n_norway)} garments with this fibre mix in Norway</div>
  {/if}
</Tooltip>

<details class="table">
  <summary>Show the numbers</summary>
  <table>
    <thead><tr><th>Fabric</th><th>CO₂ (kg/kg)</th><th>vs {baseline.fabric}</th><th>Water scarcity (m³/kg)</th><th>vs {baseline.fabric}</th><th>Garments in Norway</th></tr></thead>
    <tbody>
      {#each rows as d (d.fabric)}
        <tr><td>{d.fabric}</td><td>{fmtTwo(d.co2_kg)}</td><td>{fmtPct(d.co2_pct)}</td><td>{fmtTwo(d.water_m3)}</td><td>{fmtPct(d.water_pct)}</td><td>{fmtInt(d.n_norway)}</td></tr>
      {/each}
    </tbody>
  </table>
</details>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; list-style: none; margin: 0 0 4px; padding: 0; font-size: 0.85rem; color: var(--muted); }
  .legend li { display: flex; align-items: center; gap: 6px; }
  .legend .muted { color: var(--faint); }

  .band { fill: transparent; transition: fill 150ms; }
  .band.on { fill: var(--wash); }
  .fabric { font-size: 13px; font-weight: 600; pointer-events: none; }
  .panel-title { font-size: 13px; font-weight: 600; }
  .small { font-size: 10px; }
  .zero { stroke: var(--muted); stroke-width: 1.5; }
  .axis { stroke: var(--axis); }

  .mark { transition: opacity 150ms; pointer-events: none; }
  .bars .mark { pointer-events: auto; }
  .mark.dim { opacity: 0.3; }
  .mark line, .mark path, .mark circle, .mark text { transition: x 400ms ease, x2 400ms ease, cx 400ms ease, d 400ms ease; }
  .a-worse, .a-better { stroke-width: 4; stroke-linecap: round; }
  .a-worse { stroke: var(--worse); }
  .a-better { stroke: var(--better); }
  .h-worse { fill: var(--worse); }
  .h-better { fill: var(--better); }
  .h-same { fill: var(--same); stroke: var(--card); stroke-width: 2; }
  .val { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .count { fill: var(--bar); stroke: var(--card); stroke-width: 2; }

  .bars { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px 24px; margin-top: 20px; }
  @media (min-width: 640px) { .bars { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  figure { margin: 0; }
  figcaption { font-size: 13px; font-weight: 600; }
  figcaption span { font-weight: 400; color: var(--muted); }
  .bar { fill: var(--bar); }
  .bar.base { fill: var(--faint); }
  .hatch { pointer-events: none; }
  .hatch-bg { fill: var(--bar); }
  .hatch-line { stroke: var(--bar-focus); stroke-width: 2.5; }
  .ref { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 3; }
  .pct { font-size: 11px; fill: var(--muted); font-variant-numeric: tabular-nums; }

  .swatch { vertical-align: -2px; margin-right: 4px; }
  .tt-head { font-weight: 700; margin-bottom: 4px; }
  .tt-dim { opacity: 0.75; }
  .tt-steps { border-collapse: collapse; margin: 4px 0; width: 100%; }
  .tt-steps td { padding: 0 0 0 0; opacity: 0.85; }
  .tt-steps td:last-child { text-align: right; padding-left: 12px; }

  @media (prefers-reduced-motion: reduce) { .mark line, .mark path, .mark circle, .mark text { transition: none; } }
</style>
