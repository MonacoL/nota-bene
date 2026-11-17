<script lang="ts">
  // Risposta di "Scegli le figure" (#85): tre caselle, Suddivisione, Pulsazione e Battuta, e una sola tavolozza di
  // Figure più il punto. Si tocca una casella e poi una Figura: Suddivisione e Pulsazione ne tengono una e passano alla
  // casella dopo; la Battuta ne accoglie più di una, legate. ⌫ toglie l'ultima Figura della casella scelta.
  import { FIGURE_METRICA, nomeFigura, type Figura as F, type NomeFigura } from '../../esercizi';
  import type { Lingua } from '../../i18n';
  import type { Dizionario } from '../../i18n/it';
  import Figura from './Figura.svelte';

  type Casella = 'suddivisione' | 'pulsazione' | 'battuta';
  interface Props {
    t: Dizionario['serie'];
    lingua: Lingua;
    onrisposta: (risposta: { suddivisione: F; pulsazione: F; battuta: F[] }) => void;
  }
  let { t, lingua, onrisposta }: Props = $props();

  const CASELLE: Casella[] = ['suddivisione', 'pulsazione', 'battuta'];
  /** Al massimo tre Figure legate nella Battuta: nessuna Indicazione metrica dell'Esercizio ne vuole di più. */
  const MASSIMO_LEGATE = 3;

  let attiva = $state<Casella>('suddivisione');
  let punto = $state(false);
  let scelte = $state<Record<Casella, F[]>>({ suddivisione: [], pulsazione: [], battuta: [] });

  function aggiungi(figura: NomeFigura) {
    const f = { figura, punto };
    punto = false;
    if (attiva === 'battuta') {
      if (scelte.battuta.length < MASSIMO_LEGATE) scelte.battuta = [...scelte.battuta, f];
      return;
    }
    scelte[attiva] = [f];
    attiva = attiva === 'suddivisione' ? 'pulsazione' : 'battuta';
  }

  const nome = (figure: F[]) => figure.map((f) => nomeFigura(f)[lingua]).join(` ${t.caselle.legata} `);
  const pronta = $derived(scelte.suddivisione.length === 1 && scelte.pulsazione.length === 1 && scelte.battuta.length > 0);
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  <div class="caselle">
    {#each CASELLE as c (c)}
      <button type="button" class="casella" aria-pressed={attiva === c} onclick={() => (attiva = c)}>
        <span class="etichetta">{t.caselle[c]}</span>
        <span class="valore" class:vuota={scelte[c].length === 0}>{scelte[c].length ? nome(scelte[c]) : t.caselle.vuota}</span>
      </button>
    {/each}
  </div>
  <div class="riga figure">
    {#each FIGURE_METRICA as f (f)}
      <button type="button" aria-label={t.figure[f]} onclick={() => aggiungi(f)}><Figura figura={f} /></button>
    {/each}
    <button type="button" aria-label={t.punto} aria-pressed={punto} onclick={() => (punto = !punto)}><Figura figura="punto" /></button>
  </div>
  <div class="riga invio">
    <button type="button" class="cancella" aria-label={t.cancella} disabled={scelte[attiva].length === 0} onclick={() => (scelte[attiva] = scelte[attiva].slice(0, -1))}>⌫</button>
    <button type="button" class="verifica" disabled={!pronta} onclick={() => onrisposta({ suddivisione: scelte.suddivisione[0]!, pulsazione: scelte.pulsazione[0]!, battuta: scelte.battuta })}>
      {t.verifica}
    </button>
  </div>
</div>

<style>
  .tastierino { display: grid; gap: 8px; }
  .caselle { display: grid; gap: 4px; }
  .casella {
    display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 44px; padding: 4px 12px;
    text-align: left;
  }
  .etichetta { color: var(--muted); font-size: 0.95rem; }
  .valore { font-weight: 700; text-align: right; }
  .valore.vuota { font-weight: 400; color: var(--muted); }
  .casella[aria-pressed='true'] { border: 2px solid var(--accent); }
  .casella[aria-pressed='true'] .etichetta { color: var(--accent); }
  .riga { display: grid; gap: 6px; }
  .figure { grid-template-columns: repeat(6, 1fr); }
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
  .figure button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .verifica {
    min-width: 50%; padding: 0 24px; border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700;
  }
</style>
