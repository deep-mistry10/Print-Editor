window.cropRect = null;

window.startCrop = function() {
    if (!window.activeImage) return;
    
    const img = window.activeImage;
    window.cropRect = new fabric.Rect({
        fill: 'rgba(0, 0, 0, 0.4)',
        originX: 'center',
        originY: 'center',
        left: img.left,
        top: img.top,
        width: img.getScaledWidth() * 0.8,
        height: img.getScaledHeight() * 0.8,
        cornerColor: '#dc2626',
        cornerStrokeColor: '#ffffff',
        borderColor: '#dc2626',
        cornerSize: 12,
        transparentCorners: false,
        hasRotatingPoint: false
    });

    window.canvas.add(window.cropRect);
    window.canvas.setActiveObject(window.cropRect);
    window.toggleCropUI(true);
};

window.applyCrop = function() {
    if (!window.cropRect || !window.activeImage) return;

    // Make crop box invisible to take a clean snapshot of the area beneath it
    window.cropRect.set('fill', 'transparent');
    window.canvas.discardActiveObject();
    window.canvas.renderAll();

    const rect = window.cropRect.getBoundingRect();
    
    // Extract only the cropped area from the canvas
    const croppedDataUrl = window.canvas.toDataURL({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        format: 'jpeg',
        quality: 1
    });

    // Clean up crop tool
    window.canvas.remove(window.cropRect);
    window.cropRect = null;
    window.toggleCropUI(false);

    // Load the new cropped portion as the main image
    window.loadImage(croppedDataUrl, true);
};

window.cancelCrop = function() {
    if (window.cropRect) {
        window.canvas.remove(window.cropRect);
        window.cropRect = null;
    }
    if (window.activeImage) {
        window.canvas.setActiveObject(window.activeImage);
    }
    window.toggleCropUI(false);
};