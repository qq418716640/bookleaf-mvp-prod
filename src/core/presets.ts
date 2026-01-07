import type { Preset } from './types'

export const PRESETS: Preset[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    background: {
      baseColor: '#F5F3EE',
      noise: { enabled: true, alpha: 0.035, density: 5200, dotSize: 1 },
      vignette: { enabled: false, strength: 0 }
    },
    typography: {
      quoteFontFamily: '"Libre Baskerville", serif',
      quoteFontWeight: 400,
      authorFontFamily: '"Libre Baskerville", serif',
      authorFontWeight: 400,
      quoteColor: '#1F1F1F',
      authorColor: '#666666',
      lineHeight: 1.45,
      maxLineChars: 62
    },
    tone: {
      base: { saturate: 0.94, contrast: 0.97, brightness: 1.00, warmth: 0.06, grain: 0.10 },
      delta: { saturate: -0.06, contrast: -0.05, brightness: -0.02, warmth: 0.08, grain: 0.10 }
    }
  },
  {
    id: 'classic',
    label: 'Classic',
    background: {
      baseColor: '#F2EEE6',
      noise: { enabled: true, alpha: 0.04, density: 6200, dotSize: 1 },
      vignette: { enabled: false, strength: 0 }
    },
    typography: {
      quoteFontFamily: '"Libre Baskerville", serif',
      quoteFontWeight: 400,
      authorFontFamily: '"Libre Baskerville", serif',
      authorFontWeight: 400,
      quoteColor: '#1E1E1E',
      authorColor: '#6A6A6A',
      lineHeight: 1.48,
      maxLineChars: 60
    },
    tone: {
      base: { saturate: 0.95, contrast: 0.98, brightness: 1.00, warmth: 0.08, grain: 0.12 },
      delta: { saturate: -0.06, contrast: -0.06, brightness: -0.02, warmth: 0.10, grain: 0.12 }
    }
  },
  {
    id: 'modern',
    label: 'Modern',
    background: {
      baseColor: '#F6F6F4',
      noise: { enabled: false, alpha: 0.0, density: 0, dotSize: 1 },
      vignette: { enabled: false, strength: 0 }
    },
    typography: {
      quoteFontFamily: 'Inter, system-ui, sans-serif',
      quoteFontWeight: 500,
      authorFontFamily: 'Inter, system-ui, sans-serif',
      authorFontWeight: 400,
      quoteColor: '#1A1A1A',
      authorColor: '#6B6B6B',
      lineHeight: 1.52,
      maxLineChars: 56
    },
    tone: {
      base: { saturate: 1.00, contrast: 1.00, brightness: 1.00, warmth: 0.00, grain: 0.00 },
      delta: { saturate: -0.02, contrast: -0.02, brightness: 0.00, warmth: 0.02, grain: 0.00 }
    }
  },
  {
    id: 'newsprint',
    label: 'Newsprint',
    background: {
      baseColor: '#ECEAE3',
      noise: { enabled: true, alpha: 0.06, density: 9200, dotSize: 2 },
      vignette: { enabled: false, strength: 0 }
    },
    typography: {
      quoteFontFamily: '"Source Serif 4", serif',
      quoteFontWeight: 400,
      authorFontFamily: '"Source Sans 3", sans-serif',
      authorFontWeight: 400,
      quoteColor: '#1B1B1B',
      authorColor: '#585858',
      lineHeight: 1.44,
      maxLineChars: 66
    },
    tone: {
      base: { saturate: 0.85, contrast: 1.02, brightness: 1.00, warmth: 0.04, grain: 0.20 },
      delta: { saturate: -0.10, contrast: 0.02, brightness: -0.02, warmth: 0.06, grain: 0.18 }
    }
  }
]

export function getPreset(id: Preset['id']): Preset {
  const p = PRESETS.find(x => x.id === id)
  if (!p) throw new Error('Unknown preset: ' + id)
  return p
}
