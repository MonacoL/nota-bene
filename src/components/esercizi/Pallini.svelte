<script lang="ts">
  // La battuta come fila di pallini (#86, "I pallini"): un gruppo per pulsazione, il pallino grande è la pulsazione
  // e anche la sua prima suddivisione, i piccoli sono le altre suddivisioni. Mentre suona il brano si accende il
  // pallino della suddivisione in corso, come nelle app di metronomo.
  import { metrica, type Brano } from '../../esercizi';

  interface Props {
    brano: Brano;
    /** L'indice della suddivisione che suona, dall'inizio del brano; -1 quando non suona niente. */
    attiva: number;
  }
  let { brano, attiva }: Props = $props();

  const m = $derived(metrica(brano.indicazione));
  const perPulsazione = $derived(m.perPulsazione);
  const perBattuta = $derived(m.pulsazioni * perPulsazione);
  const accesa = $derived(attiva < 0 ? -1 : attiva % perBattuta);
</script>

<div class="pallini" aria-hidden="true">
  {#each { length: m.pulsazioni } as _, p (p)}
    <span class="gruppo">
      {#each { length: perPulsazione } as _, s (s)}
        {@const i = p * perPulsazione + s}
        <span class="pallino" class:grande={s === 0} class:acceso={i === accesa}></span>
      {/each}
    </span>
  {/each}
</div>

<style>
  /* Fino a 12 pallini (12/8) in 320 px: gruppi stretti, e lo spazio vero sta fra un gruppo e l'altro. */
  .pallini { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 14px; margin: 12px 0; min-height: 28px; }
  .gruppo { display: inline-flex; align-items: center; gap: 5px; }
  .pallino { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--line); }
  .pallino.grande { width: 24px; height: 24px; }
  .pallino.acceso { background: var(--accent); }
</style>
