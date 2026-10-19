<!-- TODO: shared tooltip. Planned API: bind `x`, `y`, `html`; visuals set them on pointer events. -->
<script lang="ts">
  interface Props { x: number; y: number; visible: boolean; html: string }
  let { x, y, visible, html }: Props = $props();
</script>

<div class="tip" style:left="{x + 14}px" style:top="{y + 14}px" style:opacity={visible ? 1 : 0}>{@html html}</div>

<style>
  .tip { position: fixed; pointer-events: none; z-index: 10; background: #1f2328; color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 12px; max-width: 240px; }
</style>
