// Esercizio "Nomina la sillaba" (Capitoli 9 e 10): un'Armatura e una nota; si risponde con la Sillaba, a un tocco.
// L'ABC si legge con il parser di abcjs, indipendente dal modulo: Armatura e alterazione scritta danno la Nota.
import abcjs from 'abcjs';
import { describe, expect, it } from 'vitest';
import { genera, valuta, type EsercizioNominaLaSillaba, type Nota } from '../../src/esercizi';

const LETTERE = 'CDEFGAB';
const SEED = Array.from({ length: 300 }, (_, i) => i * 7919 + 3);
const CROMATICHE = ['DI', 'RI', 'FI', 'SI', 'LI', 'RA', 'ME', 'SE', 'LE', 'TE'];
const TUTTE = ['violino', 'violino-ottava-bassa', 'basso'] as const;

/** Clef, numero di alterazioni in chiave e Nota scritta (con l'Armatura applicata), come le legge abcjs. */
function letto(abc: string) {
  const [brano] = abcjs.parseOnly(abc);
  expect(brano!.warnings ?? []).toEqual([]);
  const rigo = brano!.lines[0]!.staff![0]!;
  const note = rigo.voices![0]!.filter((e) => e.el_type === 'note');
  expect(note).toHaveLength(1);
  const p = note[0]!.pitches![0]!;
  const grado = 28 + p.pitch;
  const lettera = LETTERE[((grado % 7) + 7) % 7] as Nota['lettera'];
  const inChiave = (rigo.key?.accidentals ?? []).find((a) => a.note.toUpperCase() === lettera);
  const segno = { sharp: 1, flat: -1, natural: 0 } as Record<string, -1 | 0 | 1>;
  const alterazione = p.accidental ? segno[p.accidental]! : inChiave ? segno[inChiave.acc]! : 0;
  return { clef: rigo.clef!.type, armatura: rigo.key?.accidentals?.length ?? 0, scritta: { lettera, alterazione, ottava: Math.floor(grado / 7) } };
}

describe('Nomina la sillaba: genera', () => {
  it('scrive una nota con Armatura e Chiave; la Nota reale è quella scritta, un\'ottava sotto in violino ottava bassa', () => {
    const clef = { violino: 'treble', 'violino-ottava-bassa': 'treble-8', basso: 'bass' } as const;
    const chiavi = new Set<string>();
    for (const seed of SEED) {
      const es = genera('nomina-la-sillaba', { chiavi: [...TUTTE], cromatiche: false }, seed);
      chiavi.add(es.chiave);
      const l = letto(es.abc);
      expect(l.clef).toBe(clef[es.chiave]);
      const ottavaSopra = es.chiave === 'violino-ottava-bassa' ? 1 : 0;
      expect(l.scritta).toEqual({ ...es.nota, ottava: es.nota.ottava + ottavaSopra });
    }
    expect(chiavi.size).toBe(3);
  });

  it('nel Capitolo 9 solo Sillabe DO…TI e Armature fino a 3 alterazioni, tutte usate', () => {
    const sillabe = new Set<string>();
    const armature = new Set<number>();
    for (const seed of SEED) {
      const es = genera('nomina-la-sillaba', { chiavi: ['violino'], cromatiche: false }, seed);
      sillabe.add(es.sillaba);
      armature.add(letto(es.abc).armatura);
    }
    expect([...sillabe].sort()).toEqual(['DO', 'FA', 'LA', 'MI', 'RE', 'SOL', 'TI']);
    expect([...armature].sort()).toEqual([0, 1, 2, 3]);
  });

  it('nel Capitolo 10 anche le Sillabe cromatiche, salendo e scendendo, e Armature fino a 4', () => {
    const sillabe = new Set<string>();
    const armature = new Set<number>();
    for (const seed of SEED) {
      const es = genera('nomina-la-sillaba', { chiavi: ['violino'], cromatiche: true }, seed);
      sillabe.add(es.sillaba);
      armature.add(letto(es.abc).armatura);
      expect(Math.abs(es.nota.alterazione)).toBeLessThanOrEqual(1);
    }
    for (const c of CROMATICHE) expect(sillabe).toContain(c);
    expect(sillabe).toContain('DO');
    expect(Math.max(...armature)).toBe(4);
  });
});

const es = (quinte: number, nota: Nota, sillaba: EsercizioNominaLaSillaba['sillaba']): EsercizioNominaLaSillaba =>
  ({ tipo: 'nomina-la-sillaba', chiave: 'violino', quinte, nota, sillaba, abc: '' });
const n = (s: string): Nota => ({
  lettera: s[0] as Nota['lettera'],
  alterazione: s.includes('#') ? 1 : s.includes('b') ? -1 : 0,
  ottava: Number(s.at(-1)),
});

