/* =========================================================
   editor.js
   Owns the "single active image" reference and keeps the
   Transform panel (Width, Height, Rotation, Scale) in sync
   with the Fabric object — in both directions.

   Crop, filter and print logic live in their own dedicated
   modules (crop.js, filters.js, print.js) and are wired up
   in later phases.
   ========================================================= */

window.App = window.App || {};

App.Editor = (function () {

  let canvas = null;
  let activeImage = null;
  let originalState = null; // stores pristine values for Reset

  // DOM refs (Transform panel)
  let elRotation, elScale, elValRotation, elValScale;

  function init(fabricCanvas) {
    canvas = fabricCanvas;

    elRotation = document.getElementById('inputRotation');
    elScale = document.getElementById('inputScale');
    elValRotation = document.getElementById('valRotation');
    elValScale = document.getElementById('valScale');

    bindCanvasEvents();
    bindPanelEvents();
  }

  function bindCanvasEvents() {
    canvas.on('object:scaling', updatePanelFromObject);
    canvas.on('object:moving', updatePanelFromObject);
    canvas.on('object:rotating', updatePanelFromObject);
    canvas.on('object:modified', updatePanelFromObject);
    canvas.on('selection:created', updatePanelFromObject);
    canvas.on('selection:updated', updatePanelFromObject);
  }

  function bindPanelEvents() {
    



    elRotation.addEventListener('input', () => {
      if (!activeImage) return;
      const angle = parseFloat(elRotation.value);
      activeImage.set({ angle });
      elValRotation.textContent = `${angle}°`;
      canvas.requestRenderAll();
      updatePanelFromObject(true);
    });

    elScale.addEventListener('input', () => {
      if (!activeImage) return;
      const percent = parseFloat(elScale.value);
      const ratio = percent / 100;
      const baseScale = activeImage.__baseScale || 1;
      activeImage.set({
        scaleX: baseScale * ratio,
        scaleY: baseScale * ratio
      });
      elValScale.textContent = `${percent}%`;
      canvas.requestRenderAll();
      updatePanelFromObject(true);
    });
  }

  /**
   * Registers a newly loaded image as the single active editable object.
   * Stores its pristine transform so Reset (implemented in a later phase)
   * can restore it exactly.
   */
  function setActiveImage(imgObject, baseScale) {
    activeImage = imgObject;
    activeImage.__baseScale = baseScale;

    originalState = {
      left: imgObject.left,
      top: imgObject.top,
      scaleX: imgObject.scaleX,
      scaleY: imgObject.scaleY,
      angle: imgObject.angle,
      flipX: imgObject.flipX,
      flipY: imgObject.flipY,
      opacity: imgObject.opacity
    };

    enablePanel(true);
    updatePanelFromObject();
  }

  function clearActiveImage() {
    activeImage = null;
    originalState = null;
    enablePanel(false);
  }

  function getActiveImage() {
    return activeImage;
  }

  function getOriginalState() {
    return originalState;
  }

  /**
   * Rotates the active image 90° clockwise, pivoting around its
   * own center so it stays visually anchored on the paper.
   */
  function rotateBy90() {
    if (!activeImage) return;
    const newAngle = (((activeImage.angle || 0) + 90) % 360 + 360) % 360;
    activeImage.rotate(newAngle);
    activeImage.setCoords();
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: activeImage });
    updatePanelFromObject();
  }

  /**
   * Mirrors the active image across its vertical axis (left/right flip).
   */
  function flipHorizontal() {
    if (!activeImage) return;
    activeImage.set('flipX', !activeImage.flipX);
    activeImage.setCoords();
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: activeImage });
  }

  /**
   * Mirrors the active image across its horizontal axis (top/bottom flip).
   */
  function flipVertical() {
    if (!activeImage) return;
    activeImage.set('flipY', !activeImage.flipY);
    activeImage.setCoords();
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: activeImage });
  }

  /**
   * Restores the active image to its exact pristine state — the
   * position, scale, rotation, flip and opacity it had the moment
   * it was first loaded onto the paper. Filter adjustments (phase 4)
   * are reset independently by filters.js when Reset is triggered.
   */
  function resetImage() {
    if (!activeImage || !originalState) return;

    activeImage.set({
      left: originalState.left,
      top: originalState.top,
      scaleX: originalState.scaleX,
      scaleY: originalState.scaleY,
      angle: originalState.angle,
      flipX: originalState.flipX,
      flipY: originalState.flipY,
      opacity: originalState.opacity
    });
    activeImage.setCoords();
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: activeImage });
    updatePanelFromObject();
  }

  function updatePanelFromObject(skipRotationScaleSync) {
    if (!activeImage) return;



    if (!skipRotationScaleSync) {
      const angle = Math.round(((activeImage.angle % 360) + 360) % 360);
      elRotation.value = angle;
      elValRotation.textContent = `${angle}°`;

      const baseScale = activeImage.__baseScale || 1;
      const currentScale = activeImage.scaleX / baseScale;
      const percent = Math.round(currentScale * 100);
      elScale.value = Math.min(300, Math.max(5, percent));
      elValScale.textContent = `${percent}%`;
    }
  }

  function enablePanel(enabled) {
    [elRotation, elScale].forEach(el => {
      if (el) el.disabled = !enabled;
      });
  }

  return {
    init,
    setActiveImage,
    clearActiveImage,
    getActiveImage,
    getOriginalState,
    updatePanelFromObject,
    rotateBy90,
    flipHorizontal,
    flipVertical,
    resetImage
  };

})();
