export function drawPaperBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
) {
  ctx.save()
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

export function drawPaperNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number,
  density: number,
  dotSize: 1 | 2,
) {
  if (alpha <= 0 || density <= 0) return

  const w = Math.floor(width)
  const h = Math.floor(height)
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  const dots = Math.floor((w * h) / 1_000_000 * density)
  const baseAlpha = Math.round(alpha * 0.55 * 255)

  for (let i = 0; i < dots; i++) {
    const x = Math.floor(Math.random() * w)
    const y = Math.floor(Math.random() * h)
    const isDark = Math.random() > 0.5
    const color = isDark ? 0 : 255

    // Apply dot (handle dotSize)
    for (let dy = 0; dy < dotSize && y + dy < h; dy++) {
      for (let dx = 0; dx < dotSize && x + dx < w; dx++) {
        const idx = ((y + dy) * w + (x + dx)) * 4
        // Blend with existing pixel
        const a = baseAlpha / 255
        data[idx] = Math.round(data[idx] * (1 - a) + color * a)
        data[idx + 1] = Math.round(data[idx + 1] * (1 - a) + color * a)
        data[idx + 2] = Math.round(data[idx + 2] * (1 - a) + color * a)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function drawWarmthOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  warmth: number, // -1..1
) {
  if (warmth === 0) return
  ctx.save()
  const a = Math.min(0.18, Math.abs(warmth) * 0.18)
  // Warmth: subtle warm overlay; if negative, cool overlay.
  ctx.globalAlpha = a
  ctx.fillStyle = warmth > 0 ? '#f2d3a1' : '#b9d9ff'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

export function drawGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number, // 0..1
) {
  if (amount <= 0) return

  const w = Math.floor(width)
  const h = Math.floor(height)
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  const alpha = Math.min(0.08, amount * 0.08)
  const baseAlpha = Math.round(alpha * 0.6 * 255)
  const dots = Math.floor((w * h) / 1_000_000 * (22000 * amount))

  for (let i = 0; i < dots; i++) {
    const x = Math.floor(Math.random() * w)
    const y = Math.floor(Math.random() * h)
    const isDark = Math.random() > 0.5
    const color = isDark ? 0 : 255

    const idx = (y * w + x) * 4
    const a = baseAlpha / 255
    data[idx] = Math.round(data[idx] * (1 - a) + color * a)
    data[idx + 1] = Math.round(data[idx + 1] * (1 - a) + color * a)
    data[idx + 2] = Math.round(data[idx + 2] * (1 - a) + color * a)
  }

  ctx.putImageData(imageData, 0, 0)
}
