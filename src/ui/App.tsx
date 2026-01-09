import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CanvasRatio, PresetId, TextAlign } from '../core/types'
import { getPreset, PRESETS } from '../core/presets'
import {
  exportCanvasJPG,
  getExportFileName,
  preloadPresetImages,
  renderToCanvas,
  renderToCanvasSync,
} from '../core/renderer/render'
import { formatAuthor, isLatinText, normalizeSpaces, toCurlyQuotes } from '../core/utils/text'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const DEFAULT_QUOTE =
  'The most powerful way to change the world is to change the way you see it.'
const DEFAULT_AUTHOR = 'James Baldwin'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [quote, setQuote] = useState(DEFAULT_QUOTE)
  const [author, setAuthor] = useState(DEFAULT_AUTHOR)
  const [showAuthor, setShowAuthor] = useState(true)

  const [presetId, setPresetId] = useState<PresetId>('editorial')
  const [quoteAlign, setQuoteAlign] = useState<TextAlign>('left')
  const [authorAlign, setAuthorAlign] = useState<TextAlign>('right')
  const [ratio, setRatio] = useState<CanvasRatio>('4:5')
  const [strength, setStrength] = useState<number>(getPreset('editorial').defaultStrength)

  // 切换预设时同步更新风格强度
  function handlePresetChange(id: PresetId) {
    setPresetId(id)
    setStrength(getPreset(id).defaultStrength)
  }

  const [isLoading, setIsLoading] = useState(true)
  const [imagesReady, setImagesReady] = useState(false)

  const preset = useMemo(() => getPreset(presetId), [presetId])

  const normalizedQuote = useMemo(() => {
    const t = normalizeSpaces(quote)
    if (isLatinText(t)) return toCurlyQuotes(t)
    return t
  }, [quote])

  const normalizedAuthor = useMemo(() => {
    const t = normalizeSpaces(author)
    if (!t) return ''
    if (isLatinText(t)) return formatAuthor(t)
    return `— ${t}`
  }, [author])

  // 预加载图片
  useEffect(() => {
    async function init() {
      try {
        await document.fonts.ready
        await preloadPresetImages(PRESETS)
        setImagesReady(true)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to preload images:', err)
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // 渲染 Canvas
  const rafIdRef = useRef<number | null>(null)

  const renderInputRef = useRef({
    quote: normalizedQuote,
    author: normalizedAuthor,
    showAuthor,
    quoteAlign,
    authorAlign,
    ratio,
    styleStrength: strength,
    preset,
  })

  renderInputRef.current = {
    quote: normalizedQuote,
    author: normalizedAuthor,
    showAuthor,
    quoteAlign,
    authorAlign,
    ratio,
    styleStrength: strength,
    preset,
  }

  useEffect(() => {
    if (!imagesReady) return

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const c = canvasRef.current
      if (c) {
        // 优先使用同步渲染（图片已缓存）
        const synced = renderToCanvasSync(c, renderInputRef.current)
        if (!synced) {
          // 降级到异步渲染
          renderToCanvas(c, renderInputRef.current)
        }
      }
      rafIdRef.current = null
    })

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [normalizedQuote, normalizedAuthor, showAuthor, quoteAlign, authorAlign, ratio, strength, preset, imagesReady])

  async function onExport() {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }

    if (!canvasRef.current) return
    const blob = await exportCanvasJPG(canvasRef.current, presetId, ratio)
    const filename = getExportFileName(presetId, ratio)
    downloadBlob(blob, filename)
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <h1>Leaflet</h1>
          <p>Make words feel published.</p>
        </div>
        <button className="btn primary" onClick={onExport} disabled={isLoading}>
          导出 JPG
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>内容</h2>

          <div className="field">
            <label>Quote（主文本）</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value.slice(0, 400))}
              maxLength={400}
              placeholder="输入一句话…"
            />
            <div className="small">自动规则：西文将使用弯引号，作者前添加 em dash。</div>
          </div>

          <div className="field">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <label>Author（作者）</label>
              <label className="row" style={{ gap: 6, color: 'rgba(233,233,238,0.85)' }}>
                <input
                  type="checkbox"
                  checked={showAuthor}
                  onChange={(e) => setShowAuthor(e.target.checked)}
                />
                显示作者
              </label>
            </div>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value.slice(0, 50))}
              maxLength={50}
              placeholder="可选"
              disabled={!showAuthor}
            />
          </div>

          <h2 style={{ marginTop: 18 }}>风格</h2>

          {/* 风格选择器 - 带缩略图 */}
          <div className="field">
            <label>Preset</label>
            <div className="preset-grid">
              {PRESETS.map((p) => (
                <div
                  key={p.id}
                  className={'preset-card' + (p.id === presetId ? ' active' : '')}
                  onClick={() => handlePresetChange(p.id)}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={p.previewImage}
                    alt={p.label}
                    className="preset-thumb"
                  />
                  <span className="preset-label">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="kv">
              <label>风格强度（0-100）</label>
              <div className="small">{strength}</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
            />
            <div className="small">控制滤镜叠加层的不透明度。</div>
          </div>

          <h2 style={{ marginTop: 18 }}>排版与尺寸</h2>

          <div className="field">
            <label>Quote 对齐</label>
            <div className="pills">
              {(['left', 'center'] as TextAlign[]).map((a) => (
                <div
                  key={a}
                  className={'pill' + (a === quoteAlign ? ' active' : '')}
                  onClick={() => setQuoteAlign(a)}
                  role="button"
                  tabIndex={0}
                >
                  {a === 'left' ? '左对齐' : '居中'}
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Author 对齐</label>
            <div className="pills">
              {(['right', 'center'] as TextAlign[]).map((a) => (
                <div
                  key={a}
                  className={'pill' + (a === authorAlign ? ' active' : '')}
                  onClick={() => setAuthorAlign(a)}
                  role="button"
                  tabIndex={0}
                >
                  {a === 'right' ? '右对齐' : '居中'}
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>画布比例</label>
            <div className="pills">
              {(['4:5', '1:1'] as CanvasRatio[]).map((r) => (
                <div
                  key={r}
                  className={'pill' + (r === ratio ? ' active' : '')}
                  onClick={() => setRatio(r)}
                  role="button"
                  tabIndex={0}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div className="footerNote">
            Leaflet - Make words feel published.
          </div>
        </div>

        <div className="card canvasWrap">
          <h2>预览</h2>
          <div className="canvasStage">
            {isLoading ? (
              <div className="loading">加载中...</div>
            ) : (
              <canvas ref={canvasRef} />
            )}
          </div>
          <div className="small">
            预览为实时 Canvas 渲染；导出 JPG 为 sRGB，无水印。
          </div>
        </div>
      </div>
    </div>
  )
}
