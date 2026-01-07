export type CanvasRatio = '4:5' | '1:1'
export type TextAlign = 'left' | 'center'
export type PresetId = 'editorial' | 'classic' | 'modern' | 'newsprint'

export type Preset = {
  id: PresetId
  label: string
  background: {
    baseColor: string
    noise: {
      enabled: boolean
      alpha: number // 0-1
      density: number // points per megapixel-ish
      dotSize: 1 | 2
    }
    vignette: {
      enabled: boolean
      strength: number // 0-1
    }
  }
  typography: {
    quoteFontFamily: string
    quoteFontWeight: number
    authorFontFamily: string
    authorFontWeight: number
    quoteColor: string
    authorColor: string
    lineHeight: number
    maxLineChars: number
  }
  tone: {
    // Base values at strength=0
    base: {
      saturate: number // 1 = no change
      contrast: number // 1 = no change
      brightness: number // 1 = no change
      warmth: number // -1..1 (applied as overlay)
      grain: number // 0..1
    }
    // Delta applied when strength=100
    delta: {
      saturate: number
      contrast: number
      brightness: number
      warmth: number
      grain: number
    }
  }
}
