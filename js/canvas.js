/* =========================================================
   canvas.js
   Responsible for initializing and owning the Fabric.js canvas
   that represents the fixed A4 paper. No other module should
   create a Fabric canvas instance — everything goes through
   App.Canvas.
   ========================================================= */

window.App = window.App || {};

App.Canvas = (function () {

  // A4 paper size at 96 DPI (CSS reference pixel), portrait orientation.
  // This is the on-screen preview resolution. The true 300 DPI
  // print resolution is generated separately at print time (print.js).
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  // 300 DPI target dimensions used later by print.js
  const PRINT_DPI = 300;
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const A4_WIDTH_PX_300DPI = Math.round((A4_WIDTH_MM / 25.4) * PRINT_DPI);   // 2480
  const A4_HEIGHT_PX_300DPI = Math.round((A4_HEIGHT_MM / 25.4) * PRINT_DPI); // 3508

  let fabricCanvas = null;
  let paperEl = null;

  /**
   * Initializes the Fabric.js canvas bound to #printCanvas,
   * sized exactly to the A4 paper element.
   */
  function init() {
    paperEl = document.getElementById('a4Paper');

    fabricCanvas = new fabric.Canvas('printCanvas', {
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: false,           // no marquee selection — single image only
      stopContextMenu: true,
      fireRightClick: false,
      enableRetinaScaling: true,
      uniformScaling: false       // crop rect resizes freely by default;
                                   // the image object overrides this itself
                                   // via lockUniScaling so it always stays
                                   // proportional regardless of this setting.
    });

    // The paper itself must never move — only the image inside it can.
    // We enforce single-object constraint at the UI layer (ui.js) and
    // clamp object movement within the paper bounds here.
    fabricCanvas.on('object:moving', clampObjectToPaper);

    return fabricCanvas;
  }

  /**
   * Keeps the active object's center within reasonable paper bounds
   * so the image cannot be dragged entirely out of view.
   * Allows partial overflow (common in print tools) but prevents
   * losing the object completely off-canvas.
   */
  function clampObjectToPaper(e) {
    const obj = e.target;
    if (!obj) return;

    const bound = obj.getBoundingRect(true);
    const margin = 40; // px of allowed overflow beyond paper edge

    if (bound.left < -bound.width + margin) {
      obj.left = obj.left - (bound.left - (-bound.width + margin));
    }
    if (bound.top < -bound.height + margin) {
      obj.top = obj.top - (bound.top - (-bound.height + margin));
    }
    if (bound.left + bound.width > A4_WIDTH_PX + bound.width - margin) {
      obj.left = obj.left - ((bound.left + bound.width) - (A4_WIDTH_PX + bound.width - margin));
    }
    if (bound.top + bound.height > A4_HEIGHT_PX + bound.height - margin) {
      obj.top = obj.top - ((bound.top + bound.height) - (A4_HEIGHT_PX + bound.height - margin));
    }
  }

  function getCanvas() {
    return fabricCanvas;
  }

  function getPaperDimensions() {
    return { width: A4_WIDTH_PX, height: A4_HEIGHT_PX };
  }

  function getPrintDimensions() {
    return { width: A4_WIDTH_PX_300DPI, height: A4_HEIGHT_PX_300DPI, dpi: PRINT_DPI };
  }

  return {
    init,
    getCanvas,
    getPaperDimensions,
    getPrintDimensions
  };

})();
