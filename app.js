/* =========================================================
   app.js
   Application entry point. Initializes every module in the
   correct order once the DOM is ready.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  if (typeof fabric === 'undefined') {
    console.error('Fabric.js failed to load. Check your internet connection or the CDN link in index.html.');
    const status = document.getElementById('statusText');
    if (status) {
      status.textContent = 'Error: Fabric.js failed to load';
      status.style.color = 'var(--color-danger)';
    }
    return;
  }

  const canvas = App.Canvas.init();

  App.Editor.init(canvas);
  App.Crop.init(canvas);
  App.Filters.init(canvas);
  App.Print.init(canvas);
  App.UI.init(canvas);

  console.log('Photo Print Studio initialized — Phase 1 (Layout & Fabric.js core).');
});
