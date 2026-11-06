<script lang="ts">
  // Risposta di "Riconosci il tempo": scelta multipla fra i Tempi, a un tocco, perché sono pochi
  // (ticket "Interazione negli Esercizi di teoria da telefono").
  import type { NomeTempo } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    scelte: NomeTempo[];
    onrisposta: (risposta: { tempo: NomeTempo }) => void;
  }
  let { t, scelte, onrisposta }: Props = $props();
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  {#each scelte as tempo (tempo)}
    <button type="button" onclick={() => onrisposta({ tempo })}>{tempo}</button>
  {/each}
</div>

<style>
  /* Semplici sopra, composti sotto: 2/4 3/4 4/4 e 3/8 6/8 9/8 12/8. */
  .tastierino { display: grid; gap: 6px; grid-template-columns: repeat(12, 1fr); }
  button {
    grid-column: span 3; min-height: 48px; min-width: 0; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.1rem; font-weight: 700; cursor: pointer;
  }
  button:nth-child(-n + 3) { grid-column: span 4; }
</style>
