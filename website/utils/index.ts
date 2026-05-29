import { matchSorter } from "match-sorter";
import { createAnchor, createApp, debounce } from "./_shared/shared.ts";

type UtilAction = Readonly<{
  name: string;
  url: string;
}>;

type Util = Readonly<{
  title: string;
  desc: string;
  url: string;
  actions?: readonly UtilAction[];
}>;

type SearchableUtil = Util &
  Readonly<{
    elem: HTMLElement;
  }>;

const myUtils: readonly Util[] = [
  {
    title: "QR Code Generator",
    desc: "Generate PNG and SVG QR Codes. The text you give is the text that is generated. No redirects. No ads. (Thanks to npm:qrcode)",
    url: "/utils/qrcode/",
  },
  {
    title: "Color Format Converter",
    desc: "Simple color format converter. (Thanks to npm:chroma-js)",
    url: "/utils/colors/",
  },
];

const awesomeUtils: readonly Util[] = [
  {
    title: "VERT",
    desc: "An awesome file converter.",
    url: "https://vert.sh/",
  },
  {
    title: "Squoosh",
    desc: "An awesome image compressor.",
    url: "https://squoosh.app/",
  },
  {
    title: "YT-DLP",
    desc: "A feature-rich command-line audio/video downloader",
    url: "https://github.com/yt-dlp/yt-dlp",
    actions: [
      {
        name: "Installation",
        url: "https://github.com/yt-dlp/yt-dlp/wiki/Installation",
      },
    ],
  },
  {
    title: "Icon Explorer",
    desc: "Icon Explorer with Instant searching, powered by Iconify",
    url: "https://icones.js.org/",
  },
  {
    title: "Color Converter",
    desc: "By W3 Schools",
    url: "https://www.w3schools.com/colors/colors_converter.asp",
  },
  {
    title: "Awesome Lists",
    desc: "Awesome lists about all kinds of interesting topics by Sindre Sorhus",
    url: "https://github.com/sindresorhus/awesome",
  },
];

createApp(() => {
  const myUtilsElem = document.querySelector("#my-utils .utils-grid")!;
  const awesomeUtilsElem = document.querySelector(
    "#awesome-utils .utils-grid"
  )!;

  function createUtil(util: Util) {
    const container = document.createElement("div");
    container.className = "util";

    const main = createAnchor(util.url, false);
    main.className = "util-main";

    const title = document.createElement("div");
    title.className = "util-title";
    title.innerText = util.title;

    const desc = document.createElement("div");
    desc.className = "util-desc";
    desc.innerText = util.desc;

    const actions = document.createElement("div");
    actions.className = "util-actions";

    if (util.actions && util.actions.length > 0) {
      for (const { name, url } of util.actions) {
        const action = createAnchor(url, true);
        action.className = "util-action";
        action.innerText = name;
        actions.appendChild(action);
      }
    } else {
      container.classList.add("util-no-actions");
    }

    const newTab = createAnchor(util.url, true);
    newTab.className = "util-new-tab button square";

    const newTabIcon = document.createElement("i");
    newTabIcon.className = "icon open-in-new";
    newTab.appendChild(newTabIcon);

    main.appendChild(title);
    main.appendChild(desc);
    container.appendChild(main);
    container.appendChild(actions);
    container.appendChild(newTab);
    return container;
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
});
