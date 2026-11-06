<script lang="ts">
  // Risposta di "Nomina la sillaba": un tocco su una Sillaba, senza Verifica (ticket "Interazione negli Esercizi di teoria da telefono").
  // Nel Capitolo 10 anche le Sillabe cromatiche: una riga per chi sale (DI…LI) e una per chi scende (RA…TE).
  // Le Sillabe non si traducono (GLOSSARY.md).
  import type { Sillaba } from '../../esercizi';
  import type { Dizionario } from '../../i18n/it';

  interface Props {
    t: Dizionario['serie'];
    cromatiche: boolean;
    onrisposta: (risposta: { sillaba: Sillaba }) => void;
  }
  let { t, cromatiche, onrisposta }: Props = $props();

  const RIGHE: Sillaba[][] = [
    ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'],
    ['DI', 'RI', 'FI', 'SI', 'LI'],
    ['RA', 'ME', 'SE', 'LE', 'TE'],
  ];
  const righe = $derived(cromatiche ? RIGHE : RIGHE.slice(0, 1));
</script>

<div class="tastierino" role="group" aria-label={t.risposta}>
  {#each righe as riga, i (i)}
    <div class="riga" style:--colonne={riga.length}>
      {#each riga as sillaba (sillaba)}
        <button type="button" onclick={() => onrisposta({ sillaba })}>{sillaba}</button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .tastierino { display: grid; gap: 8px; }
  .riga { display: grid; gap: 6px; grid-template-columns: repeat(var(--colonne), 1fr); }
  button {
    min-height: 48px; min-width: 0; padding: 0 2px; border-radius: var(--radius);
    border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    font: inherit; font-size: 1.05rem; font-weight: 700; cursor: pointer;
  }
  @media (max-width: 359px) { button { font-size: 0.9rem; } }
</style>
