<script lang="ts">
  // Foglio di riscontro: esito, risposta data e giusta, spiegazione (anche se giusta), "Avanti →".
  // Dopo un errore la soluzione compare subito: niente "Riprova".
  import type { Riscontro } from '../../esercizi';
  import type { Lingua } from '../../i18n';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    lingua: Lingua;
    riscontro: Riscontro;
    onavanti: () => void;
  }
  let { t, lingua, riscontro, onavanti }: Props = $props();

  let avanti: HTMLButtonElement;
  $effect(() => avanti.focus());
</script>

<section class="foglio {riscontro.esito}" aria-label={t.riscontro} aria-live="polite">
  <p class="esito">
    {riscontro.esito === 'giusto' ? t.giusto : t.sbagliato}
    {#if riscontro.esito === 'giusto'}<span class="nome">{riscontro.giusta[lingua]}</span>{/if}
  </p>
  {#if riscontro.esito === 'sbagliato'}
    <dl class="risposte">
      <div><dt>{t.tuaRisposta}</dt><dd>{riscontro.data[lingua]}</dd></div>
      <div><dt>{t.rispostaGiusta}</dt><dd>{riscontro.giusta[lingua]}</dd></div>
    </dl>
  {/if}
  <p class="spiegazione">{riscontro.spiegazione[lingua]}</p>
  <button type="button" bind:this={avanti} onclick={onavanti}>{t.avanti}</button>
</section>

<style>
  .foglio { padding: 14px 16px 16px; border-radius: var(--radius); border-left: 6px solid; }
  .giusto { background: var(--ok-bg); border-color: var(--ok); }
  .sbagliato { background: var(--ko-bg); border-color: var(--ko); }
  .esito { margin: 0 0 6px; font-size: 1.2rem; font-weight: 700; }
  .giusto .esito { color: var(--ok); }
  .sbagliato .esito { color: var(--ko); }
  .nome { margin-left: 8px; color: var(--ink); }
  .risposte { margin: 0 0 8px; display: flex; flex-wrap: wrap; gap: 4px 24px; }
  .risposte div { display: flex; gap: 6px; }
  .risposte dt { color: var(--muted); }
  .risposte dt::after { content: ':'; }
  .risposte dd { margin: 0; font-weight: 700; }
  .spiegazione { margin: 0 0 12px; }
  button {
    width: 100%; min-height: 48px; border: none; border-radius: var(--radius);
    background: var(--accent); color: var(--accent-ink); font: inherit; font-weight: 700; cursor: pointer;
  }
</style>
