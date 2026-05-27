const textInput = document.querySelector("#qrText");
const sizeInput = document.querySelector("#qrSize");
const correctionInput = document.querySelector("#qrCorrection");
const darkInput = document.querySelector("#qrDark");
const lightInput = document.querySelector("#qrLight");
const qrCodeOutput = document.querySelector("#qrCode");
const downloadButton = document.querySelector("#downloadPng");
const copyButton = document.querySelector("#copySvg");
const statusText = document.querySelector("#status");

let currentSvg = "";

function setStatus(message) {
  statusText.textContent = message;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildSvg(matrix, size, darkColor, lightColor) {
  const cells = matrix.getModuleCount();
  const quietZone = 4;
  const totalCells = cells + quietZone * 2;
  const cellSize = size / totalCells;
  const rects = [];

  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      if (matrix.isDark(row, col)) {
        rects.push(
          `<rect x="${(col + quietZone) * cellSize}" y="${(row + quietZone) * cellSize}" width="${cellSize}" height="${cellSize}"/>`,
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR-Code">
  <rect width="100%" height="100%" fill="${escapeHtml(lightColor)}"/>
  <g fill="${escapeHtml(darkColor)}">
    ${rects.join("\n    ")}
  </g>
</svg>`;
}

function renderQrCode() {
  const value = textInput.value.trim();
  const size = Number(sizeInput.value);

  if (!value) {
    qrCodeOutput.innerHTML = "";
    currentSvg = "";
    setStatus("Gib einen Inhalt ein, um einen QR-Code zu erzeugen.");
    return;
  }

  try {
    const qr = qrcode(0, correctionInput.value);
    qr.addData(value);
    qr.make();

    currentSvg = buildSvg(qr, size, darkInput.value, lightInput.value);
    qrCodeOutput.innerHTML = currentSvg;
    setStatus(`Bereit: ${value.length} Zeichen, ${size} x ${size} px.`);
  } catch (error) {
    qrCodeOutput.innerHTML = "";
    currentSvg = "";
    setStatus("Der Inhalt ist zu lang fuer diese QR-Code-Einstellungen.");
  }
}

async function downloadPng() {
  if (!currentSvg) {
    return;
  }

  const size = Number(sizeInput.value);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const image = new Image();
  const svgBlob = new Blob([currentSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);

  canvas.width = size;
  canvas.height = size;

  image.onload = () => {
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);

    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setStatus("PNG wurde erstellt.");
  };

  image.src = url;
}

async function copySvg() {
  if (!currentSvg) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentSvg);
    setStatus("SVG-Code wurde in die Zwischenablage kopiert.");
  } catch (error) {
    setStatus("Kopieren ist in diesem Browser nicht erlaubt.");
  }
}

[textInput, sizeInput, correctionInput, darkInput, lightInput].forEach((input) => {
  input.addEventListener("input", renderQrCode);
});

downloadButton.addEventListener("click", downloadPng);
copyButton.addEventListener("click", copySvg);

renderQrCode();
