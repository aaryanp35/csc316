<!-- Storyboard frame 9, novel view: "Wear it longer".
The garment is the chart. A T-shirt silhouette is cut into N horizontal slices, one per wear; the highlighted slice is
the share of the T-shirt's fixed footprint that a single wear carries. Changing N (slider, presets, or dragging along the
per-wear curve) re-slices the shirt and updates the per-wear numbers, so "every extra wear makes each wear cheaper"
is something you do rather than read.
Numbers: factory CO2e of one cotton T-shirt (Carbonfact chain x median Norway T-shirt weight) and 2,700 L of water
(WWF figure in the Kaggle dataset); average wears per garment in 2000 and 2022 (McKinsey, Kaggle dataset).
-->
<script lang="ts">
  import { scaleLinear, scaleLog, scaleBand, line, range, pointer, type ScaleLinear } from "d3";
  import ChartFrame from "../ui/ChartFrame.svelte";
  import { fmtInt, fmtOne } from "../../utils/format";
  import type { Facts } from "../../data/types";

  interface Props { facts: Facts }
  let { facts }: Props = $props();

  const uid = $props.id();
  const MAX = 100;
  const co2g = $derived(facts.tshirt_factory_co2_kg * 1000);
  const water = $derived(facts.tshirt_water_litres);
  let wears = $state(7);
  $effect.pre(() => { wears = facts.wears_2022; }); // start at today's average

  const presets = $derived([
    { n: facts.wears_2022, label: `${facts.wears_2022} wears`, note: "today's average" },
    { n: facts.wears_2000, label: `${facts.wears_2000} wears`, note: "average in 2000" },
    { n: 52, label: "52 wears", note: "once a week for a year" },
    { n: 100, label: "100 wears", note: "worn until it's worn out" },
  ]);
  const perCo2 = $derived(co2g / wears);
  const perWater = $derived(water / wears);
  const vsToday = $derived(1 - facts.wears_2022 / wears); // saving per wear vs today's average

  // T-shirt silhouette in a 200 x 220 box
  const SHIRT = "M62,12 L84,4 Q100,22 116,4 L138,12 L192,46 L170,84 L150,72 L150,214 L50,214 L50,72 L30,84 L8,46 Z";
  const TOP = 4, BOTTOM = 214;
  const slices = $derived(scaleBand<number>().domain(range(wears)).range([TOP, BOTTOM]).paddingInner(wears > 40 ? 0.35 : 0.18));

  function setFromCurve(e: PointerEvent & { currentTarget: SVGRectElement }, x: ScaleLinear<number, number>) {
    if (e.type === "pointermove" && e.buttons !== 1) return;
    const n = Math.round(x.invert(pointer(e, e.currentTarget)[0]));
    wears = Math.max(1, Math.min(MAX, n));
  }
</script>

<p class="headline">
  One T-shirt, one footprint. The more you wear it, the less each wear costs.
</p>
<p class="sub">
  Making one cotton T-shirt ({fmtInt(facts.tshirt_weight_kg * 1000)} g) costs about <strong>{fmtOne(facts.tshirt_factory_co2_kg)} kg CO₂e</strong>
  in the factory and <strong>{fmtInt(water)} litres of water</strong> before you ever wear it. That cost is fixed; how many times you wear it is not.
</p>

