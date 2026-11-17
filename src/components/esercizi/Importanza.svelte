<script lang="ts">
  // L'Importanza di un Esercizio pratico (#86, ADR-0012): tre colonnine di altezza crescente, accese fino al grado
  // (1, 2 o 3), e la parola. Scelta dell'utente: icona a barre più "approfondimento / utile / essenziale".
  interface Props {
    grado: 1 | 2 | 3;
    parola: string;
  }
  let { grado, parola }: Props = $props();
</script>

<span class="importanza">
  <svg viewBox="0 0 14 12" width="14" height="12" aria-hidden="true" focusable="false">
    {#each [1, 2, 3] as g (g)}
      <rect x={(g - 1) * 5} y={12 - g * 4} width="4" height={g * 4} rx="0.5" class:accesa={g <= grado} />
    {/each}
  </svg>
  {parola}
</span>

<style>
  .importanza { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 400; color: var(--muted); }
  rect { fill: var(--line); }
  rect.accesa { fill: var(--accent); }
</style>
