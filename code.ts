// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 240, height: 340 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-lines') {
    const { widths, lineGap } = msg;
    
    // Get the selected frame or create a new one if none is selected
    let frame = figma.currentPage.selection[0] as FrameNode;
    if (!frame || frame.type !== 'FRAME') {
      frame = figma.createFrame();
      frame.resize(800, 600);
      frame.x = figma.viewport.center.x - 400;
      frame.y = figma.viewport.center.y - 300;
      frame.name = "Lines Frame";
    }

    const lines: VectorNode[] = [];
    const frameWidth = frame.width;
    const frameHeight = frame.height;
    
    // Calculate number of lines that will fit in the height
    const numberOfLines = Math.floor((frameHeight - lineGap) / lineGap);

    // Track current X position
    let currentX = 0;

    // Process widths (they alternate between column and gap)
    for (let i = 0; i < widths.length; i++) {
      const width = widths[i];
      
      // Check if we've exceeded frame width
      if (currentX >= frameWidth) {
        break; // Stop creating columns if we've exceeded frame width
      }
      
      // Even indices are columns, odd indices are gaps
      if (i % 2 === 0) {
        // Adjust width if it would exceed frame boundaries
        const effectiveWidth = Math.min(width, frameWidth - currentX);
        
        // Create horizontal lines within the column
        for (let lineIndex = 0; lineIndex <= numberOfLines; lineIndex++) {
          const y = lineIndex * lineGap;
          
          // Skip if line would be outside frame height
          if (y > frameHeight) {
            continue;
          }
          
          const line = figma.createVector();
          
          // Set the line points (horizontal line spanning the column)
          await line.setVectorNetworkAsync({
            vertices: [
              { x: currentX, y: y },
              { x: currentX + effectiveWidth, y: y }
            ],
            segments: [
              {
                start: 0,
                end: 1
              }
            ]
          });

          // Style the line
          line.strokes = [{
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 }
          }];
          line.strokeWeight = 1;

          // Add to frame
          frame.appendChild(line);
          lines.push(line);
        }
      }
      
      // Move X position by the width (whether it's a column or gap)
      currentX += width;
    }

    // Select all created lines
    figma.currentPage.selection = lines;
    
    // Notify the user
    const numberOfColumns = Math.ceil(widths.length / 2);
    const truncatedMessage = currentX > frameWidth ? ' (truncated to fit frame)' : '';
    figma.notify(`Created ${lines.length} lines across ${numberOfColumns} columns${truncatedMessage}`);
  }
};
