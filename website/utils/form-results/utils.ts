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
