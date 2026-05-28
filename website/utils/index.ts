// import transliterate from "@sindresorhus/transliterate";
import { matchSorter } from "match-sorter";

function onLoad() {
  return new Promise<void>(resolve => {
    if (document.readyState === "complete") {
      resolve();
    } else {
      const fn = () => {
        window.removeEventListener("load", fn);
        resolve();
      };
      window.addEventListener("load", fn);
    }
  });
}

function debounce<T>(fn: (arg: T) => void, delay: number) {
  let id: NodeJS.Timeout | number | undefined = undefined;
  return (arg: T) => {
    clearTimeout(id);
    id = setTimeout(() => fn(arg), delay);
  };
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

type Util = Readonly<{
  title: string;
  desc: string;
  url: string;
}>;

type SearchableUtil = Util &
  Readonly<{
    elem: HTMLElement;
  }>;

const myUtils: readonly Util[] = [
  {
    title: "QR Code Generator",
    desc: "Generate PNG and SVG QR Codes. The text you give is the text that is generated. No redirects. No ads.",
    url: "/utils/qrcode/",
  },
];

const awesomeUtils: readonly Util[] = [];

(async () => {
  await onLoad();

  const myUtilsElem = document.querySelector("#my-utils .utils-grid")!;
  const awesomeUtilsElem = document.querySelector(
    "#awesome-utils .utils-grid"
  )!;

  function createUtil(util: Util) {
    const anchor = document.createElement("a");
    anchor.className = "util";
    anchor.href = util.url;

    const title = document.createElement("div");
    title.className = "util-title";
    title.innerText = util.title;

    const desc = document.createElement("div");
    desc.className = "util-desc";
    desc.innerText = util.desc;

    anchor.appendChild(title);
    anchor.appendChild(desc);
    return anchor;
  }

  const allSearchableUtils: SearchableUtil[] = [];

  for (const util of myUtils) {
    const elem = createUtil(util);
    allSearchableUtils.push({ ...util, elem });
    myUtilsElem.appendChild(elem);
  }

  for (const util of awesomeUtils) {
    const elem = createUtil(util);
    allSearchableUtils.push({ ...util, elem });
    awesomeUtilsElem.appendChild(elem);
  }

  const searchElem = document.querySelector(
    "#search-input"
  )! as HTMLInputElement;

  const search = debounce((userText: string) => {
    const results = matchSorter(allSearchableUtils, userText, {
      keys: ["title", "desc", "url"],
    });

    for (const { elem } of allSearchableUtils) {
      elem.style.display = "none";
    }

    for (const { elem } of results) {
      elem.style.display = "block";
    }
  }, 200);

  searchElem.addEventListener("input", () => {
    search(searchElem.value);
  });
})();
