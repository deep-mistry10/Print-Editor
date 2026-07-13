/* =========================================================
   filters.js
   Handles all pixel-level image adjustments:
     - Brightness, Contrast, Saturation -> Fabric.js WebGL filters
     - Opacity                          -> direct object property
     - Grayscale                        -> toggled Fabric.js filter

   Filter instances live at module scope so their live values
   persist across a crop (crop.js copies the `filters` array onto
   the newly created image and calls rebindImage() here so this
   module keeps operating on the correct, currently active object).
   ========================================================= */

window.App = window.App || {};

App.Filters = (function () {

  let canvas = null;
  let activeImage = null;

  let brightnessFilter = null;
  let contrastFilter = null;
  let saturationFilter = null;
  let grayscaleFilter = null;

  let elBrightness, elContrast, elSaturation, elOpacity, elGrayscale;
  let valBrightness, valContrast, valSaturation, valOpacity;

  let pendingFrame = null;

  function init(fabricCanvas) {
    canvas = fabricCanvas;

    elBrightness = document.getElementById('inputBrightness');
    elContrast = document.getElementById('inputContrast');
    elSaturation = document.getElementById('inputSaturation');
    elOpacity = document.getElementById('inputOpacity');
    elGrayscale = document.getElementById('inputGrayscale');

    valBrightness = document.getElementById('valBrightness');
    valContrast = document.getElementById('valContrast');
    valSaturation = document.getElementById('valSaturation');
    valOpacity = document.getElementById('valOpacity');

    bindEvents();
  }

  function bindEvents() {
    elBrightness.addEventListener('input', () => {
      if (!activeImage) return;
      const v = parseInt(elBrightness.value, 10);
      valBrightness.textContent = v;
      brightnessFilter.brightness = v / 100;
      scheduleApply();
    });

    elContrast.addEventListener('input', () => {
      if (!activeImage) return;
      const v = parseInt(elContrast.value, 10);
      valContrast.textContent = v;
      contrastFilter.contrast = v / 100;
      scheduleApply();
    });

    elSaturation.addEventListener('input', () => {
      if (!activeImage) return;
      const v = parseInt(elSaturation.value, 10);
      valSaturation.textContent = v;
      saturationFilter.saturation = v / 100;
      scheduleApply();
    });

    elOpacity.addEventListener('input', () => {
      if (!activeImage) return;
      const v = parseInt(elOpacity.value, 10);
      valOpacity.textContent = `${v}%`;
      activeImage.set('opacity', v / 100);
      canvas.requestRenderAll();
    });

    elGrayscale.addEventListener('change', () => {
      if (!activeImage) return;
      const idx = activeImage.filters.indexOf(grayscaleFilter);
      if (elGrayscale.checked) {
        if (idx === -1) activeImage.filters.push(grayscaleFilter);
      } else if (idx !== -1) {
        activeImage.filters.splice(idx, 1);
      }
      applyNow();
    });
  }

  /**
   * Filter recomputation (applyFilters) re-renders the full pixel
   * buffer, so during a fast slider drag we throttle it to once per
   * animation frame instead of once per "input" event.
   */
  function scheduleApply() {
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      applyNow();
    });
  }

  function applyNow() {
    if (!activeImage) return;
    activeImage.applyFilters();
    canvas.requestRenderAll();
  }

  /**
   * Called when a brand new image becomes the active editable object
   * (a fresh upload via ui.js). Creates new neutral filter instances,
   * attaches them, and resets the whole Adjustments panel.
   */
  function attachToImage(img) {
    activeImage = img;

    brightnessFilter = new fabric.Image.filters.Brightness({ brightness: 0 });
    contrastFilter = new fabric.Image.filters.Contrast({ contrast: 0 });
    saturationFilter = new fabric.Image.filters.Saturation({ saturation: 0 });
    grayscaleFilter = new fabric.Image.filters.Grayscale();

    img.filters = [brightnessFilter, contrastFilter, saturationFilter];
    img.set('opacity', 1);
    img.applyFilters();

    resetPanelUI();
    canvas.requestRenderAll();
  }

  /**
   * Called after a crop replaces the Fabric image object. The new
   * image already carries a copy of the same filter array (crop.js
   * does `newImg.filters = img.filters.slice()`), so the filter
   * instances above are still valid — only the "which object do we
   * apply to" pointer needs updating. Panel values are left as-is
   * since the crop should not reset adjustments the user has made.
   */
  function rebindImage(img) {
    activeImage = img;
  }

  /**
   * Reverts brightness, contrast, saturation, grayscale and opacity
   * to their neutral defaults on the current active image. Used by
   * the toolbar Reset button, alongside App.Editor.resetImage().
   */
  function reset() {
    if (!activeImage) return;

    brightnessFilter.brightness = 0;
    contrastFilter.contrast = 0;
    saturationFilter.saturation = 0;

    const idx = activeImage.filters.indexOf(grayscaleFilter);
    if (idx !== -1) activeImage.filters.splice(idx, 1);

    activeImage.set('opacity', 1);
    activeImage.applyFilters();

    resetPanelUI();
    canvas.requestRenderAll();
  }

  function resetPanelUI() {
    elBrightness.value = 0;
    elContrast.value = 0;
    elSaturation.value = 0;
    elOpacity.value = 100;
    elGrayscale.checked = false;

    valBrightness.textContent = '0';
    valContrast.textContent = '0';
    valSaturation.textContent = '0';
    valOpacity.textContent = '100%';
  }

  return {
    init,
    attachToImage,
    rebindImage,
    reset
  };

})();
