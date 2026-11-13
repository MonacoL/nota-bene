<script lang="ts">
  // Risposta di "Completa la battuta": la tavolozza di Figure (semibreve, minima, semiminima, croma) più il punto.
  // Si possono mettere più Figure, ognuna compare sul rigo, e conta la somma; ⌫ cancella l'ultima
  // (ticket "Interazione negli Esercizi di teoria da telefono").
  import { abcBattute, durata, FIGURE, type Figura as F, type NomeTempo } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';
  import Figura from './Figura.svelte';

  interface Props {
    t: Dizionario['serie'];
    tempo: NomeTempo;
    /** Le Figure già scritte, a gruppi per Pulsazione, in semicrome. */
    scritte: number[][];
    onbozza: (abc: string) => void;
    onrisposta: (risposta: { figure: F[] }) => void;
  }
  let { t, tempo, scritte, onbozza, onrisposta }: Props = $props();

  let punto = $state(false);
  let aggiunte = $state<F[]>([]);

  // Le Figure aggiunte vanno ognuna per conto suo, dopo quelle scritte.
  $effect(() => onbozza(abcBattute(tempo, [[...scritte, ...aggiunte.map((f) => [durata([f])])]])));

  function aggiungi(figura: F['figura']) {
    aggiunte = [...aggiunte, { figura, punto }];
    punto = false;
  }
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  <div class="riga figure">
    {#each FIGURE as f (f)}
      <button type="button" aria-label={t.figure[f]} onclick={() => aggiungi(f)}><Figura figura={f} /></button>
    {/each}
    <button type="button" aria-label={t.punto} aria-pressed={punto} onclick={() => (punto = !punto)}><Figura figura="punto" /></button>
  </div>
  <div class="riga invio">
    <button type="button" class="cancella" aria-label={t.cancella} disabled={aggiunte.length === 0} onclick={() => (aggiunte = aggiunte.slice(0, -1))}>⌫</button>
    <button type="button" class="verifica" disabled={aggiunte.length === 0} onclick={() => onrisposta({ figure: aggiunte })}>{t.verifica}</button>
  </div>
</div>

<style>
  .tastierino { display: grid; gap: 8px; }
  .riga { display: grid; gap: 6px; }
  .figure { grid-template-columns: repeat(5, 1fr); }
  .invio { display: flex; justify-content: space-between; gap: 6px; }
  button {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 56px; min-width: 0; padding: 0 2px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; cursor: pointer;
  }
  .invio button { min-height: 48px; }
  .cancella { min-width: 25%; font-size: 1.3rem; }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
</style>
