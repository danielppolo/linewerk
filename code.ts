// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 240, height: 320 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-lines') {
    const { columns, columnGap, lineGap, useCustomWidths, columnWidths } = msg;
    
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
    
    // Determine column widths based on mode
    let effectiveColumnWidths: number[] = [];
    if (useCustomWidths && columnWidths.length > 0) {
      // Use provided custom widths
      effectiveColumnWidths = columnWidths;
      
      // Adjust frame width to fit custom columns if needed
      const totalWidth = columnWidths.reduce((sum: number, width: number) => sum + width, 0) + 
                        (columnGap * (columnWidths.length - 1));
      if (totalWidth > frameWidth) {
        frame.resize(totalWidth, frameHeight);
      }
    } else {
      // Calculate even column widths
      const columnWidth = (frameWidth - (columnGap * (columns - 1))) / columns;
      effectiveColumnWidths = Array(columns).fill(columnWidth);
    }
    
    // Calculate number of lines that will fit in the height
    const numberOfLines = Math.floor((frameHeight - lineGap) / lineGap);

    // Track current X position
    let currentX = 0;

    // Create lines for each column
    for (let col = 0; col < effectiveColumnWidths.length; col++) {
      const columnWidth = effectiveColumnWidths[col];
      
      // Create horizontal lines within the column
      for (let lineIndex = 0; lineIndex <= numberOfLines; lineIndex++) {
        const line = figma.createVector();
        const y = lineIndex * lineGap;
        
        // Set the line points (horizontal line spanning the column)
        await line.setVectorNetworkAsync({
          vertices: [
            { x: currentX, y: y },
            { x: currentX + columnWidth, y: y }
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

      // Move X position to next column
      currentX += columnWidth + columnGap;
    }

    // Select all created lines
    figma.currentPage.selection = lines;
    
    // Notify the user
    const message = useCustomWidths && columnWidths.length > 0
      ? `Created ${lines.length} lines across ${columnWidths.length} custom-width columns`
      : `Created ${lines.length} lines across ${columns} even columns`;
    figma.notify(message);
  }
};
