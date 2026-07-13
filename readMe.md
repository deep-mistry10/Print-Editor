# QIFY-Photo Print Studio

QIFY-Photo Print Studio is a responsive, web-based photo editing and printing application[cite: 4]. It allows users to upload an image, apply transformations, adjust visual filters, and crop the image within a fixed A4 paper canvas layout[cite: 4, 11]. The application uses Fabric.js to handle canvas interactions and guarantees a high-resolution output for printing[cite: 4, 9].

## Features

*   **File Upload:** Supports loading single images in `.jpg`, `.jpeg`, `.png`, and `.webp` formats up to 40MB in size[cite: 10].
*   **High-Quality Cropping:** Features an interactive crop tool with a dark mask overlay[cite: 6]. The crop selection maps back to the original full-resolution pixel data to guarantee no quality is lost[cite: 6].
*   **Transformations:** Users can rotate the image in 90° increments, flip it horizontally or vertically, and adjust the exact rotation and scale using sliders or numeric inputs[cite: 7].
*   **Visual Adjustments:** Includes sliders to tweak brightness, contrast, and saturation using WebGL filters[cite: 8]. 
*   **Opacity Control:** Allows adjustment of the image opacity[cite: 8].
*   **Printout Type:** Includes a quick toggle switch to convert the image to Black & White (Grayscale)[cite: 4, 8].
*   **Reset Capability:** A reset button restores the image to its pristine, originally loaded state and neutralizes all applied filters[cite: 7, 8].
*   **High-Resolution Printing:** Generates a 300 DPI raster of the A4 canvas exactly as shown on screen, which is passed to the browser's native print dialog for pixel-perfect physical prints[cite: 9, 11].
*   **Mobile-Friendly UI:** The application interface is responsive, utilizing a fixed bottom toolbar and dynamic canvas scaling for mobile devices[cite: 5].

## Technologies Used

*   **HTML5 / CSS3:** For the application structure, mobile-responsive layout, CSS variables, and print-specific media queries[cite: 4, 5].
*   **Vanilla JavaScript:** The application logic is built using a modular JavaScript pattern[cite: 3].
*   **Fabric.js (v5.3.0):** An external library used to manage the HTML5 canvas, object stacking, and WebGL image filters[cite: 4, 8].

## Project Architecture

The application is split into distinct modules to handle different responsibilities:

*   **`index.html`**: The main entry point containing the UI layout, toolbar SVG icons, and the hidden print area[cite: 4].
*   **`style.css`**: Contains all styling, including accessibility focus states, custom range sliders, the toggle switch, and responsive media queries for mobile and tablet views[cite: 5].
*   **`app.js`**: The application entry point that ensures Fabric.js is loaded and initializes all modules in the correct order[cite: 3].
*   **`js/canvas.js`**: Initializes the Fabric.js canvas[cite: 11]. It defines the A4 paper size (96 DPI for screen preview, 300 DPI for print) and clamps object movement so the image cannot be dragged completely off the paper[cite: 11].
*   **`js/editor.js`**: Owns the "single active image" reference[cite: 7]. It syncs the Transform panel (Width, Height, Rotation, Scale) with the canvas object and handles flipping and 90° rotations[cite: 7].
*   **`js/crop.js`**: Manages the interactive crop mode UI, limits the crop rectangle to the image bounds, and applies the crop to the original image data[cite: 6].
*   **`js/filters.js`**: Manages pixel-level image adjustments[cite: 8]. It attaches filter instances to the active image and handles applying them via animation frames to maintain performance during slider drags[cite: 8].
*   **`js/print.js`**: Handles the print handoff[cite: 9]. It temporarily deselects the image, generates a high-resolution data URL, places it into a hidden print layer sized to physical A4 dimensions, and triggers the print window[cite: 9].
*   **`js/ui.js`**: Wires up all DOM interactions for toolbar buttons, the file input, and the status bar[cite: 10]. It also manages enabling or disabling tools based on whether an image is loaded or if the user is actively cropping[cite: 10].

## How to Run

1. Clone or download the repository to your local machine.
2. Ensure all files (`index.html`, `style.css`, `app.js`, and the `js/` folder) are in the correct directory structure.
3. Open `index.html` in any modern web browser. No local server or build step is required to run the application. (An internet connection is required upon first load to fetch the Fabric.js library via CDN[cite: 3]).