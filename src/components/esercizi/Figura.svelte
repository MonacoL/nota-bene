<script lang="ts">
  // Il segno di una Figura per i pulsanti della tavolozza: testa vuota o piena, gambo, coda; il punto a parte.
  // Disegnato a mano in SVG perché il font delle alterazioni ha solo ♭ ♮ ♯. Segue il colore del testo.
  let { figura }: { figura: 'semibreve' | 'minima' | 'semiminima' | 'croma' | 'punto' } = $props();
  const piena = $derived(figura === 'semiminima' || figura === 'croma');
</script>

<svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true" focusable="false">
  {#if figura === 'punto'}
    <circle cx="12" cy="24" r="3.2" fill="currentColor" />
  {:else}
    <ellipse cx="10" cy="25" rx="6" ry="4.2" transform="rotate(-20 10 25)"
      fill={piena ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={piena ? 0 : 2} />
    {#if figura !== 'semibreve'}<line x1="15.4" y1="23.5" x2="15.4" y2="3" stroke="currentColor" stroke-width="1.8" />{/if}
    {#if figura === 'croma'}<path d="M15.4 3 C 17 9, 22 10, 20.5 17 C 20 12, 17.5 11, 15.4 10 Z" fill="currentColor" />{/if}
  {/if}
</svg>
