/* =========================================================
   print.js
   Generates a high-resolution (300 DPI) raster of the A4 paper
   exactly as shown on screen, then hands off to the browser's
   native print dialog.

   Strategy:
   1. Deselect the active object so selection handles/borders are
      never captured in the export.
   2. Use Fabric's own render pipeline (canvas.toDataURL with a
      multiplier) to rasterize the full paper — this guarantees the
      print output is pixel-identical to the preview, since it's the
      exact same objects, transforms and filters, just rendered at a
      higher internal resolution rather than re-implemented.
   3. Drop that raster into a normally-hidden print layer sized to
      the true physical A4 dimensions (210mm x 297mm), matched with
      an `@page { size: A4; margin: 0 }` rule (see style.css), then
      call window.print().
   ========================================================= */

window.App = window.App || {};

App.Print = (function () {

  const SCREEN_DPI = 96; // the on-screen preview canvas is authored at 96 CSS px/inch

  let canvas = null;
  let btnPrint = null;
  let printImageEl = null;
  let printAreaEl = null;
  let statusText = null;

  function init(fabricCanvas) {
    canvas = fabricCanvas;

    btnPrint = document.getElementById('btnPrint');
    printImageEl = document.getElementById('printImage');
    printAreaEl = document.getElementById('printArea');
    statusText = document.getElementById('statusText');

    btnPrint.addEventListener('click', handlePrintClick);
    window.addEventListener('afterprint', cleanupAfterPrint);
  }

  function handlePrintClick() {
    const img = App.Editor.getActiveImage();
    if (!img || btnPrint.disabled) return;

    const previouslyActive = canvas.getActiveObject();
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    let dataUrl;
    try {
      dataUrl = generateHighResDataUrl();
    } catch (err) {
      console.error('Failed to generate print image:', err);
      setStatus('Could not prepare the print — please try again.', true);
      if (previouslyActive) {
        canvas.setActiveObject(previouslyActive);
        canvas.requestRenderAll();
      }
      return;
    }

    // Restore the selection immediately so editing can continue
    // seamlessly while the browser's print dialog is open.
    if (previouslyActive) {
      canvas.setActiveObject(previouslyActive);
      canvas.requestRenderAll();
    }

    printImageEl.src = dataUrl;

    const triggerPrint = () => {
      window.print();
    };

    // Large data URLs can take a beat to decode; waiting for the
    // image's load event avoids a blank first print attempt in some
    // browsers.
    if (printImageEl.complete && printImageEl.src === dataUrl) {
      triggerPrint();
    } else {
      printImageEl.onload = triggerPrint;
    }
  }

  /**
   * Renders the entire A4 paper — background, image, and every
   * applied transform/filter — at true 300 DPI.
   */
  function generateHighResDataUrl() {
    const printDims = App.Canvas.getPrintDimensions(); // { width, height, dpi }
    const multiplier = printDims.dpi / SCREEN_DPI;

    return canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: multiplier
    });
  }

  function cleanupAfterPrint() {
    // Release the (potentially large, ~2480x3508px) data URL from
    // memory once the print dialog has closed.
    if (printImageEl) {
      printImageEl.removeAttribute('src');
    }
  }

  function setStatus(message, isError) {
    if (!statusText) return;
    statusText.textContent = message;
    statusText.style.color = isError ? 'var(--color-danger)' : '';
  }

  return {
    init
  };

})();
