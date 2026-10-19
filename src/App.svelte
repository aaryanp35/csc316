<script lang="ts">
  import { loadDataset } from "./lib/data/load";
  import VisCard from "./lib/components/ui/VisCard.svelte";
  import StageBars from "./lib/components/visuals/StageBars.svelte";
  import BlendDiverge from "./lib/components/visuals/BlendDiverge.svelte";
  import GrowthLines from "./lib/components/visuals/GrowthLines.svelte";
  import CountryBubbles from "./lib/components/visuals/CountryBubbles.svelte";
  import CertBoxplots from "./lib/components/visuals/CertBoxplots.svelte";

  const dataset = loadDataset();
</script>

<header>
  <h1>The True Cost of Fast Fashion</h1>
  <p>What goes into one garment, how big the problem is, and what you can do about it.</p>
</header>
<p class="banner">Development build: charts use placeholder data (see public/data/README.md).</p>

<main>
  {#await dataset}
    <p>Loading data…</p>
  {:then data}
    <section>
      <h2>1. What goes into one garment?</h2>
      <VisCard sketch={11} title="Which stage of the supply chain has the biggest footprint?"><StageBars data={data.stages} /></VisCard>
      <VisCard sketch={3} title="How do blends like poly-cotton compare with pure fibres?"><BlendDiverge data={data.blends} /></VisCard>
    </section>
    <section>
      <h2>2. How big is the problem, and where is it?</h2>
      <VisCard sketch={2} title="How have clothing production and waste grown since 2000?"><GrowthLines data={data.trends} /></VisCard>
      <VisCard sketch={14} title="Which countries make most of our clothes, and which have the highest carbon footprint?"><CountryBubbles data={data.countries} /></VisCard>
    </section>
    <section>
      <h2>3. What can I do about it?</h2>
      <VisCard sketch={15} title="Do &quot;sustainable&quot; or certified brands really have lower footprints, and do they cost more?"><CertBoxplots data={data.brands} /></VisCard>
    </section>
  {:catch err}
    <p class="error">Could not load data: {err.message}</p>
  {/await}
</main>

<style>
  header, main, .banner { max-width: 960px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
  header { padding-top: 48px; padding-bottom: 16px; }
  h1 { margin: 0 0 8px; font-size: clamp(1.8rem, 5vw, 2.8rem); }
  header p { margin: 0; color: var(--muted); font-size: 1.1rem; }
  .banner { background: #fff6d6; color: #7a5a00; font-size: 0.9rem; padding-top: 8px; padding-bottom: 8px; }
  h2 { margin: 48px 0 16px; font-size: 1.5rem; }
  main { padding-bottom: 80px; }
  .error { color: #8a1c14; }
</style>
