/* =========================================================
   ui.js
   Wires up all DOM interactions: toolbar buttons, file input,
   status bar, and enabling/disabling controls based on whether
   an image is currently loaded.

   Only ONE image is ever allowed on the canvas — loading a new
   one replaces the previous one entirely.
   ========================================================= */

window.App = window.App || {};

App.UI = (function () {

  let canvas = null;

  // Toolbar buttons that require an active image
  const IMAGE_DEPENDENT_BUTTON_IDS = [
    'btnCrop', 'btnRotate', 'btnFlipH', 'btnFlipV', 'btnReset', 'btnPrint'
  ];

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_MB = 40;

  let fileInput, btnOpenImage, statusText, a4Placeholder;
  let btnRotate, btnFlipH, btnFlipV, btnReset;

  function init(fabricCanvas) {
    canvas = fabricCanvas;

    fileInput = document.getElementById('fileInput');
    btnOpenImage = document.getElementById('btnOpenImage');
    statusText = document.getElementById('statusText');
    a4Placeholder = document.getElementById('a4Placeholder');

    btnRotate = document.getElementById('btnRotate');
    btnFlipH = document.getElementById('btnFlipH');
    btnFlipV = document.getElementById('btnFlipV');
    btnReset = document.getElementById('btnReset');

    btnOpenImage.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelected);

    btnRotate.addEventListener('click', () => {
      App.Editor.rotateBy90();
      canvas.setActiveObject(App.Editor.getActiveImage());
    });

    btnFlipH.addEventListener('click', () => {
      App.Editor.flipHorizontal();
    });

    btnFlipV.addEventListener('click', () => {
      App.Editor.flipVertical();
    });

    btnReset.addEventListener('click', () => {
      App.Editor.resetImage();
      if (App.Filters && typeof App.Filters.reset === 'function') {
        App.Filters.reset();
      }
      canvas.setActiveObject(App.Editor.getActiveImage());
      statusText.textContent = 'All edits reset';
      statusText.style.color = '';
    });

    setImageDependentButtonsEnabled(false);
  }

  function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      showError('Unsupported file type. Please upload a JPG, PNG or WEBP image.');
      fileInput.value = '';
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      showError(`Image is too large (${sizeMB.toFixed(1)}MB). Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => loadImageOntoCanvas(evt.target.result, file.name);
    reader.onerror = () => showError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  }

  /**
   * Loads the given data URL as the single Fabric image object on the
   * paper. Removes any previously loaded image first (single-image rule).
   * Scales the image to fit within the paper while preserving full
   * original pixel data for maximum print quality.
   */
  function loadImageOntoCanvas(dataUrl, fileName) {
    fabric.Image.fromURL(dataUrl, (img) => {
      if (!img || !img.width || !img.height) {
        showError('Could not load this image. The file may be corrupted.');
        return;
      }

      // Enforce single image: remove existing objects first.
      canvas.getObjects().forEach(obj => canvas.remove(obj));

      const paper = App.Canvas.getPaperDimensions();
      const marginRatio = 0.9; // fit within 90% of the paper by default
      const maxWidth = paper.width * marginRatio;
      const maxHeight = paper.height * marginRatio;

      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

      img.set({
        left: paper.width / 2,
        top: paper.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        angle: 0,
        flipX: false,
        flipY: false,
        opacity: 1,
        cornerColor: '#2563eb',
        cornerStyle: 'circle',
        cornerSize: 12,
        transparentCorners: false,
        borderColor: '#2563eb',
        borderScaleFactor: 1.5,
        padding: 0,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
        lockUniScaling: true,
        centeredRotation: true
      });

      // Restrict resize handles to the four corners so the image can
      // never be stretched/distorted — only uniformly scaled or rotated.
      img.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        tl: true,
        tr: true,
        bl: true,
        br: true,
        mtr: true
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();

      App.Editor.setActiveImage(img, scale);
      App.Filters.attachToImage(img);

      a4Placeholder.classList.add('hidden');
      statusText.textContent = fileName ? truncateName(fileName) : 'Image loaded';
      setImageDependentButtonsEnabled(true);

      fileInput.value = '';
    }, { crossOrigin: 'anonymous' });
  }

  function setImageDependentButtonsEnabled(enabled) {
    IMAGE_DEPENDENT_BUTTON_IDS.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = !enabled;
    });

    document
      .querySelectorAll('.sidebar input')
      .forEach(el => { el.disabled = !enabled; });
  }

  /**
   * Locks (or unlocks) every tool except Crop itself, used while the
   * user is actively cropping so no conflicting edits can happen at
   * the same time. An image is always present when this is called,
   * so unlocking simply restores normal enabled state.
   */
  function setEditingLocked(locked) {
    const lockableIds = ['btnOpenImage', 'btnRotate', 'btnFlipH', 'btnFlipV', 'btnReset', 'btnPrint'];
    lockableIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = locked;
    });

    document
      .querySelectorAll('.sidebar input')
      .forEach(el => { el.disabled = locked; });
  }

  function truncateName(name, max = 26) {
    return name.length > max ? name.slice(0, max - 3) + '...' : name;
  }

  function showError(message) {
    const previous = statusText.textContent;
    const previousColor = statusText.style.color;

    statusText.textContent = message;
    statusText.style.color = 'var(--color-danger)';

    setTimeout(() => {
      statusText.textContent = previous;
      statusText.style.color = previousColor || '';
    }, 3500);
  }

  return {
    init,
    setEditingLocked
  };

})();
