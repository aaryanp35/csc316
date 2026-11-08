<!-- The story page, following the Milestone 6 storyboard: hook (frame 1) -> making it (2-3) -> buying more, wearing
     less (4) -> where it ends up (5-7) -> the so-what (8) -> what you can do (9). Frames without a finished chart show a
     Placeholder with their real headline number. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { loadDataset } from "./lib/data/load";
  import VisCard from "./lib/components/ui/VisCard.svelte";
  import Placeholder from "./lib/components/ui/Placeholder.svelte";
  import BlendDiverge from "./lib/components/visuals/BlendDiverge.svelte";
  import GrowthLines from "./lib/components/visuals/GrowthLines.svelte";
  import WearItLonger from "./lib/components/visuals/WearItLonger.svelte";
  import { fmtInt, fmtOne, fmtShare } from "./lib/utils/format";

  const dataset = loadDataset();

  const chapters = [
    { id: "making", n: "I", label: "Making it" },
    { id: "scale", n: "II", label: "Buying more" },
    { id: "after", n: "III", label: "After you" },
    { id: "act", n: "IV", label: "What you can do" },
  ];
  let active = $state("");
  let progress = $state(0);
  onMount(() => {
    const onScroll = () => {
      const h = document.documentElement;
      progress = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) active = e.target.id;
    }, { rootMargin: "-45% 0px -50% 0px" });
    const watch = () => chapters.forEach((c) => { const el = document.getElementById(c.id); if (el) io.observe(el); });
    dataset.then(() => requestAnimationFrame(watch));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  });
</script>

