<script lang="ts">
  // La Serie: 10 Esercizi dello stesso tipo con barra di avanzamento, foglio di riscontro e riepilogo.
  // Una scheda per tipo se il Capitolo ne ha più di uno; cambiare scheda fa ripartire la Serie. La Serie non si salva,
  // ma alla fine, con almeno SOGLIA_COMPLETATO giuste, conta per il Capitolo completato (ADR-0011).
  // Con ?seed=s nell'URL l'Esercizio n (da 0) della prima Serie usa il seed s + n: serve ai test.
  // "Riconosci l'intervallo" e "Trova Tonica e Modo" si possono ascoltare (ticket #35), col lettore delle Letture.
  import type { TuneObject } from 'abcjs';
  import { ascoltoIlluminato } from '../../audio/ascolto';
  import { creaLettore } from '../../audio/lettore';
  import { noteDelleChiavi } from '../../audio/note';
  import { genera, valuta, type Esercizio, type Riscontro, type Tipo } from '../../esercizi';
  import type { DichiarazioneEsercizio } from '../../contenuti/schemi';
  import type { Lingua } from '../../i18n';
  import type { Dizionario } from '../../i18n/it';
  import Pentagramma from './Pentagramma.svelte';
  import TastierinoNota from './TastierinoNota.svelte';
  import TastierinoSillaba from './TastierinoSillaba.svelte';
  import TastierinoIntervallo from './TastierinoIntervallo.svelte';
  import TastierinoTonicaEModo from './TastierinoTonicaEModo.svelte';
  import TastierinoScala from './TastierinoScala.svelte';
  import TastierinoFigure from './TastierinoFigure.svelte';
  import SceltaTempo from './SceltaTempo.svelte';
  import Foglio from './Foglio.svelte';
  import { SOGLIA_COMPLETATO } from '../../progressi';
  import { annunciaCambio, progressiDelSito } from '../../progressi/sito';

  interface Props {
    lingua: Lingua;
    t: Dizionario['serie'];
    dichiarazioni: DichiarazioneEsercizio[];
    successivo?: { href: string; etichetta: string };
    /** Il link al capitolo, che col dito sta nella riga dell'avanzamento al posto di quello della pagina. */
    capitolo: { href: string; etichetta: string };
    /** L'id del Capitolo, per i Progressi. */
    idCapitolo: string;
  }
  let { lingua, t, dichiarazioni, successivo, capitolo, idCapitolo }: Props = $props();

  const LUNGHEZZA = 10;
  const seed = new URLSearchParams(window.location.search).get('seed');
  const base = seed !== null && /^\d+$/.test(seed) ? Number(seed) : Math.floor(Math.random() * 2 ** 31);

  let scheda = $state(0);
  /** Quante Serie sono iniziate prima di questa: sposta i seed, così ogni Serie è nuova. */
  let serieIniziate = $state(0);
  let n = $state(0);
  let giuste = $state(0);
  let riscontro = $state<Riscontro | undefined>();
  /** Il rigo mentre il corista risponde, quando la risposta compare sul rigo ("Costruisci la scala"). */
  let bozza = $state<string | undefined>();
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

  /** Alla fine di ogni Serie, una volta sola: ha contato per il Capitolo completato? E il Capitolo ora lo è? */
  let esito = $state<{ conta: boolean; completato: boolean } | undefined>();
  let registrata = -1;
  $effect(() => {
    if (!finita || registrata === serieIniziate) return;
    registrata = serieIniziate;
    const progressi = progressiDelSito();
    const conta = progressi.registraSerie(idCapitolo, dichiarazione.tipo, giuste);
    esito = { conta, completato: progressi.completato(idCapitolo) };
    if (conta) annunciaCambio();
  });

  function nuovaSerie() {
    serieIniziate += 1;
    n = 0;
    giuste = 0;
    riscontro = undefined;
    bozza = undefined;
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
    bozza = undefined;
    n += 1;
  }

  const titoloTipo = (tipo: Tipo) => t.tipi[tipo];

  /** I tipi che si possono ascoltare; le loro dichiarazioni hanno tutte le Chiavi. */
  const DA_ASCOLTARE: Tipo[] = ['riconosci-intervallo', 'trova-tonica-e-modo'];
  const chiaviDaAscoltare = dichiarazioni.flatMap((d) => (DA_ASCOLTARE.includes(d.tipo) && 'chiavi' in d ? d.chiavi : []));
  let suona = $state(false);
  let disegno: TuneObject | undefined;
  const lettore = creaLettore<'esercizio'>({
    campioni: `${import.meta.env.BASE_URL}audio/pianoforte/`,
    note: noteDelleChiavi(chiaviDaAscoltare),
    cambio: (f) => (suona = f !== null),
  });
  function ascolta() {
    if (!disegno) return;
    const a = ascoltoIlluminato(disegno);
    lettore.tocca('esercizio', a.note, a.evidenzia);
  }
  /** Un disegno nuovo (un altro Esercizio, o un'altra larghezza): le note illuminate erano del disegno di prima. */
  function nuovoDisegno(d: TuneObject) {
    lettore.ferma();
    disegno = d;
  }
  $effect(() => () => lettore.chiudi());
