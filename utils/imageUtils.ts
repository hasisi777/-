export const overlayTextOnImage = async (
  imageBase64: string,
  text: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context not found"));
        return;
      }

      // 1. Draw Original Image
      ctx.drawImage(img, 0, 0);

      if (!text) {
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // 2. Configure Text Style
      // Font size relative to image width (approx 9%)
      const fontSize = Math.floor(img.width * 0.09); 
      ctx.font = `700 ${fontSize}px 'Noto Sans KR', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 3. Text Wrapping Logic (Split by spaces)
      const maxWidth = img.width * 0.9;
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + " " + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      // 4. Position Calculation
      const lineHeight = fontSize * 1.3;
      const totalTextHeight = lines.length * lineHeight;
      
      // Center vertically by default
      const startY = (img.height - totalTextHeight) / 2 + (lineHeight / 2);

      // 5. Draw Text with Outline for Readability
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = fontSize * 0.15; // Thick stroke
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black stroke
      ctx.fillStyle = '#ffffff'; // White text

      // Draw each line
      lines.forEach((line, index) => {
        const y = startY + (index * lineHeight) - (totalTextHeight / 2);
        
        // Stroke first (background)
        ctx.strokeText(line, img.width / 2, y);
        // Fill second (foreground)
        ctx.fillText(line, img.width / 2, y);
      });

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = imageBase64;
  });
};