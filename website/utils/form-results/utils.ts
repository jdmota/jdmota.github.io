import transliterate from "@sindresorhus/transliterate";

export function removeAllChildren(elem: Element) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}

export function limitStringLength(string: string, max = 50) {
  const cut = string.slice(0, max);
  if (cut !== string) return cut + "...";
  return string;
}

export function toArray<T extends string | number>(
  value: T | readonly T[]
): readonly T[] {
  return Array.isArray(value) ? value : [value];
}

export function split(text: string, sep: string) {
  return cleanArray(text.split(sep));
}

export function cleanArray(array: readonly string[]) {
  return array.map(s => s.trim()).filter(Boolean);
}

export function cleanText(text: string) {
  return transliterate(text.trim().toLowerCase());
}

export function printString(value: string) {
  if (value) {
    return value;
  }
  return "---- empty ----";
}

// https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
export function round(num: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function printPercentage(count: number, total: number) {
  return `${round((count / total) * 100)}%`;
}
