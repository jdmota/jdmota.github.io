import qrcode, { type QRCodeRenderersOptions } from "qrcode";
import chroma from "chroma-js";
import { scaleElement } from "./scale-that-svg";

(window as any).qrcode = qrcode;

function error(message: string): never {
  throw new Error(message);
}

function bug(): never {
  error("BUG: Contact the developer");
}

const DEFAULT_QRCODE_OPTS = {
  margin: 1,
  width: 1000,
  color: {
    dark: "#1A1A1A",
    light: "#ffffff",
  },
} as const;

const elems = {
  text: document.getElementById("text") as HTMLInputElement,
  errorLevel: document.getElementById("error-level") as HTMLSelectElement,
  darkColor: document.getElementById("dark-color") as HTMLInputElement,
  lightColor: document.getElementById("light-color") as HTMLInputElement,
  logoText: document.getElementById("logo-text") as HTMLInputElement,
  generateButton: document.getElementById("generate") as HTMLButtonElement,
  downloadPng: document.getElementById("download-png") as HTMLButtonElement,
  downloadSvg: document.getElementById("download-svg") as HTMLButtonElement,
  copyPng: document.getElementById("copy-png") as HTMLButtonElement,
  copySvg: document.getElementById("copy-svg") as HTMLButtonElement,
  resultButtons: document.getElementById("result-buttons") as HTMLDivElement,
  result: document.getElementById("result") as HTMLDivElement,
  tooltip: document.getElementById("tooltip") as HTMLDivElement,
} as const;

elems.generateButton.addEventListener("click", () => generate());

elems.text.addEventListener("keyup", evt => {
  if (evt.key === "Enter") {
    generate();
  }
});

let isGenerating = false;

function pending(pending: boolean) {
  isGenerating = pending;
  elems.generateButton.disabled = pending;
  elems.generateButton.innerText = pending ? "Generating..." : "Generate";
}

function colorHex(color: string) {
  return chroma(color).hex();
}

async function generate() {
  if (isGenerating) return;
  pending(true);

  try {
    const text = elems.text.value.trim();

    const errorCorrectionLevel = elems.errorLevel
      .value as QRCodeRenderersOptions["errorCorrectionLevel"];

    const color: QRCodeRenderersOptions["color"] = {
      dark: colorHex(
        elems.darkColor.value.trim() || DEFAULT_QRCODE_OPTS.color.dark
      ),
      light: colorHex(
        elems.lightColor.value.trim() || DEFAULT_QRCODE_OPTS.color.light
      ),
    };

    const [originalSvg, png] = await Promise.all([
      qrcode.toString(text, {
        type: "svg",
        ...DEFAULT_QRCODE_OPTS,
        errorCorrectionLevel,
        color,
      }),
      qrcode.toDataURL(text, {
        type: "image/png",
        ...DEFAULT_QRCODE_OPTS,
        errorCorrectionLevel,
        color,
      }),
    ]);

    const logoText = elems.logoText.value.trim();
    if (logoText) {
      const svg = addLogo(originalSvg, logoText);
      elems.result.innerHTML = svg;
      elems.downloadPng.disabled = true;
      elems.downloadPng.onclick = () => {};
      elems.downloadSvg.onclick = () => download(svgToDataURL(svg), "svg");
      elems.copyPng.disabled = true;
      elems.copyPng.onclick = () => {};
      elems.copySvg.onclick = () => clipboardText(svg);
    } else {
      const svg = originalSvg;
      elems.result.innerHTML = `<img src="${png}" />`;
      elems.downloadPng.disabled = false;
      elems.downloadPng.onclick = () => download(png, "png");
      elems.downloadSvg.onclick = () => download(svgToDataURL(svg), "svg");
      elems.copyPng.disabled = false;
      elems.copyPng.onclick = () => clipboardPNG(png);
      elems.copySvg.onclick = () => clipboardText(svg);
    }
    elems.resultButtons.style.display = "";
  } catch (error: any) {
    elems.result.innerHTML = `Error: ${error.message}`;
    elems.resultButtons.style.display = "none";
  }

  pending(false);
}

