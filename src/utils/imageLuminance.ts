export interface LuminanceRange {
  min: number;
  max: number;
  avg: number;
}

export function sampleImageLuminance(
  img: CanvasImageSource,
  sampleSize = 24,
): LuminanceRange {
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { min: 0, max: 1, avg: 0.5 };

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

  let min = 1;
  let max = 0;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    if (alpha < 0.1) continue;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    min = Math.min(min, l);
    max = Math.max(max, l);
    sum += l;
    count += 1;
  }

  if (!count) return { min: 0, max: 1, avg: 0.5 };
  return { min, max, avg: sum / count };
}
