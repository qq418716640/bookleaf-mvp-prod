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
  ctx.save()
  ctx.globalAlpha = alpha
  // Draw in dark and light to simulate paper fiber micro-variation.
  const dots = Math.floor((width * height) / 1_000_000 * density)
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const v = Math.random()
    ctx.fillStyle = v > 0.5 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
    ctx.fillRect(x, y, dotSize, dotSize)
  }
  ctx.restore()
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
  ctx.save()
  const alpha = Math.min(0.08, amount * 0.08)
  ctx.globalAlpha = alpha
  const dots = Math.floor((width * height) / 1_000_000 * (22000 * amount))
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const v = Math.random()
    ctx.fillStyle = v > 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.restore()
}
