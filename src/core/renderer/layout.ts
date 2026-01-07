export type LayoutBlock = {
  lines: string[]
  fontSize: number
  lineHeightPx: number
  color: string
  font: string
  align: 'left' | 'center'
}

export function wrapTextByWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    const w = ctx.measureText(test).width
    if (w > maxWidthPx && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export function measureMaxLineWidthByChars(
  ctx: CanvasRenderingContext2D,
  maxChars: number,
): number {
  // Approximate: measure a typical alphabet string to estimate avg width.
  const sample = 'abcdefghijklmnopqrstuvwxyz'
  const sampleWidth = ctx.measureText(sample).width
  const avg = sampleWidth / sample.length
  return avg * maxChars
}
