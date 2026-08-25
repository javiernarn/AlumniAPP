// Renders a DOM element (typically the #printable-area report used by the
// print-preview modals) to a downloadable multi-page A4 PDF, instead of
// going through the browser's window.print() dialog.
//
// Usage:
//   import { exportElementToPdf } from "~/utils/exportPdf";
//   await exportElementToPdf("printable-area", { filename: "alumni-dashboard-report.pdf" });

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// Small margin so content doesn't touch the page edge.
const MARGIN_MM = 8;

/**
 * @param {string} elementId - id of the DOM node to capture (e.g. "printable-area")
 * @param {object} options
 * @param {string} options.filename - filename for the downloaded PDF, e.g. "report.pdf"
 * @param {number} options.scale - html2canvas render scale (higher = sharper but slower/larger). Default 2.
 * @returns {Promise<void>}
 */
export async function exportElementToPdf(elementId, options = {}) {
  const { filename = "report.pdf", scale = 2 } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`exportElementToPdf: no element found with id "${elementId}"`);
  }

  // html2canvas snapshots the live DOM (including chart SVGs/canvases,
  // images, and computed styles), so what the print-preview modal shows is
  // exactly what ends up in the PDF.
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");

  const usableWidthMm = A4_WIDTH_MM - MARGIN_MM * 2;
  const usableHeightMm = A4_HEIGHT_MM - MARGIN_MM * 2;

  // Convert the canvas (pixels) to millimetres at the usable page width,
  // preserving aspect ratio, then paginate by slicing that scaled height
  // into A4-page-sized chunks.
  const pxToMm = usableWidthMm / canvas.width;
  const scaledHeightMm = canvas.height * pxToMm;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let heightLeftMm = scaledHeightMm;
  let positionMm = 0;
  let isFirstPage = true;

  while (heightLeftMm > 0) {
    if (!isFirstPage) {
      pdf.addPage();
    }

    // Shift the full-length image up by however much we've already
    // "consumed" on previous pages, so each page shows the next slice.
    pdf.addImage(
      imgData,
      "PNG",
      MARGIN_MM,
      MARGIN_MM - positionMm,
      usableWidthMm,
      scaledHeightMm
    );

    heightLeftMm -= usableHeightMm;
    positionMm += usableHeightMm;
    isFirstPage = false;
  }

  pdf.save(filename);
}
