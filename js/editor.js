window.activeImage = null;
window.originalFile = null;

// Handle file selection from input
window.handleImageUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        window.originalFile = f.target.result;
        window.loadImage(f.target.result, true);
    };
    reader.readAsDataURL(file);
};

// Load the image onto the Fabric canvas
window.loadImage = function(url, isNew = false) {
    fabric.Image.fromURL(url, function(img) {
        if (window.activeImage && isNew) {
            window.canvas.remove(window.activeImage);
        }
        
        window.activeImage = img;
        
        // Scale the image so it fits nicely within 80% of the A4 canvas
        const scale = Math.min((794 * 0.8) / img.width, (1123 * 0.8) / img.height);
        img.set({
            scaleX: scale,
            scaleY: scale,
            originX: 'center',
            originY: 'center',
            left: 794 / 2,
            top: 1123 / 2,
            cornerColor: '#2563eb',
            cornerStrokeColor: '#ffffff',
            transparentCorners: false,
            borderColor: '#2563eb',
            cornerSize: 12
        });

        window.canvas.add(img);
        window.canvas.setActiveObject(img);
        window.canvas.renderAll();
        
        // Update UI states
        document.getElementById('a4Placeholder').classList.add('hidden');
        document.getElementById('statusText').textContent = "Image loaded";
        window.enableUI();
        window.syncUIWithObject(img);
    });
};

// Reset all edits back to the original uploaded file
window.resetEdits = function() {
    if (!window.originalFile) return;
    window.canvas.clear();
    window.canvas.backgroundColor = '#ffffff';
    window.loadImage(window.originalFile, true);
    
    // Reset UI Inputs
    document.getElementById('inputBrightness').value = 0;
    document.getElementById('inputContrast').value = 0;
    document.getElementById('inputSaturation').value = 0;
    document.getElementById('inputOpacity').value = 100;
    document.getElementById('inputGrayscale').checked = false;
    
    window.updateFilters();
};

window.rotateImage90 = function() {
    if (!window.activeImage) return;
    let newAngle = (window.activeImage.angle + 90) % 360;
    window.activeImage.set('angle', newAngle);
    window.canvas.renderAll();
    window.syncUIWithObject(window.activeImage);
};

window.flipImage = function(axis) {
    if (!window.activeImage) return;
    if (axis === 'H') {
        window.activeImage.set('flipX', !window.activeImage.flipX);
    } else {
        window.activeImage.set('flipY', !window.activeImage.flipY);
    }
    window.canvas.renderAll();
};