<script lang="ts">
  // La Lettura (ticket "Schermata della Lettura su telefono", #8): i quattro comandi, la partitura con Testo e
  // Soluzione, e sotto la Tonalità con le Mutazioni. Su telefono i comandi sono una barra fissa in basso,
  // su desktop una fila sopra la partitura. Riferimento tonale e Ascolto di verifica (ticket #31) li suona
  // src/audio/lettore.ts; qui ci sono solo i pulsanti e le note da illuminare. Lettura successiva è un link
  // (ticket #32) che tiene il filtro ?voce= con cui si è arrivati.
  // La riga delle Sillabe si disegna sempre e il CSS la nasconde: mostrare la Soluzione non sposta niente.
  import { renderAbc, type TuneObject } from 'abcjs';
  import { ascoltoIlluminato } from '../../audio/ascolto';
  import { creaLettore, type Funzione } from '../../audio/lettore';
  import { noteDelRiferimento, type AudioDellaLettura } from '../../audio/note';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    /** L'ABC della Lettura con la riga w: della Soluzione dopo il Testo (src/letture/soluzione.ts). */
    abc: string;
    /** Quante righe w: di Testo ci sono prima di quella della Soluzione. */
    righeTesto: number;
    /** Le frasi su Tonalità e Mutazioni, già nella lingua della pagina. */
    spiegazione: string[];
    /** L'indirizzo della Lettura successiva per ogni filtro ?voce=; la chiave vuota è "nessun filtro". */
    successive: Record<string, string>;
    /** Il Riferimento tonale e le note di cui caricare i campioni, calcolati alla build (src/audio/note.ts). */
    audio: AudioDellaLettura;
    t: Dizionario['lettura'];
  }
  let { abc, righeTesto, spiegazione, successive, audio, t }: Props = $props();

  // Il componente gira solo nel browser (client:only), quindi l'indirizzo si legge subito.
  const voce = new URLSearchParams(window.location.search).get('voce') ?? '';
  const successiva = voce && voce in successive ? `${successive[voce]}?voce=${voce}` : successive['']!;

  // Testo e Sillabe a circa 16 px (ADR-0009): 15 pt in abcjs sono 20 px, per la scala 0,8.
  const SCALA = 0.8;
  const intestazione = '%%vocalfont "Atkinson Hyperlegible Next" 15\n';

  let soluzione = $state(false);
  let partitura: HTMLDivElement;
  let lettura: HTMLDivElement;
  let disegnata: TuneObject | undefined;

  let suona = $state<Funzione | null>(null);
  const lettore = creaLettore({
    campioni: `${import.meta.env.BASE_URL}audio/pianoforte/`,
    note: audio.note,
    cambio: (f) => (suona = f),
  });
  const riferimento = () => lettore.tocca('riferimento', () => noteDelRiferimento(audio.riferimento));
  function ascolto() {
    const a = ascoltoIlluminato(disegnata!, lettura.querySelector('.comandi')!);
    lettore.tocca('ascolto', a.note, a.evidenzia);
  }

  function disegna() {
    // Si misura il contenitore e non la partitura: abcjs dà al div in cui disegna la larghezza dell'SVG.
    const larghezza = Math.floor(lettura.clientWidth);
    if (!larghezza || partitura.dataset.larghezza === String(larghezza)) return;
    partitura.dataset.larghezza = String(larghezza);
    // Le note illuminate dell'Ascolto appartengono al disegno di prima.
    if (lettore.inCorso() === 'ascolto') lettore.ferma();
    [disegnata] = renderAbc(partitura, abc.replace(/^(X:.*\n)/, `$1${intestazione}`), {
      add_classes: true,
      scale: SCALA,
      // In abcjs 6.7.2 staffwidth è già in px di uscita: scale rimpicciolisce solo i simboli (prototipo #8).
      staffwidth: larghezza,
      paddingleft: 0,
      paddingright: 0,
      paddingtop: 0,
      paddingbottom: 0,
      wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 4 },
    });
    // abcjs mette le righe w: della stessa nota in un <text>, un <tspan> per riga, anche vuoto: la Sillaba è
    // il tspan dopo quelli del Testo. Le note legate hanno lì solo uno spazio e restano senza marca.
    for (const nota of partitura.querySelectorAll('.abcjs-lyric')) {
      const sillaba = nota.querySelectorAll('tspan')[righeTesto];
      if (sillaba?.textContent?.trim()) sillaba.classList.add('sillaba');
    }
  }

  $effect(() => {
    disegna();
    const osservatore = new ResizeObserver(disegna);
    osservatore.observe(lettura);
    return () => osservatore.disconnect();
  });
  $effect(() => () => lettore.chiudi());
