document.addEventListener('DOMContentLoaded', () => {
    // File Upload Mapping
    document.getElementById('btnOpenImage').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', window.handleImageUpload);

    // Toolbar Buttons
    document.getElementById('btnRotate').addEventListener('click', window.rotateImage90);
    document.getElementById('btnFlipH').addEventListener('click', () => window.flipImage('H'));
    document.getElementById('btnFlipV').addEventListener('click', () => window.flipImage('V'));
    document.getElementById('btnReset').addEventListener('click', window.resetEdits);
    document.getElementById('btnPrint').addEventListener('click', window.printCanvas);

    // Crop Mode Buttons
    document.getElementById('btnCrop').addEventListener('click', window.startCrop);
    document.getElementById('btnApplyCrop').addEventListener('click', window.applyCrop);
    document.getElementById('btnCancelCrop').addEventListener('click', window.cancelCrop);

    // Transform Sliders
    setupRange('inputRotation', 'valRotation', '°', (val) => {
        if (window.activeImage && !window.cropRect) {
            window.activeImage.set('angle', parseInt(val));
            window.canvas.renderAll();
        }
    });
    
    setupRange('inputScale', 'valScale', '%', (val) => {
        if (window.activeImage && !window.cropRect) {
            window.activeImage.scale(parseInt(val) / 100);
            window.canvas.renderAll();
        }
    });

    // Filter Sliders
    const filterIds = ['inputBrightness', 'inputContrast', 'inputSaturation'];
    filterIds.forEach(id => {
        const valId = id.replace('input', 'val'); // Maps 'inputBrightness' to 'valBrightness'
        setupRange(id, valId, '', () => window.updateFilters());
    });

    setupRange('inputOpacity', 'valOpacity', '%', () => window.updateOpacity());
    document.getElementById('inputGrayscale').addEventListener('change', window.updateFilters);
});

// Helper function to link a range input with its display label
function setupRange(inputId, valId, unit, callback) {
    const input = document.getElementById(inputId);
    const valDisplay = document.getElementById(valId);
    
    input.addEventListener('input', (e) => {
        valDisplay.textContent = `${e.target.value}${unit}`;
        callback(e.target.value);
    });
}

// Enable controls only after an image is uploaded
window.enableUI = function() {
    const buttons = ['btnCrop', 'btnRotate', 'btnFlipH', 'btnFlipV', 'btnReset', 'btnPrint'];
    buttons.forEach(id => document.getElementById(id).removeAttribute('disabled'));

    const inputs = [
        'inputRotation', 'inputScale', 'inputBrightness', 
        'inputContrast', 'inputSaturation', 'inputOpacity', 'inputGrayscale'
    ];
    inputs.forEach(id => document.getElementById(id).removeAttribute('disabled'));
};

// Toggle the visibility of crop apply/cancel buttons vs normal toolbar buttons
window.toggleCropUI = function(isCropping) {
    const hideIds = isCropping ? ['btnCrop', 'btnRotate', 'btnFlipH', 'btnFlipV', 'btnReset', 'btnPrint'] : ['btnApplyCrop', 'btnCancelCrop'];
    const showIds = isCropping ? ['btnApplyCrop', 'btnCancelCrop'] : ['btnCrop', 'btnRotate', 'btnFlipH', 'btnFlipV', 'btnReset', 'btnPrint'];

    hideIds.forEach(id => document.getElementById(id).classList.add('hidden'));
    showIds.forEach(id => document.getElementById(id).classList.remove('hidden'));
    
    document.getElementById('statusText').textContent = isCropping ? "Crop Mode" : "Image loaded";
};

// Keeps sidebar slider values accurate if you modify the image with the mouse directly
window.syncUIWithObject = function(obj) {
    if (!obj || window.cropRect) return;
    
    // Sync Rotation Input
    const angle = Math.round(obj.angle % 360);
    const normalizedAngle = angle < 0 ? angle + 360 : angle;
    document.getElementById('inputRotation').value = normalizedAngle;
    document.getElementById('valRotation').textContent = `${normalizedAngle}°`;

    // Sync Scale Input
    const scale = Math.round(obj.scaleX * 100);
    document.getElementById('inputScale').value = scale;
    document.getElementById('valScale').textContent = `${scale}%`;
};