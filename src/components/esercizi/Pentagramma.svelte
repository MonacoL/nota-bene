<script lang="ts">
  // Il rigo di un Esercizio: poche note, ingrandite, centrate. Una scala intera chiede più spazio e meno ingrandimento.
  // A ogni disegno nuovo chiama ondisegno, che all'Ascolto (ticket #35) serve per tempi e note da illuminare.
  import type { TuneObject } from 'abcjs';
  import { disegna } from '../../scripts/abc';

  interface Props { abc: string; larghezzaMassima?: number; scala?: number; ondisegno?: (disegno: TuneObject) => void }
  let { abc, larghezzaMassima = 260, scala = 1.5, ondisegno }: Props = $props();
  let contenitore: HTMLDivElement;

  $effect(() => {
    const ridisegna = () => {
      const disegno = disegna(contenitore, abc, { larghezzaMassima, scala });
      if (disegno) ondisegno?.(disegno);
    };
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
  .pentagramma :global(.suona) { fill: var(--suona); }
</style>
