import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CanvasRatio, PresetId, TextAlign } from '../core/types'
import { getPreset, PRESETS } from '../core/presets'
import { exportCanvasPNG, renderToCanvas } from '../core/renderer/render'
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
  const [align, setAlign] = useState<TextAlign>('left')
  const [ratio, setRatio] = useState<CanvasRatio>('4:5')
  const [strength, setStrength] = useState<number>(55)

  const preset = useMemo(() => getPreset(presetId), [presetId])

  const normalizedQuote = useMemo(() => {
    const t = normalizeSpaces(quote)
    // MVP: If it's mostly Latin, enforce curly quotes
    if (isLatinText(t)) return toCurlyQuotes(t)
    // otherwise keep as-is
    return t
  }, [quote])

  const normalizedAuthor = useMemo(() => {
    const t = normalizeSpaces(author)
    if (!t) return ''
    // If Latin-ish, add em dash
    if (isLatinText(t)) return formatAuthor(t)
    // For non-Latin, still keep dash behavior (acceptable MVP default)
    return `— ${t}`
  }, [author])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    renderToCanvas(c, {
      quote: normalizedQuote,
      author: normalizedAuthor,
      showAuthor,
      align,
      ratio,
      styleStrength: strength,
      preset,
    })
  }, [normalizedQuote, normalizedAuthor, showAuthor, align, ratio, strength, preset])

  async function onExport() {
    // Ensure web fonts are loaded before export for consistent typography
    // (best-effort; supported in modern browsers)
    // @ts-ignore
    if (document.fonts && document.fonts.ready) {
      // @ts-ignore
      await document.fonts.ready
    }

    if (!canvasRef.current) return
    const blob = await exportCanvasPNG(canvasRef.current)
    downloadBlob(blob, 'bookleaf.png')
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <h1>Bookleaf MVP</h1>
          <p>Turn a quote into a page from a book.</p>
        </div>
        <button className="btn primary" onClick={onExport}>导出 PNG</button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>内容</h2>

          <div className="field">
            <label>Quote（主文本）</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
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
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="可选"
              disabled={!showAuthor}
            />
          </div>

          <h2 style={{ marginTop: 18 }}>风格</h2>
          <div className="field">
            <label>Preset</label>
            <div className="pills">
              {PRESETS.map((p) => (
                <div
                  key={p.id}
                  className={'pill' + (p.id === presetId ? ' active' : '')}
                  onClick={() => setPresetId(p.id)}
                  role="button"
                  tabIndex={0}
                >
                  {p.label}
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
            <div className="small">映射：饱和度 / 对比度 / 亮度 / 暖色调 / 颗粒。</div>
          </div>

          <h2 style={{ marginTop: 18 }}>排版与尺寸</h2>

          <div className="field">
            <label>对齐</label>
            <div className="pills">
              {(['left', 'center'] as TextAlign[]).map((a) => (
                <div
                  key={a}
                  className={'pill' + (a === align ? ' active' : '')}
                  onClick={() => setAlign(a)}
                  role="button"
                  tabIndex={0}
                >
                  {a === 'left' ? '左对齐' : '居中'}
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
                  {r === '4:5' ? '1080×1350 (4:5)' : '1080×1080 (1:1)'}
                </div>
              ))}
            </div>
          </div>

          <div className="footerNote">
            MVP 说明：不做贴纸/图标、不做自由拖拽、不做多区块；所有可变性收敛到 Preset。
          </div>
        </div>

        <div className="card canvasWrap">
          <h2>预览</h2>
          <div className="canvasStage">
            <canvas ref={canvasRef} />
          </div>
          <div className="small">
            预览为实时 Canvas 渲染；导出 PNG 为 sRGB（浏览器默认），无可见水印。
          </div>
        </div>
      </div>
    </div>
  )
}
