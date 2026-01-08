import type { Preset } from './types'

export const PRESETS: Preset[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    previewImage: '/presets/editorial/preview.png',
    backgroundImage: '/presets/editorial/bg.png',
    filterImage: '/presets/editorial/filter.png',
    typography: {
      quoteFontFamily: '"Crimson Text", serif',
      quoteFontWeight: 600,
      quoteFontStyle: 'normal',
      quoteSize: 56,
      quoteLineHeight: 1.7,
      quoteColor: '#333333',
      authorFontFamily: '"Crimson Text", serif',
      authorFontWeight: 600,
      authorFontStyle: 'italic',
      authorSize: 48,
      authorLineHeight: 1.7,
      authorColor: '#333333',
    },
  },
  {
    id: 'classic',
    label: 'Classic',
    previewImage: '/presets/classic/preview.png',
    backgroundImage: '/presets/classic/bg.png',
    filterImage: '/presets/classic/filter.png',
    typography: {
      quoteFontFamily: '"Averia Serif Libre", serif',
      quoteFontWeight: 700,
      quoteFontStyle: 'normal',
      quoteSize: 56,
      quoteLineHeight: 1.7,
      quoteColor: '#333333',
      authorFontFamily: '"Averia Serif Libre", serif',
      authorFontWeight: 700,
      authorFontStyle: 'italic',
      authorSize: 48,
      authorLineHeight: 1.7,
      authorColor: '#333333',
    },
  },
  {
    id: 'modern',
    label: 'Modern',
    previewImage: '/presets/modern/preview.png',
    backgroundImage: '/presets/modern/bg.png',
    filterImage: '/presets/modern/filter.png',
    typography: {
      // 使用 EB Garamond 作为 New Athena Unicode 的替代
      quoteFontFamily: '"EB Garamond", serif',
      quoteFontWeight: 400,
      quoteFontStyle: 'normal',
      quoteSize: 52,
      quoteLineHeight: 1.6,
      quoteColor: '#333333',
      authorFontFamily: '"EB Garamond", serif',
      authorFontWeight: 400,
      authorFontStyle: 'normal',
      authorSize: 40,
      authorLineHeight: 1.6,
      authorColor: '#333333',
    },
  },
]

export function getPreset(id: Preset['id']): Preset {
  const p = PRESETS.find(x => x.id === id)
  if (!p) throw new Error('Unknown preset: ' + id)
  return p
}
