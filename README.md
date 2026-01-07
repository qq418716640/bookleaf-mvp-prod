# Bookleaf MVP (Vite + React + Canvas)

> Turn a quote into a page from a book.

## 运行

```bash
npm install
npm run dev
```

打开终端提示的本地地址即可。

## 产出

- 前端本地 Canvas 2D 渲染
- 支持 4 个 Presets：Editorial / Classic / Modern / Newsprint
- 支持：Quote + Author、作者开关、对齐、画布比例切换、风格强度
- PNG 导出：`canvas.toBlob('image/png')`

## 设计与实现说明

- 背景为程序化生成（无外部图片素材，0 版权风险）
- 强度滑杆会插值影响饱和度/对比度/亮度/暖色调/颗粒
- 西文文本默认包裹弯引号，作者前自动加 em dash（—）

## 后续可扩展（不在 MVP）

- 服务端渲染与高质量导出（PDF/CMYK）
- 多语言精细排版（CJK 专用规则）
- Pro：微弱 watermark 开关

## 生产部署（Vercel / Cloudflare Pages）

### Vercel
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- 该项目已包含 `vercel.json` 处理 SPA rewrite 与基础安全头。

### Cloudflare Pages
- Build Command: `npm run build`
- Build Output Directory: `dist`
- 已包含 `public/_redirects`（SPA fallback）与 `public/_headers`（安全头 + 静态资源缓存）。

## PWA
已接入 `vite-plugin-pwa`：
- 自动生成 `manifest.webmanifest`
- Service Worker 自动更新（autoUpdate）
- 图标：`public/icons/icon-192.png`, `public/icons/icon-512.png`

> 说明：如不需要 PWA，可移除 `vite-plugin-pwa` 与 `vite.config.ts` 中的 `VitePWA(...)` 配置。
