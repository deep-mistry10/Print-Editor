// Initialize Fabric Canvas
window.canvas = new fabric.Canvas('printCanvas', {
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: false // Disable group selection for simplicity
});

// Update the UI sliders when an image is moved or scaled with the mouse
window.canvas.on('selection:created', (e) => window.syncUIWithObject(e.selected[0]));
window.canvas.on('selection:updated', (e) => window.syncUIWithObject(e.selected[0]));
window.canvas.on('object:modified', (e) => window.syncUIWithObject(e.target));