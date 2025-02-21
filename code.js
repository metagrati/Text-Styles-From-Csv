// Show UI for CSV upload
figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async function (msg) {
  console.log("Received message from UI:", msg);

  if (msg.type === "import-csv") {
    console.log("CSV Data Received: ", msg.data);

    if (!msg.data || typeof msg.data !== "string") {
      console.error("Invalid CSV data received.");
      return;
    }

    const rows = msg.data.trim().split("\n").slice(1).map(row => row.split(","));

    const ELEMENT_INDEX = 0;
    const FONT_INDEX = 1;
    const SIZE_INDEX = 2;
    const WEIGHT_INDEX = 3;
    const LETTER_SPACING_INDEX = 4;
    const LINE_HEIGHT_INDEX = 5;

    const frame = figma.createFrame();
    frame.name = "Typography Styles";
    frame.layoutMode = "VERTICAL";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "FIXED";
    frame.paddingTop = 32;
    frame.paddingBottom = 32;
    frame.paddingLeft = 32;
    frame.paddingRight = 32;
    frame.itemSpacing = 16;

    let yOffset = 0;
    let maxWidth = 0;

    // Fetch local text styles asynchronously
    const localTextStyles = await figma.getLocalTextStylesAsync();

    for (const row of rows) {
      try {
        const elementName = row[ELEMENT_INDEX] ? row[ELEMENT_INDEX].trim() : "";
        const fontFamily = row[FONT_INDEX] ? row[FONT_INDEX].trim() : "";
        const fontWeight = row[WEIGHT_INDEX] ? row[WEIGHT_INDEX].trim() : "";

        let fontSizeRaw = row[SIZE_INDEX] ? row[SIZE_INDEX].trim() : "";
        let fontSize = fontSizeRaw ? parseFloat(fontSizeRaw.split("-")[0].replace("px", "").replace("+", "")) : 16;

        let letterSpacingRaw = row[LETTER_SPACING_INDEX] ? row[LETTER_SPACING_INDEX].trim() : "0%";
        let letterSpacing = parseFloat(letterSpacingRaw.replace("%", "").replace("+", "")) || 0;

        let lineHeightRaw = row[LINE_HEIGHT_INDEX] ? row[LINE_HEIGHT_INDEX].trim() : "24px";
        let lineHeight = parseFloat(lineHeightRaw.replace("px", ""));

        if (!fontFamily || !fontWeight) {
          console.error(`Skipping row due to missing font data: ${row}`);
          continue;
        }

        console.log(`Loading font: ${fontFamily} - ${fontWeight}`);

        await figma.loadFontAsync({ family: fontFamily, style: fontWeight });

        const existingStyle = localTextStyles.find(style => style.name === elementName);
        if (existingStyle) {
          console.log(`Text style "${elementName}" already exists. Skipping.`);
          continue;
        }

        const textStyle = figma.createTextStyle();
        textStyle.name = elementName;
        textStyle.fontName = { family: fontFamily, style: fontWeight };
        textStyle.fontSize = fontSize;
        textStyle.letterSpacing = { value: letterSpacing, unit: "PERCENT" };
        textStyle.lineHeight = { value: lineHeight, unit: "PIXELS" };

        const text = figma.createText();
        text.name = elementName;
        text.fontName = { family: fontFamily, style: fontWeight };
        text.fontSize = fontSize;
        text.characters = elementName;
        text.letterSpacing = textStyle.letterSpacing;
        text.lineHeight = textStyle.lineHeight;
        text.y = yOffset;

        frame.appendChild(text);
        yOffset += text.height + 16;

        // Calculate the width of the text node
        const textWidth = text.width;
        if (textWidth > maxWidth) {
          maxWidth = textWidth;
        }

      } catch (error) {
        console.error("Error creating text style: ", error);
      }
    }

    // Set the frame's width and height
    frame.resize(maxWidth + frame.paddingLeft + frame.paddingRight, yOffset + frame.paddingTop + frame.paddingBottom);

    figma.currentPage.appendChild(frame);
    figma.viewport.scrollAndZoomIntoView([frame]);
    figma.closePlugin("Text styles and frame created successfully!");
  }
};