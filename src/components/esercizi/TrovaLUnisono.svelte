<script lang="ts">
  // "Trova l'unisono" (#90, ADR-0012): il sito tiene una nota con l'organo e il corista ci arriva con la voce da poco
  // sopra e da poco sotto, finché i battimenti spariscono. Si ascolta e si giudica da soli: niente microfono e niente
  // risposta giusta, quindi non conta per il Capitolo completato. La Voce si sceglie qui e non si salva: la Voce del
  // corista salvata con i Progressi arriva con #89.
  import { esempioUnisono } from '../../audio/battimenti';
  import { creaLettore } from '../../audio/lettore';
  import { frequenza, nomeNota, noteNaturali, NOMI_VOCI, VOCI, type Voce } from '../../audio/voci';
  import { casuale } from '../../esercizi';
  import type { Lingua } from '../../i18n';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    lingua: Lingua;
    seed: number;
  }
  let { t, lingua, seed }: Props = $props();

  let voce = $state<Voce | undefined>();
  let nota = $state(0);
  let volume = $state(0.6);
  let suona = $state<'tieni' | 'esempio' | null>(null);
  let giro = 0;

  const lettore = creaLettore<'tieni' | 'esempio'>({
    campioni: `${import.meta.env.BASE_URL}audio/pianoforte/`,
    note: [],
    cambio: (f) => (suona = f),
  });
  $effect(() => () => lettore.chiudi());
  $effect(() => lettore.volume(volume));

  function scegliVoce(v: Voce) {
    lettore.ferma();
    voce = v;
    nota = VOCI[v].base;
  }

  /** Un'altra nota naturale della Voce, diversa da quella di adesso. */
  function altraNota() {
    const note = noteNaturali(voce!).filter((m) => m !== nota);
    nota = casuale(seed + ++giro).scegli(note);
    if (suona === 'tieni') lettore.toccaTenuti('tieni', [{ inizio: 0, fine: Infinity, punti: [[0, frequenza(nota)]] }]);
    else lettore.ferma();
  }
</script>

<section class="unisono" aria-label={t.tipi['trova-l-unisono']}>
  <p class="spiegazione">{t.unisono.spiegazione}</p>

  <div class="voci" role="group" aria-label={t.unisono.voce}>
    <span class="etichetta">{t.unisono.voce}</span>
    {#each NOMI_VOCI as v (v)}
      <button type="button" aria-pressed={voce === v} onclick={() => scegliVoce(v)}>{t.unisono.voci[v]}</button>
    {/each}
  </div>

  {#if voce}
    <p class="nota">{t.unisono.nota.replace('{nota}', nomeNota(nota, lingua))}</p>
    <div class="azioni">
      <button
        type="button"
        class="tieni"
        aria-pressed={suona === 'tieni'}
        onclick={() => lettore.toccaTenuti('tieni', [{ inizio: 0, fine: Infinity, punti: [[0, frequenza(nota)]] }])}
        >{suona === 'tieni' ? t.unisono.ferma : t.unisono.tieni}</button
      >
      <button type="button" class="ascolta" aria-pressed={suona === 'esempio'} onclick={() => lettore.toccaTenuti('esempio', esempioUnisono(frequenza(nota)))}
        >{t.unisono.esempio}</button
      >
      <button type="button" onclick={altraNota}>{t.unisono.altra}</button>
    </div>
    <label class="volume">
      {t.unisono.volume}
      <input type="range" min="0" max="1" step="0.05" bind:value={volume} />
    </label>
    <ol class="passi">
      {#each t.unisono.passi as passo (passo)}<li>{passo}</li>{/each}
    </ol>
  {/if}
</section>

<style>
  .unisono { display: grid; gap: 12px; }
  .spiegazione { margin: 0; color: var(--muted); }
  .voci, .azioni { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .etichetta { width: 100%; font-weight: 700; }
  button {
    min-height: 48px; padding: 0 16px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--surface);
    color: var(--ink); font: inherit; cursor: pointer;
  }
  .voci button[aria-pressed='true'] { border-color: var(--accent); color: var(--accent); font-weight: 700; }
  .tieni { border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700; }
  .nota { margin: 0; font-size: 1.2rem; font-weight: 700; }
  .volume { display: flex; align-items: center; gap: 12px; }
  .volume input { flex: 1; max-width: 240px; min-height: 48px; accent-color: var(--accent); }
  .passi { margin: 0; padding-left: 1.4em; }
</style>
