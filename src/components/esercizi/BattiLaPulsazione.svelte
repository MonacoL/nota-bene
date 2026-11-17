<script lang="ts">
  // "Batti la pulsazione" (#86, ADR-0012): parte un brano e il corista batte la pulsazione con la barra spaziatrice o
  // toccando il pulsante grande. Si vede subito se il tocco è in tempo, e alla fine un riepilogo. Non è una Serie e
  // non conta per il Capitolo completato. I tocchi si misurano sull'orologio dell'audio, meno la latenza d'uscita.
  import { creaLettore } from '../../audio/lettore';
  import { branoPerBattere, casuale, NOTE_BRANI, valutaBattiti, type Brano, type Tocco } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    /** Il seed del primo brano; ogni "Ancora" passa al successivo. */
    seed: number;
  }
  let { t, seed }: Props = $props();

  let giro = $state(0);
  const brano = $derived<Brano>(branoPerBattere(casuale(seed + giro)));
  let fase = $state<'pronto' | 'suona' | 'fine'>('pronto');
  let tocchi = $state<number[]>([]);
  let ultimo = $state<Tocco | undefined>();
  let zero: number | undefined;
  let contesto: AudioContext | undefined;

  const lettore = creaLettore<'batti'>({
    campioni: `${import.meta.env.BASE_URL}audio/pianoforte/`,
    note: NOTE_BRANI,
    cambio: (f) => {
      if (f === null && fase === 'suona') fase = 'fine';
    },
  });
  $effect(() => () => lettore.chiudi());

  const punteggio = $derived(valutaBattiti(tocchi, brano.pulsazioni));

  function avvia() {
    tocchi = [];
    ultimo = undefined;
    zero = undefined;
    fase = 'suona';
    lettore.tocca('batti', () => brano.note, undefined, (z, ctx) => ((zero = z), (contesto = ctx)));
  }

  function ferma() {
    lettore.ferma();
    fase = 'fine';
  }

  function batti() {
    if (fase !== 'suona' || zero === undefined || !contesto) return;
    // Il suono arriva all'orecchio dopo la latenza d'uscita: il tocco si confronta con quello che si è sentito.
    const latenza = contesto.outputLatency || contesto.baseLatency || 0;
    tocchi = [...tocchi, contesto.currentTime - zero - latenza];
    ultimo = valutaBattiti(tocchi, brano.pulsazioni).tocchi.at(-1);
  }

  function tasto(e: KeyboardEvent) {
    if (e.code !== 'Space' || fase !== 'suona') return;
    e.preventDefault();
    if (!e.repeat) batti();
  }

  const ESITI = { 'in tempo': 'inTempo', 'in anticipo': 'inAnticipo', 'in ritardo': 'inRitardo', doppio: 'doppio' } as const;
</script>

<svelte:window onkeydown={tasto} />

<section class="batti" aria-label={t.tipi['batti-la-pulsazione']}>
  <p class="spiegazione">{t.batti.spiegazione}</p>
  {#if fase === 'suona'}
    <button type="button" class="tocco" onpointerdown={(e) => (e.preventDefault(), batti())}>{t.batti.batti}</button>
    <p class="esito" aria-live="polite">{ultimo ? t.batti[ESITI[ultimo.esito]] : ''}</p>
    <button type="button" class="secondario" onclick={ferma}>{t.batti.ferma}</button>
  {:else}
    {#if fase === 'fine'}
      <p class="riepilogo" aria-live="polite">
        {t.batti.riepilogo.replace('{n}', String(punteggio.inTempo)).replace('{m}', String(brano.pulsazioni.length))}
      </p>
    {/if}
    <button
      type="button"
      class="avvia"
      onclick={() => {
        if (fase === 'fine') giro += 1;
        avvia();
      }}>{fase === 'fine' ? t.batti.ancora : t.batti.avvia}</button
    >
  {/if}
</section>

<style>
  .batti { display: grid; gap: 12px; }
  .spiegazione { margin: 0; color: var(--muted); }
  button {
    min-height: 48px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--surface);
    color: var(--ink); font: inherit; cursor: pointer;
  }
  .avvia { border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700; }
  /* Grande, per il pollice: si batte senza guardare. */
  .tocco {
    min-height: 160px; border: none; background: var(--accent); color: var(--accent-ink); font-size: 1.4rem; font-weight: 700;
    touch-action: manipulation; user-select: none; -webkit-user-select: none;
  }
  .esito { margin: 0; min-height: 1.5em; text-align: center; font-weight: 700; }
  .riepilogo { margin: 0; font-size: 1.2rem; font-weight: 700; }
</style>
