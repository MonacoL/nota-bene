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
    /** Il link al capitolo, che col dito sta nella riga dell'avanzamento al posto di quello della pagina. */
    capitolo: { href: string; etichetta: string };
  }
  let { lingua, t, dichiarazioni, successivo, capitolo }: Props = $props();

  const LUNGHEZZA = 10;
  const seed = new URLSearchParams(window.location.search).get('seed');
  const base = seed !== null && /^\d+$/.test(seed) ? Number(seed) : Math.floor(Math.random() * 2 ** 31);

  let scheda = $state(0);
  /** Quante Serie sono iniziate prima di questa: sposta i seed, così ogni Serie è nuova. */
  let serieIniziate = $state(0);
  let n = $state(0);
  let giuste = $state(0);
  let riscontro = $state<Riscontro | undefined>();
  // Durante la Serie <html> ha data-serie (lo mette già la pagina, prima del primo disegno): col dito la pagina
  // è alta quanto lo schermo e non scorre (regole nella pagina degli Esercizi). Nel riepilogo torna normale.
  $effect(() => {
    document.documentElement.toggleAttribute('data-serie', !!esercizio);
    return () => document.documentElement.removeAttribute('data-serie');
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
      <a class="torna" href={capitolo.href} aria-label={capitolo.etichetta}>←</a>
      <span id="avanzamento">{t.avanzamento.replace('{n}', String(numero))}</span>
      <div class="barra" role="progressbar" aria-labelledby="avanzamento" aria-valuemin="1" aria-valuemax={LUNGHEZZA} aria-valuenow={numero}>
        <div style:width="{(numero / LUNGHEZZA) * 100}%"></div>
      </div>
    </div>

    <div class="esercizio" class:risposto={riscontro}>
      <p class="domanda">{t.domande[esercizio.tipo]}</p>
      <Pentagramma abc={esercizio.abc} />
    </div>

    <div class="fondo">
      {#if riscontro}
        <Foglio {t} {lingua} {riscontro} onavanti={avanti} />
      {:else}
        {#key `${serieIniziate}-${n}`}
          <TastierinoNota {t} onrisposta={rispondi} />
        {/key}
      {/if}
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
  /* Il foglio di riscontro prende il posto del tastierino: dopo l'errore la soluzione compare subito, senza "Riprova". */
  .fondo { margin-top: 16px; }
  .torna { display: none; }
  /*
   * Col dito, durante la Serie, tutto sta nello schermo: riquadro in alto, tastierino o foglio in fondo, nella zona
   * del pollice. Dopo la risposta la domanda si nasconde, così sui telefoni piccoli resta posto per il pentagramma.
   */
  @media not ((hover: hover) and (pointer: fine)) {
    :global(html[data-serie]) .serie { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    :global(html[data-serie]) .esercizio { flex: 0 1 auto; min-height: 0; overflow: hidden; }
    :global(html[data-serie]) .esercizio.risposto .domanda { display: none; }
    :global(html[data-serie]) .fondo { margin-top: auto; padding-top: 12px; padding-bottom: env(safe-area-inset-bottom); }
    :global(html[data-serie]) .avanzamento { margin-bottom: 8px; }
    :global(html[data-serie]) .torna {
      display: inline-flex; align-items: center; justify-content: center; min-width: 48px; min-height: 48px;
      margin-left: -12px; font-size: 1.4rem; text-decoration: none;
    }
  }
  .riepilogo { padding: 16px 0; }
  .punteggio { font-size: 1.3rem; font-weight: 700; }
  .azioni { display: flex; flex-wrap: wrap; gap: 12px; }
  button.pulsante { border: none; font: inherit; font-weight: 700; cursor: pointer; }
</style>
