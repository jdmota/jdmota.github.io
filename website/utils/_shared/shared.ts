// import transliterate from "@sindresorhus/transliterate";

export function objectKeys<K extends string>(obj: {
  [key in K]?: any;
}): readonly K[] {
  return Object.keys(obj) as any;
}

export function objectEntries<K extends string, V>(obj: {
  [key in K]?: V;
}): readonly (readonly [K, V])[] {
  return Object.entries(obj).filter(([_, v]) => v !== undefined) as any;
}

export function debounce<T>(fn: (arg: T) => void, delay: number) {
  let id: NodeJS.Timeout | number | undefined = undefined;
  return (arg: T) => {
    clearTimeout(id);
    id = setTimeout(() => fn(arg), delay);
  };
}

export function createElem(tag: string, className: string) {
  const elem = document.createElement(tag);
  elem.className = className;
  return elem;
}

export function createAnchor(url: string, newTab: boolean) {
  const a = document.createElement("a");
  a.href = url;
  if (newTab) {
    a.target = "_blank;";
  }
  a.rel = "noopener noreferrer";
  return a;
}

export function createSpanText(text: string) {
  const span = document.createElement("span");
  span.innerText = text;
  return span;
}

/* function throttle<T>(fn: (arg: T) => void, delay: number) {
  let id: NodeJS.Timeout | number | undefined = undefined;
  return (arg: T) => {
    if (id == null) {
      fn(arg);
      id = setTimeout(() => (id = undefined), delay);
    }
  };
} */

/* function cleanText(text: string) {
  return transliterate(text.trim()).toLowerCase();
} */

export async function clipboardText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}
