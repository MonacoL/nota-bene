<script lang="ts">
  // La Serie: 10 Esercizi dello stesso tipo con barra di avanzamento, foglio di riscontro e riepilogo.
  // Una scheda per tipo se il Capitolo ne ha più di uno; cambiare scheda fa ripartire la Serie. Non si salva niente.
  // Con ?seed=s nell'URL l'Esercizio n (da 0) della prima Serie usa il seed s + n: serve ai test.
  import { genera, valuta, type Esercizio, type Riscontro, type Tipo } from '../../esercizi';
  import type { DichiarazioneEsercizio } from '../../contenuti/schemi';
  import type { Lingua } from '../../i18n';
  import type { Dizionario } from '../../i18n/it';
  import Pentagramma from './Pentagramma.svelte';
  import TastierinoNota from './TastierinoNota.svelte';
  import Foglio from './Foglio.svelte';

  interface Props {
    lingua: Lingua;
    t: Dizionario['serie'];
    dichiarazioni: DichiarazioneEsercizio[];
    successivo?: { href: string; etichetta: string };
  }
  let { lingua, t, dichiarazioni, successivo }: Props = $props();

  const LUNGHEZZA = 10;
  const seed = new URLSearchParams(window.location.search).get('seed');
  const base = seed !== null && /^\d+$/.test(seed) ? Number(seed) : Math.floor(Math.random() * 2 ** 31);

  let scheda = $state(0);
  /** Quante Serie sono iniziate prima di questa: sposta i seed, così ogni Serie è nuova. */
  let serieIniziate = $state(0);
  let n = $state(0);
  let giuste = $state(0);
  let riscontro = $state<Riscontro | undefined>();
  /**
   * Col dito tastierino e foglio stanno fissi in basso, nella zona del pollice; col mouse stanno nella pagina,
   * sotto il pentagramma. La stessa media query è nello stile di .fondo.
   */
  const MOUSE = '(hover: hover) and (pointer: fine)';
  let conMouse = $state(window.matchMedia(MOUSE).matches);
  $effect(() => {
    const query = window.matchMedia(MOUSE);
    const aggiorna = () => (conMouse = query.matches);
    query.addEventListener('change', aggiorna);
    return () => query.removeEventListener('change', aggiorna);
  });

  /** Altezza del fondo fisso (tastierino o foglio): il body la riserva in fondo, così non copre la fine della pagina. */
  let altezzaFondo = $state(0);
  $effect(() => {
    document.body.style.paddingBottom = esercizio && !conMouse ? `${altezzaFondo}px` : '';
  });
  let cartaEsercizio = $state<HTMLDivElement>();

  // Il fondo fisso non deve coprire il pentagramma, neanche a 320 px: se lo copre, si scorre quanto basta.
  $effect(() => {
    if (!cartaEsercizio || !altezzaFondo || conMouse) return;
    void riscontro;
    const sotto = cartaEsercizio.getBoundingClientRect().bottom - (window.innerHeight - altezzaFondo - 8);
    if (sotto > 0) window.scrollBy(0, sotto);
  });

  const dichiarazione = $derived(dichiarazioni[scheda]!);
  const finita = $derived(n >= LUNGHEZZA);
  const esercizio = $derived<Esercizio | undefined>(
    finita ? undefined : genera(dichiarazione.tipo, dichiarazione, base + serieIniziate * LUNGHEZZA + n),
  );

  function nuovaSerie() {
    serieIniziate += 1;
    n = 0;
    giuste = 0;
    riscontro = undefined;
  }

  function scegliScheda(i: number) {
    if (i === scheda) return;
    scheda = i;
    nuovaSerie();
  }

  function rispondi(risposta: Parameters<typeof valuta>[1]) {
    riscontro = valuta(esercizio!, risposta);
    if (riscontro.esito === 'giusto') giuste += 1;
  }

  function avanti() {
    riscontro = undefined;
    n += 1;
  }

  const titoloTipo = (tipo: Tipo) => t.tipi[tipo];
</script>

<div class="serie">
  {#if dichiarazioni.length > 1}
    <div class="schede" role="tablist" aria-label={t.schede}>
      {#each dichiarazioni as d, i (d.tipo)}
        <button type="button" role="tab" aria-selected={i === scheda} onclick={() => scegliScheda(i)}>{titoloTipo(d.tipo)}</button>
      {/each}
    </div>
  {/if}

  {#if esercizio}
    {@const numero = n + 1}
    <div class="avanzamento">
      <span id="avanzamento">{t.avanzamento.replace('{n}', String(numero))}</span>
      <div class="barra" role="progressbar" aria-labelledby="avanzamento" aria-valuemin="1" aria-valuemax={LUNGHEZZA} aria-valuenow={numero}>
        <div style:width="{(numero / LUNGHEZZA) * 100}%"></div>
      </div>
    </div>

    <div class="esercizio" bind:this={cartaEsercizio}>
      <p class="domanda">{t.domande[esercizio.tipo]}</p>
      <Pentagramma abc={esercizio.abc} />
    </div>

    <div class="fondo" bind:clientHeight={altezzaFondo}>
      <div class="wrap contenuto">
        {#if riscontro}
          <Foglio {t} {lingua} {riscontro} onavanti={avanti} />
        {:else}
          {#key `${serieIniziate}-${n}`}
            <TastierinoNota {t} onrisposta={rispondi} />
          {/key}
        {/if}
      </div>
    </div>
  {:else}
    <section class="riepilogo" aria-labelledby="riepilogo">
      <p id="riepilogo" class="punteggio">{t.riepilogo.replace('{n}', String(giuste))}</p>
      <p class="azioni">
        <button type="button" class="pulsante" onclick={nuovaSerie}>{t.altri}</button>
        {#if successivo}<a class="pulsante secondario" href={successivo.href}>{successivo.etichetta}</a>{/if}
      </p>
    </section>
  {/if}
</div>

<style>
  .schede { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .schede button {
    min-height: 48px; padding: 0 16px; border-radius: var(--radius); border: 1px solid var(--line);
    background: var(--surface); color: var(--ink); font: inherit; cursor: pointer;
  }
  .schede button[aria-selected='true'] { border-color: var(--accent); color: var(--accent); font-weight: 700; }
  .avanzamento { display: flex; align-items: center; gap: 12px; color: var(--muted); margin-bottom: 12px; }
  .barra { flex: 1; height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
  .barra div { height: 100%; background: var(--accent); }
  .esercizio {
    padding: 16px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface);
  }
  .domanda { font-weight: 700; font-size: 1.15rem; margin: 0 0 12px; }
  .fondo {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 10;
    padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
    background: var(--bg); border-top: 1px solid var(--line); box-shadow: 0 -6px 16px rgb(0 0 0 / 0.08);
  }
  @media (hover: hover) and (pointer: fine) {
    .fondo { position: static; margin-top: 16px; padding: 0; background: none; border: none; box-shadow: none; }
    .contenuto { padding: 0; }
  }
  .riepilogo { padding: 16px 0; }
  .punteggio { font-size: 1.3rem; font-weight: 700; }
  .azioni { display: flex; flex-wrap: wrap; gap: 12px; }
  button.pulsante { border: none; font: inherit; font-weight: 700; cursor: pointer; }
</style>
