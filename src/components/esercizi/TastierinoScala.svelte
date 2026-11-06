<script lang="ts">
  // Risposta di "Costruisci la scala": la tonica è data; si aggiungono le altre 7 note, alterazione e poi nome, e ognuna
  // compare sul rigo. ⌫ cancella l'ultima; Verifica si attiva quando ci sono tutte
  // (ticket "Interazione negli Esercizi di teoria da telefono").
  import { abcScala, inScala, type Alterazione, type Lettera, type Nota } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    tonica: Nota;
    /** Il rigo con la tonica e le note scritte finora. */
    onbozza: (abc: string) => void;
    onrisposta: (risposta: { note: { lettera: Lettera; alterazione: Alterazione }[] }) => void;
  }
  let { t, tonica, onbozza, onrisposta }: Props = $props();

  const ALTERAZIONI = [
    { valore: -1, segno: '♭', nome: 'bemolle' },
    { valore: 0, segno: '♮', nome: 'bequadro' },
    { valore: 1, segno: '♯', nome: 'diesis' },
  ] as const;
  const LETTERE: Lettera[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const TUTTE = 7;

  let alterazione = $state<Alterazione>(0);
  let note = $state<{ lettera: Lettera; alterazione: Alterazione }[]>([]);

  $effect(() => onbozza(abcScala([tonica, ...inScala(tonica, note)])));

  function aggiungi(lettera: Lettera) {
    if (note.length >= TUTTE) return;
    note = [...note, { lettera, alterazione }];
    alterazione = 0;
  }
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
      <button type="button" disabled={note.length >= TUTTE} onclick={() => aggiungi(l)}>{t.note[l]}</button>
    {/each}
  </div>
  <div class="riga invio">
    <button type="button" class="cancella" aria-label={t.cancella} disabled={note.length === 0} onclick={() => (note = note.slice(0, -1))}>⌫</button>
    <button type="button" class="verifica" disabled={note.length < TUTTE} onclick={() => onrisposta({ note })}>{t.verifica}</button>
  </div>
</div>

<style>
  .tastierino { display: grid; gap: 8px; }
  .riga { display: grid; gap: 6px; }
  .alterazioni { grid-template-columns: repeat(3, 1fr); }
  .nomi { grid-template-columns: repeat(7, 1fr); }
  .invio { display: flex; justify-content: space-between; gap: 6px; }
  button {
    min-height: 48px; min-width: 0; padding: 0 2px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; cursor: pointer;
  }
  .alterazioni button, .cancella { font-size: 1.3rem; }
  .cancella { min-width: 25%; }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  button[aria-pressed='true'] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
  @media (max-width: 359px) { .nomi button { font-size: 0.95rem; } }
</style>
