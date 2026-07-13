/* =========================================================
   crop.js
   Interactive cropping of the single active image.

   Flow:
   1. User clicks "Crop" -> enterCropMode()
      - Image is temporarily un-rotated/un-flipped (its center point
        never moves, so this is visually seamless) so the crop
        rectangle can be reasoned about in simple axis-aligned space.
      - A draggable/resizable crop rectangle is overlaid on the image,
        together with a 4-piece dark mask that dims everything outside
        the current crop selection.
      - The rest of the toolbar and sidebar lock while cropping.
   2. User drags/resizes the crop rectangle (always clamped inside
      the image's bounds).
   3. "Apply" -> applyCrop()
      - The crop selection is mapped back to the ORIGINAL, full
        resolution pixel data of the image (not the scaled preview),
        drawn onto an offscreen canvas, and used to build a brand new
        Fabric image. This guarantees no quality is lost.
      - The image's prior rotation/flip is re-applied on top of the
        cropped result.
   4. "Cancel" -> cancelCrop()
      - Crop UI is discarded and the image is restored exactly as it
        was before entering crop mode.
   ========================================================= */

window.App = window.App || {};

App.Crop = (function () {

  let canvas = null;

  let isCropping = false;
  let cropRect = null;
  let maskTop = null, maskBottom = null, maskLeft = null, maskRight = null;
  let preCropTransform = null;
  let targetImage = null;
  let imageBounds = null; // axis-aligned bounds of the image while unrotated

  const MIN_CROP_SIZE = 30; // minimum crop rectangle size, in canvas px

  let btnCrop, btnApplyCrop, btnCancelCrop, statusText;

  function init(fabricCanvas) {
    canvas = fabricCanvas;

    btnCrop = document.getElementById('btnCrop');
    btnApplyCrop = document.getElementById('btnApplyCrop');
    btnCancelCrop = document.getElementById('btnCancelCrop');
    statusText = document.getElementById('statusText');

    btnCrop.addEventListener('click', enterCropMode);
    btnApplyCrop.addEventListener('click', applyCrop);
    btnCancelCrop.addEventListener('click', cancelCrop);
  }

  /* ---------------------------------------------------------
     Enter crop mode
     --------------------------------------------------------- */

  function enterCropMode() {
    const img = App.Editor.getActiveImage();
    if (!img || isCropping) return;

    isCropping = true;
    targetImage = img;

    preCropTransform = {
      angle: img.angle,
      flipX: img.flipX,
      flipY: img.flipY
    };

    // originX/originY are 'center', so the center point (left/top)
    // remains valid regardless of angle — resetting angle/flip here
    // does not move the image on screen in a way the user perceives
    // as a jump, it simply un-rotates it in place.
    img.set({ angle: 0, flipX: false, flipY: false, selectable: false, evented: false });
    img.setCoords();
    canvas.discardActiveObject();

    imageBounds = getImageBounds(img);

    cropRect = new fabric.Rect({
      left: imageBounds.left,
      top: imageBounds.top,
      width: imageBounds.width,
      height: imageBounds.height,
      fill: 'rgba(0,0,0,0)',
      stroke: '#2563eb',
      strokeWidth: 2,
      strokeDashArray: [8, 6],
      strokeUniform: true,
      cornerColor: '#2563eb',
      cornerStyle: 'circle',
      cornerSize: 12,
      transparentCorners: false,
      borderColor: '#2563eb',
      lockRotation: true,
      originX: 'left',
      originY: 'top',
      hasRotatingPoint: false
    });
    cropRect.setControlsVisibility({ mtr: false });

    maskTop = createMaskRect();
    maskBottom = createMaskRect();
    maskLeft = createMaskRect();
    maskRight = createMaskRect();

    canvas.add(maskTop, maskBottom, maskLeft, maskRight, cropRect);

    cropRect.on('moving', handleCropRectTransform);
    cropRect.on('scaling', handleCropRectTransform);

    updateMasks();

    canvas.setActiveObject(cropRect);
    canvas.requestRenderAll();

    toggleCropModeUI(true);
    setStatus('Drag the corners to select your crop area');
  }

  function createMaskRect() {
    return new fabric.Rect({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      fill: 'rgba(15,17,23,0.55)',
      selectable: false,
      evented: false
    });
  }

  /* ---------------------------------------------------------
     Live geometry / masking while dragging or resizing
     --------------------------------------------------------- */

  function getCropRectGeometry() {
    return {
      left: cropRect.left,
      top: cropRect.top,
      width: cropRect.width * cropRect.scaleX,
      height: cropRect.height * cropRect.scaleY
    };
  }

  function handleCropRectTransform() {
    let geo = getCropRectGeometry();

    // Enforce a sane minimum size so the crop can't collapse to a point.
    if (geo.width < MIN_CROP_SIZE) {
      cropRect.scaleX = MIN_CROP_SIZE / cropRect.width;
      geo = getCropRectGeometry();
    }
    if (geo.height < MIN_CROP_SIZE) {
      cropRect.scaleY = MIN_CROP_SIZE / cropRect.height;
      geo = getCropRectGeometry();
    }

    // Clamp the rectangle so it always stays fully within the image.
    let left = cropRect.left;
    let top = cropRect.top;

    if (left < imageBounds.left) left = imageBounds.left;
    if (top < imageBounds.top) top = imageBounds.top;
    if (left + geo.width > imageBounds.left + imageBounds.width) {
      left = imageBounds.left + imageBounds.width - geo.width;
    }
    if (top + geo.height > imageBounds.top + imageBounds.height) {
      top = imageBounds.top + imageBounds.height - geo.height;
    }

    cropRect.set({ left, top });
    cropRect.setCoords();

    updateMasks();
  }

  function updateMasks() {
    const r = getCropRectGeometry();
    const paper = App.Canvas.getPaperDimensions();

    maskTop.set({ left: 0, top: 0, width: paper.width, height: Math.max(0, r.top) });
    maskBottom.set({
      left: 0,
      top: r.top + r.height,
      width: paper.width,
      height: Math.max(0, paper.height - (r.top + r.height))
    });
    maskLeft.set({ left: 0, top: r.top, width: Math.max(0, r.left), height: r.height });
    maskRight.set({
      left: r.left + r.width,
      top: r.top,
      width: Math.max(0, paper.width - (r.left + r.width)),
      height: r.height
    });

    canvas.requestRenderAll();
  }

  function getImageBounds(img) {
    const w = img.width * img.scaleX;
    const h = img.height * img.scaleY;
    return {
      left: img.left - w / 2,
      top: img.top - h / 2,
      width: w,
      height: h
    };
  }

  /* ---------------------------------------------------------
     Apply crop — full-resolution pixel crop, quality preserved
     --------------------------------------------------------- */

  function applyCrop() {
    if (!isCropping || !cropRect || !targetImage) return;

    const img = targetImage;
    const geo = getCropRectGeometry();

    const pixelScaleX = img.scaleX;
    const pixelScaleY = img.scaleY;

    // Map the on-screen crop selection back to the image's native
    // (full-resolution) pixel coordinate space.
    let cropX = (geo.left - imageBounds.left) / pixelScaleX;
    let cropY = (geo.top - imageBounds.top) / pixelScaleY;
    let cropW = geo.width / pixelScaleX;
    let cropH = geo.height / pixelScaleY;

    cropX = Math.max(0, Math.min(img.width, cropX));
    cropY = Math.max(0, Math.min(img.height, cropY));
    cropW = Math.max(1, Math.min(img.width - cropX, cropW));
    cropH = Math.max(1, Math.min(img.height - cropY, cropH));

    cropX = Math.round(cropX);
    cropY = Math.round(cropY);
    cropW = Math.round(cropW);
    cropH = Math.round(cropH);

    const sourceEl = img.getElement();

    const offscreen = document.createElement('canvas');
    offscreen.width = cropW;
    offscreen.height = cropH;
    const ctx = offscreen.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Place the new cropped image centered exactly where the crop
    // selection was on screen.
    const centerX = geo.left + geo.width / 2;
    const centerY = geo.top + geo.height / 2;

    const newImg = new fabric.Image(offscreen, {
      left: centerX,
      top: centerY,
      originX: 'center',
      originY: 'center',
      scaleX: pixelScaleX,
      scaleY: pixelScaleY,
      angle: preCropTransform.angle,
      flipX: preCropTransform.flipX,
      flipY: preCropTransform.flipY,
      opacity: img.opacity,
      cornerColor: '#2563eb',
      cornerStyle: 'circle',
      cornerSize: 12,
      transparentCorners: false,
      borderColor: '#2563eb',
      borderScaleFactor: 1.5,
      lockScalingFlip: true,
      lockUniScaling: true,
      centeredRotation: true
    });

    newImg.setControlsVisibility({
      mt: false, mb: false, ml: false, mr: false,
      tl: true, tr: true, bl: true, br: true, mtr: true
    });

    // Carry over any pixel filters already applied (brightness, contrast,
    // saturation, grayscale — wired up in filters.js) so cropping never
    // discards existing adjustments.
    if (img.filters && img.filters.length) {
      newImg.filters = img.filters.slice();
      newImg.applyFilters();
    }

    canvas.remove(img);
    teardownCropUI();

    canvas.add(newImg);
    canvas.setActiveObject(newImg);
    canvas.requestRenderAll();

    App.Editor.setActiveImage(newImg, pixelScaleX);
    if (App.Filters && typeof App.Filters.rebindImage === 'function') {
      App.Filters.rebindImage(newImg);
    }

    isCropping = false;
    targetImage = null;
    preCropTransform = null;
    imageBounds = null;

    toggleCropModeUI(false);
    setStatus('Crop applied');
  }

  /* ---------------------------------------------------------
     Cancel crop — restore the image exactly as it was
     --------------------------------------------------------- */

  function cancelCrop() {
    if (!isCropping) return;

    teardownCropUI();

    if (targetImage) {
      targetImage.set({
        angle: preCropTransform.angle,
        flipX: preCropTransform.flipX,
        flipY: preCropTransform.flipY,
        selectable: true,
        evented: true
      });
      targetImage.setCoords();
      canvas.setActiveObject(targetImage);
    }

    canvas.requestRenderAll();

    isCropping = false;
    targetImage = null;
    preCropTransform = null;
    imageBounds = null;

    toggleCropModeUI(false);
    setStatus('Crop cancelled');
  }

  function teardownCropUI() {
    if (cropRect) {
      cropRect.off('moving', handleCropRectTransform);
      cropRect.off('scaling', handleCropRectTransform);
      canvas.remove(cropRect);
      cropRect = null;
    }
    [maskTop, maskBottom, maskLeft, maskRight].forEach(m => {
      if (m) canvas.remove(m);
    });
    maskTop = maskBottom = maskLeft = maskRight = null;
  }

  function toggleCropModeUI(active) {
    btnCrop.classList.toggle('hidden', active);
    btnApplyCrop.classList.toggle('hidden', !active);
    btnCancelCrop.classList.toggle('hidden', !active);

    if (App.UI && typeof App.UI.setEditingLocked === 'function') {
      App.UI.setEditingLocked(active);
    }
  }

  function setStatus(message) {
    if (!statusText) return;
    statusText.textContent = message;
    statusText.style.color = '';
  }

  return {
    init
  };

})();
