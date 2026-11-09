export const FPS = 24;
export const N = 1073;
export const sec = (t: number) => Math.round(t * FPS);
export const LIME = '#97d131';
export const LIME_D = '#5a7d16';
export const INK = '#12161c';
export const TXT = '#f2f4f0';
export const GRAY = '#aab1bd';

const syl = (w: string) => Math.max(1, (w.toLowerCase().replace(/[*.,]/g, '').match(/[aeiouáéíóúü]+/g) || ['a']).length);
export type Word = {t: string; imp: boolean; f: number};
export type Chunk = {words: Word[]; glitch?: boolean; f0: number; f1: number};
export type Phrase = {id: string; t0: number; t1: number; chunks: Chunk[]};

const build = (id: string, t0: number, t1: number, ch: string[][], glitchFirst = false): Phrase => {
  const all = ch.flat();
  const wts = all.map((w) => syl(w) + (/[,.]$|\*[,.]$/.test(w) ? 0.7 : 0));
  const tot = wts.reduce((a, b) => a + b, 0);
  let acc = 0;
  const times = all.map((_, i) => { const s = t0 + ((t1 - t0) * acc) / tot; acc += wts[i]; return s; });
  let k = 0;
  const chunks: Chunk[] = ch.map((c, ci) => {
    const words = c.map((w) => {
      const imp = w.includes('*');
      const word = {t: w.replace(/\*/g, ''), imp, f: sec(times[k])};
      k++; return word;
    });
    return {words, glitch: glitchFirst && ci === 0, f0: words[0].f, f1: 0};
  });
  chunks.forEach((c, i) => { c.f1 = (i < chunks.length - 1 ? chunks[i + 1].f0 : sec(t1) + 4); });
  return {id, t0, t1, chunks};
};

export const PHRASES: Phrase[] = [
  build('v1', 0.0, 3.5, [['Así', 'pasas', 'de'], ['entrenar', 'sin', '*plan*'], ['a', 'entrenar', 'con', '*rumbo*']]),
  build('v3a', 3.9, 6.19, [['*Deja*', 'de', 'armar'], ['tus', 'entrenos', 'sin', '*plan*']], true),
  build('v3b', 6.65, 9.39, [['*Deja*', 'de', 'adivinar'], ['la', '*técnica*', 'de', 'cada', 'movimiento']], true),
  build('v3c', 9.77, 11.85, [['*Deja*', 'de', 'perder', 'tiempo'], ['en', 'el', 'gimnasio']], true),
  build('v5', 12.3, 14.42, [['Y', 'entra', 'a'], ['*GymEvoApp*']]),
  build('v7a', 14.6, 19.9, [['GymEvoApp', 'usa', '*IA*'], ['para', 'ayudarte', 'a', 'armar', 'tu', 'rutina,'], ['según', 'tu', '*nivel*', 'y', 'tu', '*meta*']]),
  build('v7b', 20.2, 25.4, [['para', 'que', 'entrenes', 'con', '*rumbo*,'], ['con', 'la', '*técnica*', 'de', 'cada'], ['movimiento', 'a', 'la', 'vista,'], ['*serie*', 'tras', '*serie*']]),
  build('m1', 25.8, 28.8, [['Cada', 'movimiento'], ['con', 'su', '*guía*'], ['paso', 'a', 'paso']]),
  build('m2', 29.0, 36.0, [['*Registra*', 'cada', '*serie*'], ['con', 'su', 'peso'], ['y', 'mira', 'tu', '*progreso*'], ['en', 'el', 'calendario.'], ['Así', 'siempre', 'sabes'], ['qué', 'sigue.']]),
  build('v13', 36.2, 41.53, [['*Pruébala*', '7', 'días', '*gratis*,'], ['sin', 'registrar', 'tu', 'tarjeta,'], ['y', 'si', 'te', 'gusta,'], ['es', 'un', '*pago*', '*único*']]),
];
export const wordFrame = (pid: string, ci: number, wi: number) => PHRASES.find((p) => p.id === pid)!.chunks[ci].words[wi].f;

export const CUTS = {wipes: [46, 154, 228, 866], irisO: 91, logo: 293, punch: 348, calendar: 806, end: 1006};
export const DEPTH = [
  {word: 'EVO', f0: 7, f1: 94, size: 400, y: 860, kind: 'wipe'},
  {word: 'TÉCNICA', f0: 158, f1: 228, size: 190, y: 760, kind: 'glitch'},
  {word: 'RUMBO', f0: 490, f1: 612, size: 270, y: 880, kind: 'rise'},
  {word: 'REGISTRAR', f0: 696, f1: 806, size: 150, y: 780, kind: 'wipe'},
];
