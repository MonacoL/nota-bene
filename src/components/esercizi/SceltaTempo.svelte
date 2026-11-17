<script lang="ts">
  // Risposta di "Riconosci il tempo" (#85): quante pulsazioni (binario … misto) e come si suddividono (semplice o
  // composto), poi Verifica. Due righe di pulsanti a un tocco, come il secondo passo di "Trova tonica e modo".
  import { GENERI, NUMERI_TEMPO, type Genere, type NumeroTempo } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    onrisposta: (risposta: { numero: NumeroTempo; genere: Genere }) => void;
  }
  let { t, onrisposta }: Props = $props();

  let numero = $state<NumeroTempo | undefined>();
  let genere = $state<Genere | undefined>();
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  <p class="domanda" id="numero">{t.tempo.numero}</p>
  <div class="riga numeri" role="group" aria-labelledby="numero">
    {#each NUMERI_TEMPO as n (n)}
      <button type="button" aria-pressed={numero === n} onclick={() => (numero = n)}>{t.tempo[n]}</button>
    {/each}
  </div>
  <p class="domanda" id="genere">{t.tempo.genere}</p>
  <div class="riga generi" role="group" aria-labelledby="genere">
    {#each GENERI as g (g)}
      <button type="button" aria-pressed={genere === g} onclick={() => (genere = g)}>{t.tempo[g]}</button>
    {/each}
  </div>
  <div class="riga invio">
    <button type="button" class="verifica" disabled={!numero || !genere} onclick={() => numero && genere && onrisposta({ numero, genere })}>
      {t.verifica}
    </button>
  </div>
</div>

<style>
  .tastierino { display: grid; gap: 6px; }
  .riga { display: grid; gap: 6px; }
  /* Cinque nomi lunghi: tre sopra e due sotto, così a 320 px non si tagliano. */
  .numeri { grid-template-columns: repeat(6, 1fr); }
  .numeri button { grid-column: span 2; }
  .numeri button:nth-child(n + 4) { grid-column: span 3; }
  /* "quaternario" non deve andare a capo nemmeno a 320 px. */
  .numeri button { font-size: 0.95rem; white-space: nowrap; padding: 0 2px; }
  .generi { grid-template-columns: repeat(2, 1fr); }
  .invio { display: flex; justify-content: flex-end; margin-top: 4px; }
  .domanda { margin: 4px 0 0; font-weight: 700; }
  button {
    min-height: 48px; min-width: 0; padding: 0 6px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; cursor: pointer;
  }
  button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
  .verifica:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
