<script lang="ts">
  // Il rigo di un Esercizio: poche note, ingrandite, centrate.
  import { disegna } from '../../scripts/abc';

  let { abc }: { abc: string } = $props();
  let contenitore: HTMLDivElement;

  $effect(() => {
    const ridisegna = () => disegna(contenitore, abc, { larghezzaMassima: 260, scala: 1.5 });
    ridisegna();
    const osservatore = new ResizeObserver(ridisegna);
    osservatore.observe(contenitore);
    return () => osservatore.disconnect();
  });
</script>

<div class="pentagramma" bind:this={contenitore}></div>

<style>
  .pentagramma { color: var(--ink); display: flex; justify-content: center; }
  .pentagramma :global(svg) { display: block; max-width: 100%; height: auto; }
</style>
