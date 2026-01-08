import type { CanvasRatio, Preset, TextAlign } from '../types'
import { wrapTextByWidth } from './layout'

export type RenderInput = {
  quote: string
  author?: string
  showAuthor: boolean
  quoteAlign: TextAlign
  authorAlign: TextAlign
  ratio: CanvasRatio
  styleStrength: number // 0..100, 控制 filter 图层 opacity
  preset: Preset
}

// 导出尺寸
const SIZES: Record<CanvasRatio, { w: number; h: number }> = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
}

// 图片缓存
const imageCache = new Map<string, HTMLImageElement>()

/**
 * 加载图片并缓存
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * 预加载所有预设图片
 */
export async function preloadPresetImages(presets: Preset[]): Promise<void> {
  const promises: Promise<HTMLImageElement>[] = []
  for (const preset of presets) {
    promises.push(loadImage(preset.backgroundImage))
    promises.push(loadImage(preset.filterImage))
    promises.push(loadImage(preset.previewImage))
  }
  await Promise.all(promises)
}

/**
 * Cover 模式绘制图片（等比缩放铺满，居中裁切）
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number
): void {
  const scale = Math.max(canvasW / img.width, canvasH / img.height)
  const w = img.width * scale
  const h = img.height * scale
  const x = (canvasW - w) / 2
  const y = (canvasH - h) / 2
  ctx.drawImage(img, x, y, w, h)
}

/**
 * 设置 Canvas DPR
 */
function setCanvasDPR(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = Math.min(2, Math.max(1, Math.floor(window.devicePixelRatio || 1)))
  canvas.style.width = cssW + 'px'
  canvas.style.height = cssH + 'px'
  canvas.width = cssW * dpr
  canvas.height = cssH * dpr
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, dpr }
}

/**
 * 主渲染函数
 */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  input: RenderInput
): Promise<void> {
  const size = SIZES[input.ratio]
  const { ctx } = setCanvasDPR(canvas, size.w, size.h)

  // 1. 加载图片
  const [bgImage, filterImage] = await Promise.all([
    loadImage(input.preset.backgroundImage),
    loadImage(input.preset.filterImage),
  ])

  // 2. 绘制背景图（cover 填充）
  drawImageCover(ctx, bgImage, size.w, size.h)

  // 3. 绘制滤镜叠加图（Multiply 模式 + opacity）
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = input.styleStrength / 100
  drawImageCover(ctx, filterImage, size.w, size.h)
  ctx.restore()

  // 4. 绘制文本层
  drawTextLayer(ctx, size.w, size.h, input)
}

/**
 * 同步渲染（用于已缓存图片的快速重绘）
 */
export function renderToCanvasSync(
  canvas: HTMLCanvasElement,
  input: RenderInput
): boolean {
  const bgImage = imageCache.get(input.preset.backgroundImage)
  const filterImage = imageCache.get(input.preset.filterImage)

  if (!bgImage || !filterImage) {
    return false // 图片未缓存，需要异步加载
  }

  const size = SIZES[input.ratio]
  const { ctx } = setCanvasDPR(canvas, size.w, size.h)

  // 绘制背景图
  drawImageCover(ctx, bgImage, size.w, size.h)

  // 绘制滤镜叠加图
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = input.styleStrength / 100
  drawImageCover(ctx, filterImage, size.w, size.h)
  ctx.restore()

  // 绘制文本层
  drawTextLayer(ctx, size.w, size.h, input)

  return true
}

/**
 * 绘制文本层
 */
function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  input: RenderInput
): void {
  const typo = input.preset.typography

  // 文本区域宽度：画布宽度的 75%
  const contentWidth = Math.round(canvasW * 0.75)
  const leftX = Math.round((canvasW - contentWidth) / 2)
  const centerX = Math.round(canvasW / 2)
  const rightX = leftX + contentWidth

  // Quote 字体设置
  const quoteFont = `${typo.quoteFontStyle === 'italic' ? 'italic ' : ''}${typo.quoteFontWeight} ${typo.quoteSize}px ${typo.quoteFontFamily}`
  ctx.font = quoteFont
  ctx.fillStyle = typo.quoteColor
  ctx.textBaseline = 'alphabetic'

  // 文本换行
  const lines = wrapTextByWidth(ctx, input.quote, contentWidth)
  const lineHeightPx = typo.quoteSize * typo.quoteLineHeight

  // Author 设置
  const authorFont = `${typo.authorFontStyle === 'italic' ? 'italic ' : ''}${typo.authorFontWeight} ${typo.authorSize}px ${typo.authorFontFamily}`
  const authorLineHeightPx = typo.authorSize * typo.authorLineHeight

  // 间距：1 行（使用 Quote 的行高）
  const authorGap = lineHeightPx

  // 计算总高度
  const quoteBlockHeight = lines.length * lineHeightPx
  const authorBlockHeight = input.showAuthor && input.author ? authorLineHeightPx : 0
  const totalHeight = quoteBlockHeight + (authorBlockHeight ? authorGap + authorBlockHeight : 0)

  // 垂直居中
  const startY = Math.round((canvasH - totalHeight) / 2) + lineHeightPx * 0.8

  // 绘制 Quote
  ctx.font = quoteFont
  ctx.fillStyle = typo.quoteColor

  let y = startY
  for (const line of lines) {
    if (input.quoteAlign === 'left') {
      ctx.textAlign = 'left'
      ctx.fillText(line, leftX, y)
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(line, centerX, y)
    }
    y += lineHeightPx
  }

  // 绘制 Author
  if (input.showAuthor && input.author) {
    y += authorGap
    ctx.font = authorFont
    ctx.fillStyle = typo.authorColor

    if (input.authorAlign === 'left') {
      ctx.textAlign = 'left'
      ctx.fillText(input.author, leftX, y)
    } else if (input.authorAlign === 'center') {
      ctx.textAlign = 'center'
      ctx.fillText(input.author, centerX, y)
    } else {
      // right 对齐（默认）
      ctx.textAlign = 'right'
      ctx.fillText(input.author, rightX, y)
    }
  }
}

/**
 * 导出 PNG
 */
export async function exportCanvasPNG(
  canvas: HTMLCanvasElement,
  presetId: string,
  ratio: CanvasRatio
): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) return reject(new Error('Failed to export canvas'))
      resolve(b)
    }, 'image/png')
  })
}

/**
 * 生成导出文件名
 */
export function getExportFileName(presetId: string, ratio: CanvasRatio): string {
  return `Leaflet_${presetId}_${ratio.replace(':', 'x')}.png`
}
