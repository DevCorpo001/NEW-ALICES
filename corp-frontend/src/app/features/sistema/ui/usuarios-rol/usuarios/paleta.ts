/** Pasteles literales, no compuestos: Tailwind solo conserva las clases que ve escritas. */
const PASTELES: readonly string[] = [
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
];

export function iniciales(texto: string): string {
  return texto.trim().slice(0, 2).toUpperCase();
}

/** Mismo texto, mismo color siempre: el usuario reconoce su fila de un vistazo. */
export function clasesPastel(texto: string): string {
  let suma = 0;
  for (const caracter of texto.trim().toUpperCase()) {
    suma += caracter.charCodeAt(0);
  }
  return PASTELES[suma % PASTELES.length];
}
