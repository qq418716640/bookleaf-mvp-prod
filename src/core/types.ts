export type CanvasRatio = '4:5' | '1:1'
export type TextAlign = 'left' | 'center' | 'right'
export type PresetId = 'editorial' | 'classic' | 'modern'

export type Preset = {
  id: PresetId
  label: string
  // 图片资源路径
  previewImage: string      // 风格选择器缩略图
  backgroundImage: string   // 背景图
  filterImage: string       // Multiply 滤镜叠加图
  // 风格强度默认值
  defaultStrength: number   // 0-100
  // 排版配置
  typography: {
    quoteFontFamily: string
    quoteFontWeight: number
    quoteFontStyle: 'normal' | 'italic'
    quoteSize: number       // 固定字号
    quoteLineHeight: number // 如 1.7
    quoteColor: string
    authorFontFamily: string
    authorFontWeight: number
    authorFontStyle: 'normal' | 'italic'
    authorSize: number
    authorLineHeight: number
    authorColor: string
  }
}