</script>

<div class="lettura" class:soluzione bind:this={lettura}>
  <nav class="comandi" aria-label={t.comandi}>
    <button type="button" aria-pressed={suona === 'riferimento'} onclick={riferimento} aria-label={t.riferimento}>
      <span class="breve">{t.riferimentoBreve}</span><span class="lungo">{t.riferimento}</span>
    </button>
    <button type="button" aria-pressed={suona === 'ascolto'} onclick={ascolto} aria-label={t.ascolto}>
      <span class="breve">{t.ascoltoBreve}</span><span class="lungo">{t.ascolto}</span>
    </button>
    <button type="button" class="mostra" aria-pressed={soluzione} onclick={() => (soluzione = !soluzione)}
      aria-label={soluzione ? t.nascondiSoluzione : t.mostraSoluzione}>
      <span class="breve">{t.soluzioneBreve}</span><span class="lungo">{soluzione ? t.nascondiSoluzione : t.mostraSoluzione}</span>
    </button>
    <a class="comando" href={successiva} aria-label={t.successiva}>
      <span class="breve">{t.successivaBreve}</span><span class="lungo">{t.successiva}</span>
    </a>
  </nav>

  <div class="partitura" role="img" aria-label={t.partitura} bind:this={partitura}></div>

  <div class="spiegazione" aria-hidden={!soluzione}>
    {#each spiegazione as frase}<p>{frase}</p>{/each}
  </div>
</div>

<style>
  .partitura { color: var(--ink); margin: 16px 0 8px; min-height: 120px; }
  /* Niente max-width sull'SVG: abcjs lo disegna largo staffwidth / scale e lo rimpicciolisce con un transform. */
  .partitura :global(svg) { display: block; }
  .partitura :global(.sillaba) { fill: var(--sol); font-weight: 700; }
  .lettura:not(.soluzione) .partitura :global(.sillaba) { visibility: hidden; }
  /* La nota dell'Ascolto di verifica che suona, con le sue sillabe (ADR-0009): la Soluzione resta nascosta. */
  .partitura :global(.suona), .partitura :global(.suona .sillaba) { fill: var(--suona); }

  .spiegazione { color: var(--sol); }
  .spiegazione p { margin: 0.2em 0; }
  .lettura:not(.soluzione) .spiegazione { visibility: hidden; }

  .comandi { display: flex; gap: 8px; flex-wrap: wrap; }
  .comandi button, .comandi .comando {
    display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
    min-height: 48px; padding: 0 16px; border-radius: var(--radius);
    font: inherit; font-weight: 700; cursor: pointer;
    background: transparent; color: var(--accent); border: 2px solid var(--accent);
  }
  .comandi button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
  .comandi button:disabled { color: var(--muted); border-color: var(--line); cursor: not-allowed; }
  .breve { display: none; }

  /* Su telefono la barra fissa in basso, sotto il pollice; la pagina lascia lo spazio per non coprire niente. */
  @media (max-width: 719px) {
    .comandi {
      position: fixed; z-index: 10; left: 0; right: 0; bottom: 0;
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
      padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
      background: var(--surface); border-top: 1px solid var(--line);
    }
    .comandi button, .comandi .comando { min-height: 52px; padding: 0 4px; font-size: 0.82rem; border-width: 1px; }
    .breve { display: inline; }
    .lungo { display: none; }
    :global(body) { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
  }
</style>
