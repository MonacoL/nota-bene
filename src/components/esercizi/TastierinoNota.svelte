<script lang="ts">
  // Risposta di "Nomina la nota": ♭ ♮ ♯, uno dei 7 nomi, poi Verifica (ticket "Interazione negli Esercizi di teoria da telefono").
  import type { Alterazione, Lettera } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    onrisposta: (risposta: { lettera: Lettera; alterazione: Alterazione }) => void;
  }
  let { t, onrisposta }: Props = $props();

  const ALTERAZIONI = [
    { valore: -1, segno: '♭', nome: 'bemolle' },
    { valore: 0, segno: '♮', nome: 'bequadro' },
    { valore: 1, segno: '♯', nome: 'diesis' },
  ] as const;
  const LETTERE: Lettera[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  let alterazione = $state<Alterazione>(0);
  let lettera = $state<Lettera | undefined>();
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  <div class="riga alterazioni">
    {#each ALTERAZIONI as a (a.valore)}
      <button type="button" aria-label={t.alterazioni[a.nome]} aria-pressed={alterazione === a.valore} onclick={() => (alterazione = a.valore)}>
        {a.segno}
      </button>
    {/each}
  </div>
  <div class="riga nomi">
    {#each LETTERE as l (l)}
      <button type="button" aria-pressed={lettera === l} onclick={() => (lettera = l)}>{t.note[l]}</button>
    {/each}
  </div>
  <div class="riga fondo">
    <button type="button" class="verifica" disabled={!lettera} onclick={() => lettera && onrisposta({ lettera, alterazione })}>
      {t.verifica}
    </button>
  </div>
</div>

<style>
  .tastierino { display: grid; gap: 8px; }
  .riga { display: grid; gap: 6px; }
  .alterazioni { grid-template-columns: repeat(3, 1fr); }
  .nomi { grid-template-columns: repeat(7, 1fr); }
  .fondo { display: flex; justify-content: flex-end; }
  button {
    min-height: 48px; min-width: 0; padding: 0 2px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; cursor: pointer;
  }
  .alterazioni button { font-size: 1.3rem; }
  button[aria-pressed='true'] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
  .verifica:disabled { opacity: 0.45; cursor: not-allowed; }
  @media (max-width: 359px) { .nomi button { font-size: 0.95rem; } }
</style>
