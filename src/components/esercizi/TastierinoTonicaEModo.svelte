<script lang="ts">
  // Risposta di "Trova Tonica e Modo" (ticket #35), in due passi come nel Capitolo 7: prima la tonica (♭ ♮ ♯ e
  // nome, poi Avanti), poi maggiore o minore e Verifica. Dal secondo passo si torna al primo per cambiare la tonica.
  import type { Alterazione, Lettera, Modo } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';
  import TastierinoNota from './TastierinoNota.svelte';

  type Tonica = { lettera: Lettera; alterazione: Alterazione };
  interface Props {
    t: Dizionario['serie'];
    onrisposta: (risposta: { tonica: Tonica; modo: Modo }) => void;
  }
  let { t, onrisposta }: Props = $props();

  const MODI: Modo[] = ['maggiore', 'minore'];
  const SEGNI: Record<Alterazione, string> = { [-1]: '♭', 0: '', 1: '♯' };

  let tonica = $state<Tonica | undefined>();
  let secondoPasso = $state(false);
  let modo = $state<Modo | undefined>();
</script>

{#if !secondoPasso || !tonica}
  <TastierinoNota {t} invio={t.avanti} iniziale={tonica} onrisposta={(n) => ((tonica = n), (secondoPasso = true))} />
{:else}
  <div class="tastierino" role="group" aria-label={t.risposta}>
    <div class="riga">
      <button type="button" class="indietro" onclick={() => (secondoPasso = false)}>
        {t.modo.tonica.replace('{nome}', `${t.note[tonica.lettera]}${SEGNI[tonica.alterazione]}`)}
      </button>
    </div>
    <p class="domanda">{t.modo.domanda}</p>
    <div class="riga modi">
      {#each MODI as m (m)}
        <button type="button" aria-pressed={modo === m} onclick={() => (modo = m)}>{t.modo[m]}</button>
      {/each}
    </div>
    <div class="riga invio">
      <button type="button" class="verifica" disabled={!modo} onclick={() => tonica && modo && onrisposta({ tonica, modo })}>
        {t.verifica}
      </button>
    </div>
  </div>
{/if}

<style>
  .tastierino { display: grid; gap: 8px; }
  .riga { display: grid; gap: 6px; }
  .modi { grid-template-columns: repeat(2, 1fr); }
  .invio { display: flex; justify-content: flex-end; }
  .domanda { margin: 0; font-weight: 700; }
  button {
    min-height: 48px; min-width: 0; padding: 0 12px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; cursor: pointer;
  }
  .indietro { justify-self: start; border: none; background: transparent; color: var(--accent); padding: 0 4px; }
  button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
  .verifica:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
