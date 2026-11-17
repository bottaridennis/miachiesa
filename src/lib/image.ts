/**
 * Ridimensiona e comprime un'immagine lato client restituendo un data URL JPEG.
 * Le immagini vengono salvate direttamente nel documento Firestore (limite 1 MiB per documento),
 * quindi teniamo ogni immagine sotto ~180 KB.
 */
export async function resizeImage(file: File, maxSize = 1200, maxBytes = 180_000): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Immagine non valida'));
    i.src = dataUrl;
  });

  let size = maxSize;
  let quality = 0.82;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL('image/jpeg', quality);
    // lunghezza base64 ≈ byte * 4/3
    if (out.length * 0.75 <= maxBytes) return out;
    quality = Math.max(0.5, quality - 0.1);
    size = Math.round(size * 0.85);
  }
  throw new Error("L'immagine è troppo pesante anche dopo la compressione.");
}

/** Stima della dimensione in byte di un documento con immagini base64 */
export function estimateBytes(values: string[]) {
  return values.reduce((acc, v) => acc + (v?.length || 0), 0);
}
