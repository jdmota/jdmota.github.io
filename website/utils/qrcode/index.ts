import qrcode, { type QRCodeRenderersOptions } from "qrcode";

const qrCodeOptions: QRCodeRenderersOptions = {
  margin: 1,
  width: 1000,
  color: { dark: "#1A1A1A" },
};

const elems = {
  text: document.getElementById("text") as HTMLInputElement,
  errorLevel: document.getElementById("error-level") as HTMLSelectElement,
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
    const [svg, png] = await Promise.all([
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

    elems.result.innerHTML = svg;
    elems.downloadPng.onclick = () => download(png, "png");
    elems.downloadSvg.onclick = () => download(svgToDataURL(svg), "svg");
    elems.resultButtons.style.display = "block";
  } catch (error: any) {
    elems.result.innerHTML = `Error: ${error.message}`;
    elems.resultButtons.style.display = "none";
  }

  pending(false);
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
