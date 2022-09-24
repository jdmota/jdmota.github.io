import qrcode, { type QRCodeRenderersOptions } from "qrcode";
import { scaleElement } from "./scale-that-svg";

function error(message: string): never {
  throw new Error(message);
}

function bug(): never {
  error("BUG: Contact the developer");
}

const qrCodeOptions = {
  margin: 1,
  width: 1000,
  color: { dark: "#1A1A1A" },
} as const;

const elems = {
  text: document.getElementById("text") as HTMLInputElement,
  errorLevel: document.getElementById("error-level") as HTMLSelectElement,
  withLogo: document.getElementById("with-logo") as HTMLInputElement,
  logoText: document.getElementById("logo-text") as HTMLInputElement,
  generateButton: document.getElementById("generate") as HTMLButtonElement,
  downloadPng: document.getElementById("download-png") as HTMLButtonElement,
  downloadSvg: document.getElementById("download-svg") as HTMLButtonElement,
  resultButtons: document.getElementById("result-buttons") as HTMLDivElement,
  result: document.getElementById("result") as HTMLDivElement,
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

async function generate() {
  if (isGenerating) return;
  pending(true);

  try {
    const text = elems.text.value.trim();
    const errorCorrectionLevel = elems.errorLevel
      .value as QRCodeRenderersOptions["errorCorrectionLevel"];
    const [originalSvg, png] = await Promise.all([
      qrcode.toString(text, {
        type: "svg",
        ...qrCodeOptions,
        errorCorrectionLevel,
      }),
      qrcode.toDataURL(text, {
        type: "image/png",
        ...qrCodeOptions,
        errorCorrectionLevel,
      }),
    ]);

    const withLogo = elems.withLogo.checked;
    if (withLogo) {
      const svg = addLogo(originalSvg, elems.logoText.value);
      elems.result.innerHTML = svg;
      elems.downloadPng.disabled = true;
      elems.downloadPng.onclick = () => {};
      elems.downloadSvg.onclick = () => download(svgToDataURL(svg), "svg");
    } else {
      const svg = originalSvg;
      elems.result.innerHTML = `<img src="${png}" />`;
      elems.downloadPng.disabled = false;
      elems.downloadPng.onclick = () => download(png, "png");
      elems.downloadSvg.onclick = () => download(svgToDataURL(svg), "svg");
    }
    elems.resultButtons.style.display = "block";
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

  const moduleSize = viewBox - qrCodeOptions.margin * 2;

  const pos = Math.floor(moduleSize / 3);
  const boxSize = moduleSize - pos - pos;
  const translateBox = pos + qrCodeOptions.margin;

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