<div class="stage">
  <figure class="shirt">
    <svg viewBox="0 0 200 222" role="img" aria-label="T-shirt cut into {wears} slices, one per wear; one slice highlighted.">
      <defs><clipPath id="{uid}-clip"><path d={SHIRT} /></clipPath></defs>
      <path d={SHIRT} class="shirt-bg" />
      <g clip-path="url(#{uid}-clip)">
        {#each range(wears) as i (i)}
          <rect x="0" width="200" y={slices(i)} height={slices.bandwidth()} class="slice" class:this={i === wears - 1} />
        {/each}
      </g>
      <path d={SHIRT} class="shirt-outline" />
    </svg>
    <figcaption><span class="chip"></span> = one wear's share of the footprint</figcaption>
  </figure>

  <div class="numbers">
    <p class="wears"><strong>{wears}</strong> {wears === 1 ? "wear" : "wears"}</p>
    <dl>
      <div><dt>CO₂ per wear</dt><dd><strong>{perCo2 >= 100 ? fmtInt(perCo2) : fmtOne(perCo2)}</strong> g</dd></div>
      <div><dt>Water per wear</dt><dd><strong>{perWater >= 100 ? fmtInt(perWater) : fmtOne(perWater)}</strong> L</dd></div>
    </dl>
    <p class="compare">
      {#if wears > facts.wears_2022}
        Each wear carries <strong>{Math.round(vsToday * 100)}% less</strong> than at today's average of {facts.wears_2022} wears.
      {:else if wears < facts.wears_2022}
        Each wear carries <strong>{Math.round(-vsToday * 100)}% more</strong> than at today's average of {facts.wears_2022} wears.
      {:else}
        This is today's average: a garment is worn {facts.wears_2022} times before it's thrown out (it was {facts.wears_2000} in 2000).
      {/if}
    </p>
    <label class="slider">
      <span>How many times will you wear it?</span>
      <input type="range" min="1" max={MAX} bind:value={wears} aria-valuetext="{wears} wears, {fmtInt(perCo2)} grams CO2 per wear" />
    </label>
    <div class="presets">
      {#each presets as p (p.n)}
        <button class:on={wears === p.n} onclick={() => (wears = p.n)}><strong>{p.label}</strong><span>{p.note}</span></button>
      {/each}
    </div>
  </div>
</div>

<div class="curve">
  <p class="curve-title">CO₂ per wear (g) by number of wears. Drag along the curve.</p>
  <ChartFrame label="Curve of grams of CO2 per wear against number of wears; it falls steeply over the first 20 wears." aspect={0.24} height={undefined} margin={{ top: 16, right: 16, bottom: 28, left: 44 }}>
    {#snippet children({ width, height })}
      {@const x = scaleLinear().domain([1, MAX]).range([0, width])}
      {@const y = scaleLog().domain([co2g / MAX, co2g]).range([height, 0])}
      {@const path = line<number>().x((n) => x(n)).y((n) => y(co2g / n))(range(1, MAX + 1)) ?? ""}
      {#each [10, 100, 1000].filter((t) => t >= co2g / MAX && t <= co2g) as t (t)}
        <g class="tick" transform="translate(0,{y(t)})"><line x1="0" x2={width} /><text x="-8" dy="0.32em" text-anchor="end">{fmtInt(t)}</text></g>
      {/each}
      {#each [1, 25, 50, 75, 100] as t (t)}
        <text class="axis-label" x={x(t)} y={height + 18} text-anchor="middle">{t}</text>
      {/each}
      <path d={path} class="curve-line" />
      {#each [facts.wears_2000, facts.wears_2022] as n (n)}
        <line class="ref" x1={x(n)} x2={x(n)} y1={y(co2g / n)} y2={height} />
        <text class="ref-label" x={x(n) + 4} y={height - 4}>{n === facts.wears_2022 ? "today" : "2000"}</text>
      {/each}
      <line class="now-line" x1={x(wears)} x2={x(wears)} y1="0" y2={height} />
      <circle class="now" cx={x(wears)} cy={y(perCo2)} r="7" />
      <text class="now-label" x={x(wears) + (x(wears) > width - 90 ? -10 : 10)} y={y(perCo2) - 10} text-anchor={x(wears) > width - 90 ? "end" : "start"}>{fmtInt(perCo2)} g</text>
      <rect class="hit" width={width} height={height} role="presentation"
        onpointerdown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setFromCurve(e, x); }}
        onpointermove={(e) => setFromCurve(e, x)} />
    {/snippet}
  </ChartFrame>
</div>

<style>
  .stage { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: center; }
  @media (min-width: 680px) { .stage { grid-template-columns: minmax(200px, 5fr) minmax(0, 7fr); } }

  .shirt { margin: 0; text-align: center; }
  .shirt svg { width: min(100%, 300px); height: auto; display: block; margin: 0 auto; }
  .shirt-bg { fill: var(--wash); }
  .shirt-outline { fill: none; stroke: var(--ink); stroke-width: 2; stroke-linejoin: round; }
  .slice { fill: var(--bar); transition: y 350ms ease, height 350ms ease; }
  .slice.this { fill: var(--worse); }
  figcaption { font-size: 0.8rem; color: var(--muted); margin-top: 6px; }
  .chip { display: inline-block; width: 18px; height: 8px; border-radius: 2px; background: var(--worse); vertical-align: 0; }

  .numbers { min-width: 0; }
  .wears { margin: 0; font-size: 1rem; color: var(--muted); }
  .wears strong { font-size: 2.6rem; color: var(--ink); font-variant-numeric: tabular-nums; margin-right: 4px; }
  dl { display: flex; gap: 28px; margin: 4px 0 8px; flex-wrap: wrap; }
  dt { font-size: 0.8rem; color: var(--muted); }
  dd { margin: 0; font-size: 1rem; color: var(--muted); }
  dd strong { font-size: 2rem; color: var(--ink); font-variant-numeric: tabular-nums; }
  .compare { margin: 0 0 14px; font-size: 0.95rem; }

  .slider { display: grid; gap: 6px; font-size: 0.85rem; color: var(--muted); }
  .slider input { width: 100%; accent-color: var(--worse); }
  .presets { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-top: 12px; }
  .presets button {
    display: grid; gap: 2px; text-align: left; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--rule);
    background: var(--card); color: var(--ink); font: inherit; font-size: 0.85rem; cursor: pointer;
  }
  .presets button span { color: var(--muted); font-size: 0.75rem; }
  .presets button.on { border-color: var(--worse); box-shadow: inset 0 0 0 1px var(--worse); }
  .presets button:focus-visible { outline: 2px solid var(--series-1); outline-offset: 1px; }

  .curve { margin-top: 18px; }
  .curve-title { margin: 0; font-size: 0.8rem; color: var(--muted); }
  .curve-line { fill: none; stroke: var(--muted); stroke-width: 2; }
  .ref { stroke: var(--faint); stroke-dasharray: 3 3; }
  .ref-label { font-size: 10px; fill: var(--faint); }
  .now-line { stroke: var(--worse); stroke-width: 1; opacity: 0.4; }
  .now { fill: var(--worse); stroke: var(--card); stroke-width: 2; }
  .now-label { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .hit { fill: transparent; cursor: ew-resize; touch-action: none; }

  @media (prefers-reduced-motion: reduce) { .slice { transition: none; } }
</style>
