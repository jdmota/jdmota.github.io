import chroma from "chroma-js";
import {
  clipboardText,
  createElem,
  createSpanText,
  debounce,
  objectKeys,
} from "../_shared/shared";

(window as any).chroma = chroma;

const FORMATS = {
  name: "possible name",
  hex: "hexadecimal code",
  rgb: "red green blue (alpha) [0-255]",
  hsl: "hue saturation lightness",
  lab: "lightness a b",
  lch: "lightness chroma hue",
  oklab: "lightness a b",
  oklch: "lightness chromacity hue",
  hsv: "hue saturation value",
  hsi: "hue saturation intensity",
  cmyk: "cyan magenta yellow black",
  gl: "red green blue alpha [0-1]",
} as const;

function numArrToStr(arr: readonly number[]) {
  return arr.map(n => Math.round(n * 1000) / 1000).join(" ");
}

const FORMAT_CONVERT = {
  name: (c: chroma.Color) => c.name(),
  hex: (c: chroma.Color) => c.hex(),
  rgb: (c: chroma.Color) => c.css("rgb"),
  hsl: (c: chroma.Color) => c.css("hsl"),
  lab: (c: chroma.Color) => c.css("lab"),
  lch: (c: chroma.Color) => c.css("lch"),
  oklab: (c: chroma.Color) => c.css("oklab"),
  oklch: (c: chroma.Color) => c.css("oklch"),
  hsv: (c: chroma.Color) => numArrToStr(c["hsv"]()),
  hsi: (c: chroma.Color) => numArrToStr(c["hsi"]()),
  cmyk: (c: chroma.Color) => numArrToStr(c["cmyk"]()),
  gl: (c: chroma.Color) => numArrToStr(c["gl"]()),
} as const;

const colorField = document.querySelector("#color-field")! as HTMLElement;
const colorInput = document.querySelector("#color-input")! as HTMLInputElement;
const colorError = document.querySelector("#color-error")! as HTMLElement;
const colorPreview = document.querySelector("#color-preview")! as HTMLElement;
const colorResults = document.querySelector("#color-results")! as HTMLElement;

const renderedFormats = {
  name: createSpanText(""),
  hex: createSpanText(""),
  rgb: createSpanText(""),
  hsl: createSpanText(""),
  lab: createSpanText(""),
  lch: createSpanText(""),
  oklab: createSpanText(""),
  oklch: createSpanText(""),
  hsv: createSpanText(""),
  hsi: createSpanText(""),
  cmyk: createSpanText(""),
  gl: createSpanText(""),
} as const;

function initialRender(format: keyof typeof FORMATS) {
  const div = document.createElement("div");
  const formatElem = createSpanText(format);
  const convertedElem = createSpanText("");
  const copyElem = createElem("button", "square small");
  copyElem.innerHTML = `<i class="icon content-copy"></i><span class="tooltip bottom">Copy</span>`;
  convertedElem.appendChild(renderedFormats[format]);
  convertedElem.appendChild(copyElem);
  const descElem = createSpanText(FORMATS[format]);

  div.appendChild(formatElem);
  div.appendChild(convertedElem);
  div.appendChild(descElem);

  const tooltip = copyElem.querySelector(".tooltip")! as HTMLElement;

  copyElem.addEventListener("click", () => {
    clipboardText(renderedFormats[format].innerText).then(ok => {
      if (ok) {
        tooltip.innerText = "Copied!";
      } else {
        tooltip.innerText = "Failed copy";
      }
    });
  });

  copyElem.addEventListener("mouseleave", () => {
    setTimeout(() => {
      tooltip.innerText = "Copy";
    }, 100);
  });

  return div;
}

for (const format of objectKeys(FORMATS)) {
  colorResults.appendChild(initialRender(format));
}

const convert = (userText: string) => {
  // Accept spaces before "(" (e.g., "rgb  (")
  // Accept spaces after "#" (e.g., "# fff")
  userText = userText.trim().replaceAll(/\s*\(/g, "(").replaceAll(/#\s*/g, "#");
  try {
    colorField.classList.remove("invalid");
    if (userText) {
      const color = chroma(userText);
      (window as any).COLOR = color;
      console.log("Color object stored in global variable COLOR = ", color);
      // Preview
      colorPreview.style.backgroundColor = color.css("rgb");
      // Show results
      for (const format of objectKeys(FORMATS)) {
        renderedFormats[format].innerText = FORMAT_CONVERT[format](color);
      }
    }
  } catch (err: any) {
    colorField.classList.add("invalid");
    colorError.innerText = err.message;
  }
};

const convertDebounce = debounce(convert, 200);

colorInput.addEventListener("input", () => {
  convertDebounce(colorInput.value);
});

colorInput.value = "rgb(0 0 255)";
convert(colorInput.value);
