<!-- Stand-in for a storyboard frame whose chart is not built yet: the frame's headline number (real data) and the
     planned design, inside a dashed box the same size as a chart, so the page layout and story read end to end. -->
<script lang="ts">
  interface Props { stat: string; statLabel: string; plan: string; source: string }
  let { stat, statLabel, plan, source }: Props = $props();
</script>

<div class="ph">
  <div class="stat"><strong>{stat}</strong><span>{statLabel}</span></div>
  <div class="plan">
    <span class="tag">Visualization in progress</span>
    <p>{plan}</p>
    <p class="src">Data: {source}</p>
  </div>
</div>

<style>
  .ph {
    display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: center; min-height: 220px;
    border: 2px dashed var(--rule); border-radius: 10px; padding: 24px;
    background: repeating-linear-gradient(135deg, transparent 0 14px, var(--wash) 14px 15px);
  }
  @media (min-width: 640px) { .ph { grid-template-columns: minmax(160px, 2fr) minmax(0, 3fr); } }
  .stat strong { display: block; font-size: clamp(2.6rem, 8vw, 3.6rem); line-height: 1; font-variant-numeric: tabular-nums; }
  .stat span { display: block; margin-top: 6px; color: var(--muted); font-size: 0.95rem; }
  .tag { display: inline-block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
    border: 1px solid var(--rule); border-radius: 999px; padding: 2px 8px; background: var(--card); }
  .plan p { margin: 8px 0 0; font-size: 0.9rem; color: var(--muted); }
  .plan .src { font-size: 0.78rem; color: var(--faint); }
</style>