function getViewBox(svg: SVGSVGElement): readonly [number, number] | null {
  const result = svg.getAttribute("viewBox")?.match(/^0 0 (\d+) (\d+)$/);
  return result ? [+result[1], +result[2]] : null;
}

function getBoolAttr(node: Element, name: string): boolean {
  return node.hasAttribute(name);
}

function getNumberAttr(node: Element, name: string): number | null {
  const value = node.getAttribute(name);
  return value ? +value : null;
}

function prepareLogo(logoHTML: string, boxSize: number) {
  const root = document.createElement("div");
  root.innerHTML = logoHTML;

  const rootSvg = root.querySelector("svg") ?? error("Missing SVG tag in logo");
  const [width, height] =
    getViewBox(rootSvg) ?? error("Missing viewBox attribute in logo");

  const userScale = getNumberAttr(rootSvg, "user:scale") ?? 1;
  const userBox = !getBoolAttr(rootSvg, "user:no-box");

  const maxSize = Math.max(width, height);
  const scale = (boxSize / maxSize) * userScale;

  scaleElement(rootSvg, { scale });
  return {
    svg: rootSvg.innerHTML,
    translate: [(boxSize - width * scale) / 2, (boxSize - height * scale) / 2],
    withBox: userBox,
  } as const;
}

function addLogo(originalSvg: string, originalLogoSvg: string) {
  const root = document.createElement("div");
  root.innerHTML = originalSvg;

  const rootSvg = root.querySelector("svg") ?? bug();
  const viewBox = (getViewBox(rootSvg) ?? bug())[0];

  const moduleSize = viewBox - DEFAULT_QRCODE_OPTS.margin * 2;

  const pos = Math.floor(moduleSize / 3);
  const boxSize = moduleSize - pos - pos;
  const translateBox = pos + DEFAULT_QRCODE_OPTS.margin;

  const {
    svg: logoSvg,
    translate: translateLogo,
    withBox,
  } = prepareLogo(originalLogoSvg, boxSize);

  const box = withBox
    ? `<path fill="#ffffff" d="M0 0h${boxSize}v${boxSize}H0z"></path>`
    : "";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${translateBox},${translateBox})`);
  g.innerHTML =
    box +
    `<g transform="translate(${translateLogo[0]},${translateLogo[1]})">${logoSvg}</g>`;

  rootSvg.appendChild(g);
  return root.innerHTML;
}

function download(dataUrl: string, type: "png" | "svg") {
  const anchor = document.createElement("a");
  anchor.download = "qrcode." + type;
  anchor.href = dataUrl;
  anchor.click();
}

function svgToDataURL(svg: string) {
  const encoded = encodeURIComponent(svg).replace(
    /[!'"()*]/g,
    c => "%" + c.charCodeAt(0).toString(16)
  );
  return `data:image/svg+xml,${encoded}`;
}

let tooltipTimeoutId: NodeJS.Timeout | number = 0;

function setTooltipText(text: string) {
  elems.tooltip.classList.add("show");
  elems.tooltip.innerText = text;
}

function clearTooltip() {
  setTimeout(() => {
    elems.tooltip.classList.remove("show");
  }, 1400);
}

async function copyRoutine(fn: () => Promise<void>) {
  clearTimeout(tooltipTimeoutId);
  try {
    await fn();
    setTooltipText(`Copied!`);
  } catch (error: any) {
    setTooltipText(`Error: ${error.message}`);
  }
  clearTooltip();
}

async function clipboardText(text: string) {
  copyRoutine(() => navigator.clipboard.writeText(text));
}

async function clipboardPNG(dataURL: string) {
  copyRoutine(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        ["image/png"]: dataURItoBlob(dataURL),
      }),
    ])
  );
}

// From https://stackoverflow.com/a/12300351
function dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([ab], { type: mimeString });
  return blob;
}

const searchParams = new URLSearchParams(location.search);
const textQuery = searchParams.get("text");

if (textQuery) {
  elems.text.value = textQuery;
  generate();

  if (searchParams.has("fullscreen")) {
    document.body.classList.add("fullscreen");
  }
} else {
  elems.text.focus();
  elems.resultButtons.style.display = "none";
}

window.addEventListener("keydown", evt => {
  if (evt.key === "Escape") {
    document.body.classList.remove("fullscreen");
  }
});
