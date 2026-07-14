window.updateFilters = function() {
    if (!window.activeImage) return;
    
    const img = window.activeImage;
    img.filters = []; // Clear existing filters

    // Get current values from sliders
    const brightness = parseInt(document.getElementById('inputBrightness').value) / 100;
    const contrast = parseInt(document.getElementById('inputContrast').value) / 100;
    const saturation = parseInt(document.getElementById('inputSaturation').value) / 100;
    const grayscale = document.getElementById('inputGrayscale').checked;

    // Apply Fabric.js filters
    if (brightness !== 0) {
        img.filters.push(new fabric.Image.filters.Brightness({ brightness }));
    }
    if (contrast !== 0) {
        img.filters.push(new fabric.Image.filters.Contrast({ contrast }));
    }
    if (saturation !== 0) {
        img.filters.push(new fabric.Image.filters.Saturation({ saturation }));
    }
    if (grayscale) {
        img.filters.push(new fabric.Image.filters.Grayscale());
    }

    img.applyFilters();
    window.canvas.renderAll();
};

window.updateOpacity = function() {
    if (!window.activeImage) return;
    const opacity = parseInt(document.getElementById('inputOpacity').value) / 100;
    window.activeImage.set('opacity', opacity);
    window.canvas.renderAll();
};