<script lang="ts">
  // Cambio di lingua "IT / EN". Il link all'altra lingua è già giusto nell'HTML statico;
  // nel browser si aggiunge la query string (per esempio il filtro ?voce=), così si resta sulla stessa vista.
  import { onMount } from 'svelte';

  interface Props {
    lingua: 'it' | 'en';
    href: string;
    etichetta: string;
    nomeAltraLingua: string;
  }
  let { lingua, href, etichetta, nomeAltraLingua }: Props = $props();

  let destinazione = $state(href);
  onMount(() => {
    destinazione = href + window.location.search + window.location.hash;
  });
</script>

<nav class="lingua" aria-label={etichetta}>
  {#if lingua === 'it'}
    <span aria-current="true">IT</span> / <a href={destinazione} hreflang="en" lang="en" title={nomeAltraLingua}>EN</a>
  {:else}
    <a href={destinazione} hreflang="it" lang="it" title={nomeAltraLingua}>IT</a> / <span aria-current="true">EN</span>
  {/if}
</nav>

<style>
  .lingua { font-size: 0.95rem; color: var(--muted); white-space: nowrap; }
  .lingua span { color: var(--ink); font-weight: 700; padding: 0 6px; }
  /* Area di tocco alta 48 px senza allargare l'intestazione, che a 320 px è al limite. */
  .lingua a { display: inline-flex; align-items: center; min-height: 48px; padding: 0 6px; color: var(--muted); }
</style>
