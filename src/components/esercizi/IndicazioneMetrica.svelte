<script lang="ts">
  // L'Indicazione metrica da riconoscere (#85): i due numeri uno sopra l'altro, come all'inizio di un rigo, senza
  // linea in mezzo, perché non è una frazione.
  let { indicazione }: { indicazione: string } = $props();
  const [sopra, sotto] = $derived(indicazione.split('/'));
</script>

<p class="indicazione" aria-label={indicazione}>
  <span aria-hidden="true">{sopra}</span>
  <span aria-hidden="true">{sotto}</span>
</p>

<style>
  .indicazione {
    display: flex; flex-direction: column; align-items: center; margin: 8px 0;
    font-size: 3.2rem; font-weight: 700; line-height: 0.95; font-variant-numeric: lining-nums;
  }
</style>
