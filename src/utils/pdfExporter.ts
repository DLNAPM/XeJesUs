import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Pre-loads and converts external images in an element to inline Base64 data URLs
 * to ensure html2canvas never fails due to CORS or canvas taint.
 */
async function inlineImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll('img'));
  
  const promises = imgs.map(async (img) => {
    if (!img.src || img.src.startsWith('data:')) return;

    try {
      // Try fetching as blob to create data URL
      const response = await fetch(img.src, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              img.src = reader.result;
            }
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // If CORS or fetch fails, create a canvas fallback to strip taint or suppress error
      try {
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.src = img.src;
        await new Promise((res) => {
          tempImg.onload = res;
          tempImg.onerror = res;
        });
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempImg.width || 400;
        tempCanvas.height = tempImg.height || 300;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempImg, 0, 0);
          img.src = tempCanvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (err) {
        // If image completely fails, leave image or assign clean placeholder
        console.warn("Image inline failed, using original src:", img.src, err);
      }
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Robustly exports a DOM element into a multi-page A4 PDF file.
 */
export async function exportElementToPdf(
  sourceElement: HTMLElement,
  filename: string
): Promise<boolean> {
  let clone: HTMLElement | null = null;

  try {
    // 1. Create a clean, off-screen clone with fixed dimensions to prevent overflow/scroll issues
    clone = sourceElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0px';
    clone.style.width = '800px'; // Standard document width
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.maxHeight = 'none';
    clone.style.transform = 'none';
    clone.style.backgroundColor = '#ffffff';
    clone.style.boxSizing = 'border-box';
    
    document.body.appendChild(clone);

    // 2. Pre-inline all images to avoid canvas taint / CORS failures
    await inlineImages(clone);

    // Wait a brief moment for layout settling
    await new Promise((res) => setTimeout(res, 250));

    // 3. Render canvas via html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Failed to capture valid document canvas");
    }

    // 4. Construct Multi-Page A4 PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10;
    const printableWidth = pageWidth - margin * 2; // 190mm
    const printableHeight = pageHeight - margin * 2; // 277mm

    // Height of one full PDF page in canvas pixels
    const canvasPageHeight = (printableHeight * canvas.width) / printableWidth;
    const totalPages = Math.ceil(canvas.height / canvasPageHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Height of slice for this page
      const srcY = page * canvasPageHeight;
      const srcH = Math.min(canvasPageHeight, canvas.height - srcY);

      // Create slice canvas
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcH;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, srcY, canvas.width, srcH,
          0, 0, canvas.width, srcH
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
      const destImgHeight = (srcH * printableWidth) / canvas.width;

      pdf.addImage(pageImgData, 'JPEG', margin, margin, printableWidth, destImgHeight);

      // Footer page numbering
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${page + 1} of ${totalPages} • XeJesUs Sanctuary Publication`, margin, pageHeight - 4);
    }

    // 5. Trigger download
    const cleanFileName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFileName);

    return true;
  } catch (err) {
    console.error("PDF Export failed, attempting fallback:", err);

    // Fallback: Trigger browser print window if direct PDF generation fails
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${filename}</title>
              <style>
                body { font-family: Georgia, serif; padding: 20px; color: #0f172a; background: #fff; }
                img { max-width: 100%; height: auto; }
                a { color: #3b82f6; text-decoration: underline; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${sourceElement.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return true;
      }
    } catch (fallbackErr) {
      console.error("Print fallback failed:", fallbackErr);
    }

    alert("Unable to automatically download PDF. Please use the Print button to save as PDF.");
    return false;
  } finally {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}

/**
 * Robustly exports two dedicated DOM elements into an exact 2-Page (Front & Back) A4 PDF file.
 * Page 1 renders onto the front page, and Page 2 renders onto the back page.
 */
export async function exportTwoPagePdf(
  page1Element: HTMLElement,
  page2Element: HTMLElement,
  filename: string
): Promise<boolean> {
  let clone1: HTMLElement | null = null;
  let clone2: HTMLElement | null = null;

  try {
    // 1. Create clean off-screen clones
    const setupClone = (el: HTMLElement) => {
      const c = el.cloneNode(true) as HTMLElement;
      c.style.position = 'absolute';
      c.style.left = '-9999px';
      c.style.top = '0px';
      c.style.width = '800px';
      c.style.height = 'auto';
      c.style.overflow = 'visible';
      c.style.maxHeight = 'none';
      c.style.transform = 'none';
      c.style.backgroundColor = '#ffffff';
      c.style.boxSizing = 'border-box';
      document.body.appendChild(c);
      return c;
    };

    clone1 = setupClone(page1Element);
    clone2 = setupClone(page2Element);

    // 2. Pre-inline images to prevent CORS failures
    await Promise.all([inlineImages(clone1), inlineImages(clone2)]);

    await new Promise((res) => setTimeout(res, 250));

    // 3. Render canvases
    const [canvas1, canvas2] = await Promise.all([
      html2canvas(clone1, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      }),
      html2canvas(clone2, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      })
    ]);

    // 4. Construct 2-Page A4 PDF (Front and Back)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    // --- Page 1 (Front) ---
    const destHeight1 = Math.min(printableHeight, (canvas1.height * printableWidth) / canvas1.width);
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData1, 'JPEG', margin, margin, printableWidth, destHeight1);
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text("Page 1 of 2 (Front) • XeJesUs Sanctuary Publication • Biblical Antiquity & Sacred Origins", margin, pageHeight - 4);

    // --- Page 2 (Back) ---
    pdf.addPage();
    const destHeight2 = Math.min(printableHeight, (canvas2.height * printableWidth) / canvas2.width);
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData2, 'JPEG', margin, margin, printableWidth, destHeight2);
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text("Page 2 of 2 (Back) • XeJesUs Sanctuary Publication • Demographics, Challenges & Prophetic Destiny", margin, pageHeight - 4);

    const cleanFileName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFileName);

    return true;
  } catch (err) {
    console.error("2-Page PDF Export failed, triggering print fallback:", err);
    window.print();
    return false;
  } finally {
    if (clone1 && clone1.parentNode) clone1.parentNode.removeChild(clone1);
    if (clone2 && clone2.parentNode) clone2.parentNode.removeChild(clone2);
  }
}