</script>

<div class="serie">
  {#if dichiarazioni.length > 1}
    <div class="schede" class:risposto={riscontro} role="tablist" aria-label={t.schede}>
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
      <p class="domanda">{'domanda' in esercizio ? esercizio.domanda[lingua] : t.domande[esercizio.tipo]}</p>
      {#if esercizio.tipo === 'costruisci-la-scala' || esercizio.tipo === 'completa-la-battuta' || esercizio.tipo === 'riconosci-il-tempo' || esercizio.tipo === 'trova-tonica-e-modo'}
        <Pentagramma abc={bozza ?? esercizio.abc} larghezzaMassima={520} scala={esercizio.tipo === 'costruisci-la-scala' ? 1.2 : 1.1} ondisegno={nuovoDisegno} />
      {:else}
        <Pentagramma abc={bozza ?? esercizio.abc} ondisegno={nuovoDisegno} />
      {/if}
      {#if DA_ASCOLTARE.includes(esercizio.tipo)}
        <p class="ascolto"><button type="button" class="ascolta" aria-pressed={suona} onclick={ascolta}>{t.ascolta}</button></p>
      {/if}
    </div>

    <div class="fondo">
      {#if riscontro}
        <Foglio {t} {lingua} {riscontro} onavanti={avanti} />
      {:else}
        {#key `${serieIniziate}-${n}`}
          {#if dichiarazione.tipo === 'nomina-la-sillaba'}
            <TastierinoSillaba {t} cromatiche={dichiarazione.cromatiche} onrisposta={rispondi} />
          {:else if esercizio.tipo === 'completa-la-battuta'}
            <TastierinoFigure {t} tempo={esercizio.tempo} scritte={esercizio.scritte} onbozza={(abc) => (bozza = abc)} onrisposta={rispondi} />
          {:else if esercizio.tipo === 'riconosci-il-tempo'}
            <SceltaTempo {t} scelte={esercizio.scelte} onrisposta={rispondi} />
          {:else if esercizio.tipo === 'costruisci-la-scala'}
            <TastierinoScala {t} tonica={esercizio.tonica} onbozza={(abc) => (bozza = abc)} onrisposta={rispondi} />
          {:else if esercizio.tipo === 'trova-tonica-e-modo'}
            <TastierinoTonicaEModo {t} onrisposta={rispondi} />
          {:else if dichiarazione.tipo === 'riconosci-intervallo' || dichiarazione.tipo === 'rivolta-intervallo'}
            <TastierinoIntervallo {t} onrisposta={rispondi} />
          {:else}
            <TastierinoNota {t} onrisposta={rispondi} />
          {/if}
        {/key}
      {/if}
    </div>
  {:else}
    <section class="riepilogo" aria-labelledby="riepilogo">
      <p id="riepilogo" class="punteggio">{t.riepilogo.replace('{n}', String(giuste))}</p>
      {#if esito}
        <p class="conta" class:si={esito.conta}>
          {esito.conta ? (esito.completato ? t.contaCompletato : t.contaManca) : t.nonConta.replace('{soglia}', String(SOGLIA_COMPLETATO))}
        </p>
      {/if}
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
  .ascolto { display: flex; justify-content: center; margin: 12px 0 0; }
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
    /* Le schede su una riga sola, anche a 320 px: il nome va a capo dentro la scheda, e il pentagramma resta in vista. */
    :global(html[data-serie]) .schede { flex-wrap: nowrap; margin-bottom: 8px; }
    :global(html[data-serie]) .schede button { flex: 1 1 0; padding: 2px 8px; font-size: 0.9rem; line-height: 1.15; }
    /* Come la domanda: durante il riscontro le schede non servono, e il posto va al pentagramma. */
    :global(html[data-serie]) .schede.risposto { display: none; }
    :global(html[data-serie]) .torna {
      display: inline-flex; align-items: center; justify-content: center; min-width: 48px; min-height: 48px;
      margin-left: -12px; font-size: 1.4rem; text-decoration: none;
    }
  }
  .riepilogo { padding: 16px 0; }
  .punteggio { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.3em; }
  .conta { color: var(--muted); }
  .conta.si { color: var(--ok); font-weight: 700; }
  .azioni { display: flex; flex-wrap: wrap; gap: 12px; }
  button.pulsante { border: none; font: inherit; font-weight: 700; cursor: pointer; }
</style>