describe('Nomina la sillaba: valuta', () => {
  it('la Sillaba giusta è giusta; la spiegazione trova il DO dall\'Armatura e conta il grado', () => {
    const r = valuta(es(2, n('F#4'), 'MI'), { sillaba: 'MI' });
    expect(r.esito).toBe('giusto');
    expect(r.data).toEqual({ it: 'MI', en: 'MI' });
    expect(r.giusta).toEqual({ it: 'MI', en: 'MI' });
    expect(r.spiegazione.it).toBe("L'armatura con 2 diesis è di Re maggiore e di Si minore: in tutte e due il DO è il Re. Il Fa♯ è il 3° grado: MI.");
    expect(r.spiegazione.en).toBe('The key signature with 2 sharps belongs to D major and B minor: in both, DO is D. F♯ is the 3rd degree: MI.');
  });

  it('senza alterazioni in chiave il DO è il Do; con 1 bemolle è il Fa', () => {
    expect(valuta(es(0, n('A4'), 'LA'), { sillaba: 'LA' }).spiegazione.it).toContain('Senza alterazioni in chiave è Do maggiore o La minore: il DO è il Do.');
    expect(valuta(es(0, n('A4'), 'LA'), { sillaba: 'LA' }).spiegazione.en).toContain('With no sharps or flats it is C major or A minor: DO is C.');
    expect(valuta(es(-1, n('A4'), 'MI'), { sillaba: 'MI' }).spiegazione.it).toContain("L'armatura con 1 bemolle è di Fa maggiore e di Re minore");
    expect(valuta(es(-3, n('C5'), 'LA'), { sillaba: 'LA' }).spiegazione.it).toContain("L'armatura con 3 bemolle è di Mi♭ maggiore e di Do minore: in tutte e due il DO è il Mi♭.");
  });

  it('la Sillaba sbagliata è sbagliata, e dice qual è quella giusta', () => {
    const r = valuta(es(2, n('F#4'), 'MI'), { sillaba: 'RE' });
    expect(r.esito).toBe('sbagliato');
    expect(r.data).toEqual({ it: 'RE', en: 'RE' });
    expect(r.giusta).toEqual({ it: 'MI', en: 'MI' });
  });

  it('chi risponde col nome fisso della nota sbaglia, e la spiegazione lo dice', () => {
    const r = valuta(es(1, n('D4'), 'SOL'), { sillaba: 'RE' });
    expect(r.esito).toBe('sbagliato');
    expect(r.spiegazione.it).toContain('RE è il nome fisso della nota: nel DO mobile si conta dal DO, che qui è il Sol.');
    expect(r.spiegazione.en).toContain('RE is the fixed name of the note: in movable do you count from DO, which here is G.');
    // Se il nome fisso è proprio la Sillaba giusta, non c'è niente da dire.
    expect(valuta(es(0, n('D4'), 'RE'), { sillaba: 'RE' }).spiegazione.it).not.toContain('nome fisso');
  });

  it('le Sillabe cromatiche: la spiegazione dice che la nota è fuori dall\'Armatura, alzata o abbassata', () => {
    const di = valuta(es(0, n('C#4'), 'DI'), { sillaba: 'DI' });
    expect(di.esito).toBe('giusto');
    expect(di.spiegazione.it).toContain("Il Do♯ non è nell'armatura: è il DO alzato di un semitono, e diventa DI.");
    expect(di.spiegazione.en).toContain('C♯ is not in the key signature: it is DO raised by a half step, so it becomes DI.');
    const te = valuta(es(0, n('Bb4'), 'TE'), { sillaba: 'TE' });
    expect(te.spiegazione.it).toContain("Il Si♭ non è nell'armatura: è il TI abbassato di un semitono, e diventa TE.");
    expect(te.spiegazione.en).toContain('B♭ is not in the key signature: it is TI lowered by a half step, so it becomes TE.');
  });

  it('una nota che il bequadro toglie dall\'Armatura si chiama col ♮', () => {
    const r = valuta(es(-4, n('D4'), 'FI'), { sillaba: 'FI' });
    expect(r.spiegazione.it).toContain("Il Re♮ non è nell'armatura: è il FA alzato di un semitono, e diventa FI.");
    expect(r.spiegazione.en).toContain('D♮ is not in the key signature: it is FA raised by a half step, so it becomes FI.');
  });

  it('il SI ricorda la sensibile della minore armonica', () => {
    const r = valuta(es(0, n('G#4'), 'SI'), { sillaba: 'SI' });
    expect(r.spiegazione.it).toContain('In La minore è la sensibile della scala minore armonica.');
    expect(r.spiegazione.en).toContain('In A minor it is the leading tone of the harmonic minor scale.');
  });

  it('per ogni seed la Sillaba dell\'Esercizio è giusta e ha una spiegazione nelle due lingue', () => {
    for (const seed of SEED) {
      const e = genera('nomina-la-sillaba', { chiavi: [...TUTTE], cromatiche: true }, seed);
      const r = valuta(e, { sillaba: e.sillaba });
      expect(r.esito).toBe('giusto');
      expect(r.spiegazione.it.length).toBeGreaterThan(40);
      expect(r.spiegazione.en.length).toBeGreaterThan(40);
    }
  });
});
