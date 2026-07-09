/**
 * Utilidades puras de manipulación de Canvas para procesamiento de imágenes.
 * Desacopladas del estado de React para permitir testeabilidad unitaria aislada.
 */

export const createCanvas = (width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
};

export function applyAdaptiveThreshold(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    thresholdValue: number,
    inkColorMode: 'blue' | 'black' | 'original'
) {
    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels  = imgData.data;
    const output  = ctx.createImageData(width, height);
    const out     = output.data;
    const radius  = 8;
    const c       = thresholdValue;
    const step    = 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            let sum = 0, count = 0;
            for (let dy = -radius; dy <= radius; dy += step) {
                for (let dx = -radius; dx <= radius; dx += step) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = (ny * width + nx) * 4;
                        sum += 0.299 * pixels[nIdx] + 0.587 * pixels[nIdx + 1] + 0.114 * pixels[nIdx + 2];
                        count++;
                    }
                }
            }
            const avg = sum / count;
            const luma = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
            if (luma > avg - c || luma > 215) {
                out[idx] = 255; out[idx+1] = 255; out[idx+2] = 255; out[idx+3] = 0;
            } else if (inkColorMode === 'blue') {
                out[idx] = 10; out[idx+1] = 50; out[idx+2] = 100; out[idx+3] = 255;
            } else if (inkColorMode === 'black') {
                out[idx] = 0; out[idx+1] = 0; out[idx+2] = 0; out[idx+3] = 255;
            } else {
                const f = 1.6;
                out[idx]   = Math.max(0, Math.min(255, (pixels[idx]   - 128) * f + 128));
                out[idx+1] = Math.max(0, Math.min(255, (pixels[idx+1] - 128) * f + 128));
                out[idx+2] = Math.max(0, Math.min(255, (pixels[idx+2] - 128) * f + 128));
                out[idx+3] = pixels[idx+3];
            }
        }
    }
    ctx.putImageData(output, 0, 0);
}

export async function getCroppedImg(
    image: HTMLImageElement,
    pixelCrop: any,
    rotation: number,
    ctx: CanvasRenderingContext2D,
    customCreateCanvas = createCanvas
): Promise<void> {
    return new Promise(resolve => {
        const { canvas: tmp, ctx: tCtx } = customCreateCanvas(image.width, image.height);
        if (!tCtx) { resolve(); return; }
        
        const rotRad = (rotation * Math.PI) / 180;
        const maxLen = Math.sqrt(image.width ** 2 + image.height ** 2);
        tmp.width = maxLen;
        tmp.height = maxLen;
        
        tCtx.translate(maxLen / 2, maxLen / 2);
        tCtx.rotate(rotRad);
        tCtx.translate(-image.width / 2, -image.height / 2);
        tCtx.drawImage(image, 0, 0);
        
        ctx.drawImage(tmp,
            pixelCrop.x + (maxLen - image.width) / 2,
            pixelCrop.y + (maxLen - image.height) / 2,
            pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        resolve();
    });
}
