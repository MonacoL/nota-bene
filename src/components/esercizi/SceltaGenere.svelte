<script lang="ts">
  // Risposta di "Semplice o composto" e "Semplice o composto all'ascolto" (#86): due pulsanti, a un tocco.
  import { GENERI, type Genere } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    onrisposta: (risposta: { genere: Genere }) => void;
  }
  let { t, onrisposta }: Props = $props();
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  {#each GENERI as g (g)}
    <button type="button" onclick={() => onrisposta({ genere: g })}>{t.tempo[g]}</button>
  {/each}
</div>

<style>
  .tastierino { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  button {
    min-height: 56px; min-width: 0; border-radius: var(--radius); border: 1px solid var(--line);
    background: var(--surface); color: var(--ink); font: inherit; font-size: 1.1rem; font-weight: 700; cursor: pointer;
  }
</style>
