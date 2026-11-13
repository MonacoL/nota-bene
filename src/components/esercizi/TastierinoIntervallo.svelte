<script lang="ts">
  // Risposta agli Esercizi sugli intervalli: il numero (2ª…8ª), poi la qualità, poi Verifica. Rispecchia il
  // ragionamento: prima si contano le note, poi i semitoni (ticket "Interazione negli Esercizi di teoria da telefono").
  import { NUMERI, QUALITA, type Intervallo, type Numero, type Qualita } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    onrisposta: (risposta: Intervallo) => void;
  }
  let { t, onrisposta }: Props = $props();

  let numero = $state<Numero | undefined>();
  let qualita = $state<Qualita | undefined>();
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  <div class="riga numeri">
    {#each NUMERI as n (n)}
      <button type="button" aria-pressed={numero === n} onclick={() => (numero = n)}>{t.numeri[n]}</button>
    {/each}
  </div>
  <div class="riga qualita">
    {#each QUALITA as q (q)}
      <button type="button" aria-pressed={qualita === q} onclick={() => (qualita = q)}>{t.qualita[q]}</button>
    {/each}
  </div>
  <div class="riga invio">
    <button type="button" class="verifica" disabled={!numero || !qualita} onclick={() => numero && qualita && onrisposta({ numero, qualita })}>
      {t.verifica}
    </button>
  </div>
</div>

<style>
  .tastierino { display: grid; gap: 8px; }
  .riga { display: grid; gap: 6px; }
  .numeri { grid-template-columns: repeat(7, 1fr); }
  /* Tre qualità sopra (minore, maggiore, giusta) e due sotto, più larghe: "aumentata" non sta in un quinto di riga. */
  .qualita { grid-template-columns: repeat(6, 1fr); }
  .qualita button { grid-column: span 2; }
  .qualita button:nth-child(n + 4) { grid-column: span 3; }
  .invio { display: flex; justify-content: flex-end; }
  button {
    min-height: 48px; min-width: 0; padding: 0 2px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; cursor: pointer;
  }
  button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
  .verifica:disabled { opacity: 0.45; cursor: not-allowed; }
  @media (max-width: 359px) { .numeri button { font-size: 0.95rem; } }
</style>
