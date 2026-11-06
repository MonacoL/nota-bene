import { it, type Dizionario } from './it';
import { en } from './en';

export const LINGUE = ['it', 'en'] as const;
export type Lingua = (typeof LINGUE)[number];

const DIZIONARI: Record<Lingua, Dizionario> = { it, en };

export function testi(lingua: Lingua): Dizionario {
  return DIZIONARI[lingua];
}

export function altraLingua(lingua: Lingua): Lingua {
  return lingua === 'it' ? 'en' : 'it';
}

const BASE = import.meta.env.BASE_URL; // "/nota-bene/", da astro.config.mjs

/** URL di un percorso del sito in una lingua: url('it', 'privacy/') → "/nota-bene/it/privacy/". */
export function url(lingua: Lingua, percorso = ''): string {
  return `${BASE}${lingua}/${percorso}`;
}

/** Lo stesso URL nell'altra lingua: cambia solo il prefisso, il resto del percorso è identico (ADR-0006). */
export function urlInAltraLingua(pathname: string, lingua: Lingua): string {
  const prefisso = `${BASE}${lingua}/`;
  const resto = pathname.startsWith(prefisso) ? pathname.slice(prefisso.length) : '';
  return url(altraLingua(lingua), resto);
}

export function isLingua(valore: string | undefined): valore is Lingua {
  return (LINGUE as readonly string[]).includes(valore ?? '');
}
