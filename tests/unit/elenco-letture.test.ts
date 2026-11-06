// Elenco delle Letture e Lettura successiva (ticket #32, decisioni nel #16): due blocchi, filtro per Voce,
// ordine per Brano, poi Voce, poi Battuta di inizio; le Letture ritirate non si elencano.
import { describe, expect, it } from 'vitest';
import type { Lettura, Voce } from '../../src/letture/catalogo';
import { elenco, successiva } from '../../src/letture/elenco';

/** Una Lettura con i soli campi che contano per l'elenco. */
function lettura(brano: string, voce: Voce, inizio: number, altro: Partial<Lettura> = {}): Lettura {
  const cartella = brano.toLowerCase().replaceAll(' ', '-');
  return {
    id: `${cartella}/${voce}-${inizio}-${inizio + 7}`,
    brano,
    voce,
    battute: { inizio, fine: inizio + 7 },
    blocco: 'normale',
    stato: 'pubblicata',
    ...altro,
  } as Lettura;
}

const ids = (letture: Lettura[]) => letture.map((l) => l.id);

describe('elenco', () => {
  it('ordina per Brano, poi Voce nell\'ordine soprano-contralto-tenore-basso, poi Battuta di inizio', () => {
    const letture = [
      lettura('Zadok', 'soprano', 1),
      lettura('Ave verum', 'basso', 1),
      lettura('Ave verum', 'soprano', 9),
      lettura('Ave verum', 'contralto', 1),
      lettura('Ave verum', 'soprano', 1),
    ];
    expect(ids(elenco(letture).normale)).toEqual([
      'ave-verum/soprano-1-8',
      'ave-verum/soprano-9-16',
      'ave-verum/contralto-1-8',
      'ave-verum/basso-1-8',
      'zadok/soprano-1-8',
    ]);
  });

  it('mette le Letture avanzate nel secondo blocco', () => {
    const letture = [lettura('Ave verum', 'soprano', 1, { blocco: 'avanzata' }), lettura('Zadok', 'soprano', 1)];
    const { normale, avanzata } = elenco(letture);
    expect(ids(normale)).toEqual(['zadok/soprano-1-8']);
    expect(ids(avanzata)).toEqual(['ave-verum/soprano-1-8']);
  });

  it('con il filtro tiene solo la Voce scelta', () => {
    const letture = [lettura('Ave verum', 'soprano', 1), lettura('Ave verum', 'tenore', 1), lettura('Zadok', 'tenore', 1)];
    expect(ids(elenco(letture, 'tenore').normale)).toEqual(['ave-verum/tenore-1-8', 'zadok/tenore-1-8']);
  });

  it('non elenca le Letture ritirate', () => {
    const letture = [lettura('Ave verum', 'soprano', 1, { stato: 'ritirata' }), lettura('Zadok', 'soprano', 1)];
    expect(ids(elenco(letture).normale)).toEqual(['zadok/soprano-1-8']);
  });
});

describe('successiva', () => {
  const letture = [
    lettura('Ave verum', 'soprano', 1),
    lettura('Ave verum', 'tenore', 1),
    lettura('Ave verum', 'basso', 1, { blocco: 'avanzata' }),
    lettura('Zadok', 'soprano', 1),
    lettura('Zadok', 'tenore', 1, { stato: 'ritirata' }),
  ];

  it('porta alla seguente dello stesso blocco, saltando le ritirate', () => {
    expect(successiva(letture, 'ave-verum/tenore-1-8')?.id).toBe('zadok/soprano-1-8');
  });

  it("dopo l'ultima ricomincia dalla prima del blocco", () => {
    expect(successiva(letture, 'zadok/soprano-1-8')?.id).toBe('ave-verum/soprano-1-8');
  });

  it('resta nel blocco delle avanzate, anche con una sola Lettura', () => {
    expect(successiva(letture, 'ave-verum/basso-1-8')?.id).toBe('ave-verum/basso-1-8');
  });

  it('con il filtro scorre solo la Voce scelta', () => {
    expect(successiva(letture, 'ave-verum/soprano-1-8', 'soprano')?.id).toBe('zadok/soprano-1-8');
    expect(successiva(letture, 'zadok/soprano-1-8', 'soprano')?.id).toBe('ave-verum/soprano-1-8');
  });

  it("con un filtro su un'altra Voce va alla prima di quella Voce che viene dopo", () => {
    expect(successiva(letture, 'ave-verum/soprano-1-8', 'tenore')?.id).toBe('ave-verum/tenore-1-8');
  });

  it('senza Letture della Voce scelta nel blocco non porta da nessuna parte', () => {
    expect(successiva(letture, 'ave-verum/tenore-1-8', 'basso')).toBeUndefined();
  });
});
