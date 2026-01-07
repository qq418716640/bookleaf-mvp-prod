import type { CanvasRatio, Preset, TextAlign } from '../types'
import { drawGrain, drawPaperBase, drawPaperNoise, drawWarmthOverlay } from './paper'
import { measureMaxLineWidthByChars, wrapTextByWidth } from './layout'

export type RenderInput = {
  quote: string
  author?: string
  showAuthor: boolean
  align: TextAlign
  ratio: CanvasRatio
  styleStrength: number // 0..100
  preset: Preset
}

// Background cache to avoid regenerating noise/grain on every render
type BackgroundCacheEntry = {
  imageData: ImageData
  key: string
}

let backgroundCache: BackgroundCacheEntry | null = null

function getBackgroundCacheKey(
  w: number,
  h: number,
  dpr: number,
  presetId: string,
  strength: number
): string {
  // Round strength to reduce cache misses during slider drag
  const roundedStrength = Math.round(strength / 5) * 5
  return `${w}:${h}:${dpr}:${presetId}:${roundedStrength}`
}

// Export sizes
const SIZES: Record<CanvasRatio, { w: number; h: number }> = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function computeTone(preset: Preset, strength: number) {
  const t = clamp01(strength / 100)
  const base = preset.tone.base
  const d = preset.tone.delta
  return {
    saturate: base.saturate + d.saturate * t,
    contrast: base.contrast + d.contrast * t,
    brightness: base.brightness + d.brightness * t,
    warmth: base.warmth + d.warmth * t,
    grain: base.grain + d.grain * t,
  }
}

function setCanvasDPR(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  // Cap DPR at 2 to avoid excessive memory/CPU usage on 3x devices
  const dpr = Math.min(2, Math.max(1, Math.floor(window.devicePixelRatio || 1)))
  canvas.style.width = cssW + 'px'
  canvas.style.height = cssH + 'px'
  canvas.width = cssW * dpr
  canvas.height = cssH * dpr
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, dpr }
}

