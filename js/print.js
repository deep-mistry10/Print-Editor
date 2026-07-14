window.printCanvas = function() {
    // Deselect objects to remove the blue selection bounding boxes
    window.canvas.discardActiveObject();
    window.canvas.renderAll();
    
    // Convert canvas to a high-quality image data URL
    const dataUrl = window.canvas.toDataURL({ 
        format: 'jpeg', 
        quality: 1.0 
    });
    
    const printImg = document.getElementById('printImage');
    printImg.src = dataUrl;
    
    // Wait slightly for the DOM image element to render before printing
    printImg.onload = function() {
        window.print();
    };
};