<nav class="topnav" aria-label="Chapters">
  <a class="brand" href="#top">The True Cost of Fast Fashion</a>
  <ol>
    {#each chapters as c (c.id)}
      <li><a href="#{c.id}" class:on={active === c.id}><span>{c.n}</span> {c.label}</a></li>
    {/each}
  </ol>
  <div class="progress" style:transform="scaleX({progress})"></div>
</nav>

{#await dataset}
  <p class="loading">Loading data…</p>
{:then data}
  {@const f = data.facts}
  <!-- Frame 1: the hook -->
  <header id="top" class="hero">
    <div class="hero-text">
      <p class="eyebrow">A data story for anyone who has bought a $20 T-shirt</p>
      <h1>One T-shirt.<br /><span>{fmtInt(f.tshirt_water_litres)} litres</span> of water.</h1>
      <p class="lede">
        That's roughly what it takes to grow the cotton and make one T-shirt, about {Math.round(f.tshirt_water_litres / 2 / 365 * 10) / 10} years
        of drinking water for one person (at 2 L a day). None of it shows up on the price tag. Follow one garment from the factory to the bin,
        and see the one thing that actually shrinks its footprint.
      </p>
      <a class="cue" href="#making">Start with the fabric ↓</a>
    </div>
    <svg class="hero-shirt" viewBox="0 0 200 222" aria-hidden="true">
      <path d="M62,12 L84,4 Q100,22 116,4 L138,12 L192,46 L170,84 L150,72 L150,214 L50,214 L50,72 L30,84 L8,46 Z" />
      <path class="drop" d="M100,92 C112,112 120,124 120,136 A20,20 0 0 1 80,136 C80,124 88,112 100,92 Z" />
    </svg>
  </header>

  <main>
    <section id="making" class="chapter">
      <header class="chapter-head">
        <p class="num">Chapter I</p>
        <h2>The footprint is made before you buy it</h2>
        <p>
          Most of a garment's factory carbon comes from turning fibre into fabric: spinning, knitting or weaving, and
          dyeing. Sewing it together is a rounding error. And the fibre label matters more than you'd think.
        </p>
      </header>

      <VisCard frame={2} title="Making the fabric, not sewing it, is where the carbon goes">
        <Placeholder stat={fmtShare(f.fabric_making_share_of_factory_co2)} statLabel="of a T-shirt's factory CO₂ comes from making the fabric; sewing is about {fmtShare(f.sewing_share_of_factory_co2)}"
          plan="Stacked bars: kg CO₂e per kg of T-shirt for cotton, polyester and wool, split into spinning, knitting, dyeing and sewing, with sewing called out as the thin top slice."
          source="Carbonfact open LCA database (tshirt_stages.csv)" />
      </VisCard>

      <VisCard frame={3} title="Blends are worse than pure fibre">
        <BlendDiverge data={data.blends} steps={data.blendSteps} />
      </VisCard>
    </section>

    <section id="scale" class="chapter">
      <header class="chapter-head">
        <p class="num">Chapter II</p>
        <h2>We buy more, and wear it less</h2>
        <p>
          One T-shirt is small. Multiply it by the number of garments made each year, and by how quickly each one is
          thrown away, and the footprint keeps growing, and in Europe, it has moved into our homes.
        </p>
      </header>
      <VisCard frame={4} title="How have clothing production and textile waste evolved since 2000?">
        <GrowthLines data={data.growth} eu={data.euWaste} />
      </VisCard>
    </section>

    <section id="after" class="chapter">
      <header class="chapter-head">
        <p class="num">Chapter III</p>
        <h2>After you let it go</h2>
        <p>
          Donating feels like a second life, and recycling feels like a fix. The sorting data from Sweden and Norway
          tells a more complicated story.
        </p>
      </header>

      <VisCard frame={5} title="Where donations go">
        <Placeholder stat={fmtShare(f.sweden_export_share)} statLabel="of donated garments sorted in Sweden are exported, and the data doesn't follow them further"
          plan="A branching tree of 100 donated garments: resold in Sweden, exported (plane icon), sent to recycling, other; branch thickness = share of garments."
          source="Swedish sorting plant (Wargön Innovation), {fmtInt(f.sweden_items)} labelled garments (donations.csv)" />
      </VisCard>

      <VisCard frame={6} title="Is recycling the fix?">
        <Placeholder stat="{Math.round(f.recyclable_share * 100)} in 100" statLabel="garments are simple enough for fibre-to-fibre recycling"
          plan="A sieve funnel of 100 garments: single fibre → one layer → no zips, buttons or rivets → no sequins, membranes or big prints. Each sieve drops the garments that fail it."
          source="Norway post-consumer garments, {fmtInt(f.norway_garments)} items (recycling_funnel.csv)" />
      </VisCard>

      <VisCard frame={7} title="Thrown out, still wearable">
        <Placeholder stat={fmtShare(f.waste_wearable_share)} statLabel="of garments in Norway's textile-waste bins were still wearable; {fmtShare(f.waste_looks_new_share)} looked new"
          plan="A bin filled with 100 garment icons coloured by condition, from beyond repair to looks new; about 1 in {Math.round(1 / f.waste_price_tag_share)} still had its price tag on."
          source="Norway post-consumer garments, {fmtInt(f.waste_garments_graded)} graded waste items (waste_condition.csv)" />
      </VisCard>
    </section>

    <section id="act" class="chapter">
      <header class="chapter-head">
        <p class="num">Chapter IV</p>
        <h2>So what can you actually do?</h2>
        <p>
          Much of a garment's footprint is fixed before you buy it, and most discarded clothes are still wearable.
          So the cheapest, most effective move is also the simplest: wear what you have, for longer.
        </p>
      </header>

      <!-- Frame 8: the receipt -->
      <div class="sowhat">
        <div class="receipt" aria-label="Receipt for one cotton T-shirt">
          <p class="r-title">Receipt · 1 cotton T-shirt</p>
          <dl>
            <div><dt>Water</dt><dd>{fmtInt(f.tshirt_water_litres)} L</dd></div>
            <div><dt>Factory carbon</dt><dd>{fmtOne(f.tshirt_factory_co2_kg)} kg CO₂e</dd></div>
          </dl>
          <p class="paid">PAID<span>before the first wear</span></p>
        </div>
        <div class="sowhat-text">
          <p><strong>Much of a garment's footprint is fixed before purchase…</strong> Once it's made, the water and carbon are spent, whether you wear it once or a hundred times.</p>
          <p><strong>…and most discarded clothes are still wearable.</strong> {fmtShare(f.waste_wearable_share)} of what Norwegians threw in textile waste could have been worn again.</p>
          <p class="so">So: wear and keep each piece longer. Every extra wear makes each wear carry a smaller share of the total.</p>
        </div>
      </div>

      <VisCard frame={9} title="Wear it longer" id="wear">
        <WearItLonger facts={f} />
      </VisCard>

      <div class="checklist">
        <h3>Four things that follow from the data</h3>
        <ul>
          <li><span>✓</span><div><strong>Keep it, repair it, wear it longer.</strong> {fmtShare(f.waste_wearable_share)} of thrown-out clothes still had life in them.</div></li>
          <li><span>✓</span><div><strong>Buy second-hand first.</strong> Its footprint has already been paid.</div></li>
          <li><span>✓</span><div><strong>Pass it on yourself:</strong> sell, swap or give. About {Math.round(f.sweden_export_share * 10)} in 10 donated garments leave the country.</div></li>
          <li><span>✓</span><div><strong>Don't count on recycling.</strong> Only about {Math.round(f.recyclable_share * 100)} in 100 garments are simple enough to be recycled into new fibre.</div></li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="footer">
    <h2>Data and method</h2>
    <ul>
      <li><strong>Carbonfact open LCA database</strong> (v1.1): CO₂e and water-scarcity per kg for spinning, weaving, knitting, dyeing, finishing and assembly. World averages, factory steps only.</li>
      <li><strong>Norway post-consumer garments</strong> (Zenodo 20440761): {fmtInt(f.norway_garments)} garments from donation and waste streams; fibres, layers, trims, condition.</li>
      <li><strong>Swedish second-hand sorting</strong> (Zenodo 12518734): {fmtInt(f.sweden_items)} garments labelled at Wargön Innovation's sorting plant and where sorters sent them (Myrorna's shop data is left out).</li>
      <li><strong>Eurostat env_wasgen</strong>: EU27 textile waste (W076) by sector, {f.eu_years[0]}–{f.eu_years[1]}.</li>
      <li><strong>The Fast Fashion Industry Dataset 2000–2023</strong> (Kaggle): garments produced and wears per garment (McKinsey), US textile waste (EPA), water per T-shirt (WWF).</li>
    </ul>
    <p>Cleaning and calculations: <code>scripts/pipeline/build_data.py</code>. CSC316 project by Shaurya Sareen, Aaryan Patel and Kai Tano Bague.</p>
  </footer>
{:catch err}
  <p class="loading error">Could not load data: {err.message}</p>
{/await}

<style>
  .topnav {
    position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 16px; padding: 10px 20px;
    background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--rule);
  }
  .brand { font-weight: 700; color: var(--ink); text-decoration: none; white-space: nowrap; font-size: 0.95rem; }
  .topnav ol { display: flex; gap: 4px; list-style: none; margin: 0 0 0 auto; padding: 0; overflow-x: auto; }
  .topnav ol a { display: block; padding: 4px 10px; border-radius: 999px; color: var(--muted); text-decoration: none; font-size: 0.82rem; white-space: nowrap; }
  .topnav ol a span { color: var(--faint); font-weight: 700; margin-right: 2px; }
  .topnav ol a.on { background: var(--ink); color: var(--bg); }
  .topnav ol a.on span { color: inherit; }
  .progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--worse); transform-origin: 0 50%; }
  @media (max-width: 720px) { .brand { display: none; } .topnav ol { margin-left: 0; } .topnav ol a { font-size: 0.78rem; padding: 4px 8px; } }

  .loading { max-width: 960px; margin: 80px auto; padding: 0 20px; color: var(--muted); }
  .error { color: var(--worse); }

  .hero {
    max-width: 1040px; margin: 0 auto; padding: clamp(48px, 10vh, 120px) 20px clamp(40px, 8vh, 96px);
    display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: center; scroll-margin-top: 60px;
  }
  @media (min-width: 780px) { .hero { grid-template-columns: minmax(0, 3fr) minmax(200px, 2fr); } }
  .eyebrow { margin: 0 0 12px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--faint); }
  h1 { margin: 0; font-size: clamp(2.4rem, 7vw, 4.4rem); line-height: 1.02; letter-spacing: -0.02em; }
  h1 span { color: var(--water); }
  .lede { max-width: 56ch; font-size: 1.1rem; color: var(--muted); margin: 20px 0 24px; }
  .cue { display: inline-block; color: var(--ink); font-weight: 600; text-decoration: none; border-bottom: 2px solid var(--worse); padding-bottom: 2px; }
  .hero-shirt { width: min(100%, 300px); justify-self: center; }
  .hero-shirt path:first-child { fill: var(--card); stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  .hero-shirt .drop { fill: var(--water); animation: drip 3s ease-in-out infinite; transform-origin: 100px 130px; }
  @keyframes drip { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(6px) scale(1.06); } }
  @media (prefers-reduced-motion: reduce) { .hero-shirt .drop { animation: none; } }

  main { max-width: 1000px; margin: 0 auto; padding: 0 20px 40px; }
  .chapter { padding-top: 32px; scroll-margin-top: 56px; }
  .chapter-head { max-width: 680px; margin: 24px 0 28px; }
  .chapter-head .num { margin: 0; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--worse); font-weight: 700; }
  .chapter-head h2 { margin: 4px 0 10px; font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1.15; letter-spacing: -0.01em; }
  .chapter-head p:last-child { margin: 0; color: var(--muted); font-size: 1.05rem; }

  .sowhat { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: center; margin-bottom: 28px; }
  @media (min-width: 720px) { .sowhat { grid-template-columns: minmax(220px, 2fr) minmax(0, 3fr); } }
  .receipt {
    background: var(--card); border: 1px solid var(--rule); padding: 20px 22px 28px; font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
    max-width: 300px; justify-self: center; width: 100%; transform: rotate(-1.5deg);
    mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 16px 51% repeat-x, linear-gradient(#000 0 0) top / 100% 50% no-repeat;
  }
  .r-title { margin: 0 0 12px; text-align: center; font-weight: 700; border-bottom: 1px dashed var(--rule); padding-bottom: 10px; }
  .receipt dl { margin: 0; }
  .receipt dl div { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; }
  .receipt dt { color: var(--muted); }
  .receipt dd { margin: 0; font-weight: 700; }
  .paid { margin: 16px 0 0; text-align: center; color: var(--worse); font-weight: 800; font-size: 1.6rem; letter-spacing: 0.15em; border-top: 1px dashed var(--rule); padding-top: 12px; }
  .paid span { display: block; font-size: 0.75rem; letter-spacing: 0; font-weight: 600; }
  .sowhat-text p { margin: 0 0 12px; }
  .sowhat-text .so { font-size: 1.15rem; font-weight: 700; color: var(--ink); border-left: 3px solid var(--worse); padding-left: 12px; }

  .checklist { background: var(--card); border: 1px solid var(--rule); border-radius: 12px; padding: 24px; }
  .checklist h3 { margin: 0 0 12px; }
  .checklist ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .checklist li { display: flex; gap: 12px; align-items: baseline; }
  .checklist li span { color: var(--better); font-weight: 800; }

  .footer { max-width: 1000px; margin: 0 auto; padding: 32px 20px 64px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 0.88rem; }
  .footer h2 { font-size: 1rem; color: var(--ink); }
  .footer ul { padding-left: 18px; }
  .footer li { margin-bottom: 6px; }
  code { font-size: 0.85em; }
</style>