export function renderToCanvas(canvas: HTMLCanvasElement, input: RenderInput) {
  const size = SIZES[input.ratio]
  const { ctx, dpr } = setCanvasDPR(canvas, size.w, size.h)

  const tone = computeTone(input.preset, input.styleStrength)
  const cacheKey = getBackgroundCacheKey(size.w, size.h, dpr, input.preset.id, input.styleStrength)

  // Check if we can use cached background
  if (backgroundCache && backgroundCache.key === cacheKey) {
    // Restore cached background - need to reset transform for putImageData
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.putImageData(backgroundCache.imageData, 0, 0)
    ctx.restore()
  } else {
    // --- Background pipeline (expensive, so we cache it)
    drawPaperBase(ctx, size.w, size.h, input.preset.background.baseColor)

    // paper micro-noise
    if (input.preset.background.noise.enabled) {
      const n = input.preset.background.noise
      // density slightly modulated by strength
      const density = Math.round(n.density * mix(0.9, 1.15, clamp01(input.styleStrength / 100)))
      drawPaperNoise(ctx, size.w, size.h, n.alpha, density, n.dotSize)
    }

    // warmth overlay (subtle)
    drawWarmthOverlay(ctx, size.w, size.h, tone.warmth)

    // grain on top
    drawGrain(ctx, size.w, size.h, tone.grain)

    // Cache the background - need actual pixel dimensions
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    backgroundCache = {
      imageData: ctx.getImageData(0, 0, size.w * dpr, size.h * dpr),
      key: cacheKey,
    }
    ctx.restore()
  }

  // Apply CSS-like filters to entire canvas (including background)
  // by drawing the current content onto itself with filters
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = `contrast(${tone.contrast}) saturate(${tone.saturate}) brightness(${tone.brightness})`
  ctx.drawImage(canvas, 0, 0)
  ctx.restore()

  // Reset transform and filter for text drawing
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.filter = 'none'

  // --- Typography pipeline
  const contentWidth = Math.round(size.w * 0.68)
  const leftX = Math.round((size.w - contentWidth) / 2)

  // Dynamic font sizing based on canvas and quote length (simple + robust)
  const minSize = input.ratio === '1:1' ? 42 : 44
  const maxSize = input.ratio === '1:1' ? 56 : 58
  const len = input.quote.length
  // Longer text -> slightly smaller
  const quoteSize = Math.round(
    Math.max(minSize, Math.min(maxSize, maxSize - (len / 220) * 10))
  )

  const align: 'left' | 'center' = input.align

  // Quote
  ctx.fillStyle = input.preset.typography.quoteColor
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${input.preset.typography.quoteFontWeight} ${quoteSize}px ${input.preset.typography.quoteFontFamily}`

  // Estimate max width by chars, but cap to content width
  const charWidthLimit = measureMaxLineWidthByChars(ctx, input.preset.typography.maxLineChars)
  const maxWidth = Math.min(contentWidth, charWidthLimit)

  const lines = wrapTextByWidth(ctx, input.quote, maxWidth)
  const lineHeightPx = quoteSize * input.preset.typography.lineHeight

  // Vertical layout: center-ish with top/bottom safety margins
  const topPadding = Math.round(size.h * 0.16)
  const bottomPadding = Math.round(size.h * 0.14)
  const maxTextHeight = size.h - topPadding - bottomPadding

  const authorGap = Math.round(lineHeightPx * 1.5)
  const authorSize = Math.round(quoteSize * 0.85)
  const authorLineHeight = authorSize * 1.25

  const quoteBlockHeight = lines.length * lineHeightPx
  const authorBlockHeight = input.showAuthor && input.author ? (authorLineHeight) : 0
  const totalHeight = quoteBlockHeight + (authorBlockHeight ? authorGap + authorBlockHeight : 0)

  // If overflow, reduce font size in a small loop (deterministic)
  let qs = quoteSize
  let finalLines = lines
  let finalLineHeight = lineHeightPx
  let finalTotalHeight = totalHeight

  for (let i = 0; i < 6 && finalTotalHeight > maxTextHeight; i++) {
    qs = Math.max(34, Math.round(qs * 0.92))
    ctx.font = `${input.preset.typography.quoteFontWeight} ${qs}px ${input.preset.typography.quoteFontFamily}`
    const newMaxWidth = Math.min(contentWidth, measureMaxLineWidthByChars(ctx, input.preset.typography.maxLineChars))
    finalLines = wrapTextByWidth(ctx, input.quote, newMaxWidth)
    finalLineHeight = qs * input.preset.typography.lineHeight

    const newAuthorSize = Math.round(qs * 0.85)
    const newAuthorLH = newAuthorSize * 1.25
    const qh = finalLines.length * finalLineHeight
    const ah = input.showAuthor && input.author ? newAuthorLH : 0
    finalTotalHeight = qh + (ah ? Math.round(finalLineHeight * 1.5) + ah : 0)
  }

  const startY = Math.round(topPadding + (maxTextHeight - finalTotalHeight) * 0.38)

  // Draw quote lines
  let y = startY
  for (const line of finalLines) {
    const x = align === 'left' ? leftX : Math.round(size.w / 2)
    ctx.textAlign = align
    ctx.fillStyle = input.preset.typography.quoteColor
    ctx.font = `${input.preset.typography.quoteFontWeight} ${qs}px ${input.preset.typography.quoteFontFamily}`
    ctx.fillText(line, x, y)
    y += finalLineHeight
  }

  // Draw author
  if (input.showAuthor && input.author) {
    y += Math.round(finalLineHeight * 1.5)
    const x = align === 'left' ? leftX : Math.round(size.w / 2)
    ctx.textAlign = align
    ctx.fillStyle = input.preset.typography.authorColor
    const authorFont = input.preset.id === 'newsprint'
      ? `${input.preset.typography.authorFontWeight} ${Math.round(qs * 0.78)}px ${input.preset.typography.authorFontFamily}`
      : `${input.preset.typography.authorFontWeight} italic ${Math.round(qs * 0.82)}px ${input.preset.typography.authorFontFamily}`
    ctx.font = authorFont
    ctx.fillText(input.author, x, y)
  }
}

export async function exportCanvasPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) return reject(new Error('Failed to export canvas'))
      resolve(b)
    }, 'image/png')
  })
}
