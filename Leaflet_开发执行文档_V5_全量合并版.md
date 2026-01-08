# Leaflet 文字海报生成器 · 开发执行文档（V5 全量合并版）

> 本文档为 **V5 全量合并版**：把 V4 的最终决策 + V2 的三个 Preset 详细规格 **合并为单文件**，开发无需来回翻文档。  
> 目标：**可直接交付开发落地执行**。

---

## 1. 产品基础信息（Brand）

- **产品名**：Leaflet  
- **Slogan**：Make words feel published.

---

## 2. 技术选型（已决策）

### 2.1 推荐方案：HTML Canvas 2D（原生）+ 离屏导出（Offscreen/Hidden Canvas）

**结论：优先使用原生 Canvas 2D。**

理由（落地导向）：
1. 需求是「背景图 + Multiply 叠加图 + 文本」：Canvas 2D 原生稳定覆盖。
2. Multiply 可直接用：`ctx.globalCompositeOperation = 'multiply'`，无需 shader。
3. PNG 导出用离屏 canvas 重绘一次即可，简单且输出一致。
4. 避免引入 Konva/Fabric/Pixi 的体积与导出一致性坑。

**实现提醒（重要）**
- **字体加载完成后**再首次渲染/导出，避免 canvas 文本回退字体：  
  - `await document.fonts.ready` 或显式 `FontFace` 加载后再绘制。

---

## 3. 字体（本地静态文件，已确认）

字体文件（命名即权威）：

| Font family | 文件名 | weight | style |
|---|---|---:|---|
| Crimson Text | CrimsonText-SemiBold.ttf | 600 | normal |
| Crimson Text | CrimsonText-SemiBoldItalic.ttf | 600 | italic |
| Averia Serif Libre | AveriaSerifLibre-Bold.ttf | 700 | normal |
| Averia Serif Libre | AveriaSerifLibre-BoldItalic.ttf | 700 | italic |
| New Athena Unicode | athena-unicode.ttf | 400 | normal |

### 3.1 `@font-face`（可直接复制）

```css
@font-face {
  font-family: 'Crimson Text';
  src: url('/fonts/CrimsonText-SemiBold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
}
@font-face {
  font-family: 'Crimson Text';
  src: url('/fonts/CrimsonText-SemiBoldItalic.ttf') format('truetype');
  font-weight: 600;
  font-style: italic;
}

@font-face {
  font-family: 'Averia Serif Libre';
  src: url('/fonts/AveriaSerifLibre-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: 'Averia Serif Libre';
  src: url('/fonts/AveriaSerifLibre-BoldItalic.ttf') format('truetype');
  font-weight: 700;
  font-style: italic;
}

@font-face {
  font-family: 'New Athena Unicode';
  src: url('/fonts/athena-unicode.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}
```

> 建议字体路径：`/public/fonts/`

---

## 4. 布局与尺寸（已确认）

- 控制区最大宽度：**360px**
- 画布预览最大宽度：**800px**
- 左右整体居中布局
- 预览 canvas 需要自动缩放以完整显示（不裁切），但导出用固定分辨率离屏渲染。

---

## 5. 画布比例与导出（已确认）

### 5.1 UI 比例选项
仅保留：
- `1:1`
- `4:5`

UI 中：
- 只显示比例（不显示分辨率）

### 5.2 导出 PNG 分辨率
- 1:1 → **1080 × 1080**
- 4:5 → **1080 × 1350**

> 建议实现：预览用缩放显示；导出用离屏 canvas 按目标分辨率重绘一次再 `toBlob/toDataURL`。

---

## 6. 功能逻辑调整（Core）

### 6.1 移除功能（必须删除）
完全移除以下参数与 UI：
- 色温
- 饱和度
- 对比度
- 颗粒
- 暗角
- 所有图像算法型 slider

### 6.2 新图像实现逻辑（关键）
- 不再做算法滤镜
- **所有风格通过图片叠加实现**
- Multiply 叠加模式
- 用户唯一可调参数：**风格强度（0–100）**
  - 本质：Filter Image 的 opacity（%）
  - 默认：50

---

## 7. 图层结构（必须遵循）

```
Canvas
├─ Background Image（Preset 背景图，cover 填充）
├─ Filter Image（Multiply 叠加，cover 填充）
│    └─ opacity = 风格强度（默认 50）
├─ Text Layer（一个整体 block，垂直居中）
│    ├─ Quote
│    └─ Author
```

---

## 8. 图片填充策略（已决策：cover）

背景图与滤镜叠加图统一使用 **cover**：
- 等比缩放铺满画布
- 多余部分裁切（不留边）

**建议提供一个通用绘制函数：**
- `drawImageCover(ctx, img, canvasW, canvasH)`  
  - `scale = max(canvasW/imgW, canvasH/imgH)`  
  - 居中偏移后绘制

---

## 9. 文本布局规则（已决策：垂直居中）

### 9.1 文本区域宽度
- 文本区域宽度：画布宽度的 **约 75%**

### 9.2 垂直位置
- Quote +（间距）+ Author 作为一个整体 block：**垂直居中显示**

### 9.3 Author 与正文间距
- 间距：**1 行**
- 建议按 Quote 的 line-height 计算一行高度（更一致）

---

## 10. Preset 系统

### 10.1 Preset 列表（已确认）
仅保留：
- Editorial
- Classic
- Modern

❌ 移除：
- Newsprint

### 10.2 Preset 通用交互
- 风格强度 Slider：0–100，默认 50（控制 Filter opacity）
- 对齐切换：
  - Quote：Left / Center
  - Author：Right / Center
- 比例切换：1:1 / 4:5

---

## 11. 风格切换 UI（名称 + 预览图）

当前仅显示风格名称 → 改为 **名称 + 预览缩略图**（使用下方链接）。

### 11.1 预览图资源
- Editorial：https://i.postimg.cc/wxXHc1mY/Editorial_1350.png
- Classic：https://i.postimg.cc/h4LgbXdF/Classic_1350.png
- Modern：https://i.postimg.cc/NG6Y7KHw/Modern_1350.png

### 11.2 UI 形态建议（可执行）
- 列表或 grid 卡片：
  - 左侧：缩略图（建议 64×64 或 72×72，cover）
  - 右侧：风格名称
- 选中态有明显高亮（边框/背景）

**实现提醒：跨域图片与导出**
- 如果这些图片直接从第三方域名加载，导出时可能触发 canvas taint：
  - 方案 A（推荐）：将图片下载到本地静态资源同域托管
  - 方案 B：确保图片源支持 CORS 且 `img.crossOrigin = 'anonymous'`

---

## 12. Preset 全量规格（资源 + 滤镜 + 排版）

> 说明：本节为 V2 的详细规格，已合并进 V5。

---

### 12.1 Editorial

**预览图**
- https://i.postimg.cc/wxXHc1mY/Editorial_1350.png

**背景（Background）**
- https://i.postimg.cc/L8cggqPm/Editorial_bg_1350.png

**滤镜（内部参数，不对用户暴露）**
- https://i.postimg.cc/dtDhWRmY/Editorial_filter_Multiply_1350.png
- 叠加模式：Multiply
- 不透明度：50%（默认）
- 用户可见参数：风格强度（0–100），默认 50

**排版与字体**

Quote（主文本）
- 字体：Crimson Text
- 字重：SemiBold（600）
- 对齐：默认 Left，可切换 Center
- 字号：56
- 行高：170%
- 颜色：#333333

Author（作者）
- 字体：Crimson Text
- 字重：SemiBold Italic（600 italic）
- 对齐：默认 Right，可切换 Center
- 字号：48
- 行高：170%
- 颜色：#333333

间距规则
- 文本区域宽度：画布宽度约 75%
- 作者与正文间距：1 行

---

### 12.2 Classic

**预览图**
- https://i.postimg.cc/h4LgbXdF/Classic_1350.png

**背景（Background）**
- https://i.postimg.cc/T3z55yb3/Classic_bg_1350.png

**滤镜（内部参数，不对用户暴露）**
- https://i.postimg.cc/qMgNmcXp/Classic_filter_Multiply_1350.png
- 叠加模式：Multiply
- 不透明度：50%（默认）
- 用户可见参数：风格强度（0–100），默认 50

**排版与字体**

Quote（主文本）
- 字体：Averia Serif Libre
- 字重：Bold（700）
- 对齐：默认 Left，可切换 Center
- 字号：56
- 行高：170%
- 颜色：#333333

Author（作者）
- 字体：Averia Serif Libre
- 字重：Bold Italic（700 italic）
- 对齐：默认 Right，可切换 Center
- 字号：48
- 行高：170%
- 颜色：#333333

间距规则
- 文本区域宽度：画布宽度约 75%
- 作者与正文间距：1 行

---

### 12.3 Modern

**预览图**
- https://i.postimg.cc/NG6Y7KHw/Modern_1350.png

**背景（Background）**
- https://i.postimg.cc/mgv11c92/Modern_bg_1350.png

**滤镜（内部参数，不对用户暴露）**
- https://i.postimg.cc/Z5Pth241/Modern_filter_Multiply_1350.png
- 叠加模式：Multiply
- 不透明度：50%（默认）
- 用户可见参数：风格强度（0–100），默认 50

**排版与字体**

Quote（主文本）
- 字体：New Athena Unicode
- 字重：Regular（400）
- 对齐：默认 Left，可切换 Center
- 字号：52
- 行高：160%
- 颜色：#333333

Author（作者）
- 字体：New Athena Unicode
- 字重：Regular（400）
- 对齐：默认 Right，可切换 Center
- 字号：40
- 行高：160%
- 颜色：#333333

间距规则
- 文本区域宽度：画布宽度约 75%
- 作者与正文间距：1 行

---

## 13. 导出 PNG（实现要点）

- 所见即所得（含 Multiply 滤镜与文本）
- 无 UI 边框
- 文件格式：PNG

⚠️【待确认（非阻断）】
- 导出文件命名规则（如 `Leaflet_{preset}_{ratio}.png`）

---

## 14. 最终待确认项（仅剩 1 个，非阻断）

1. 导出文件命名规则（可默认 `Leaflet_{preset}_{ratio}.png`）

---

> 文档版本：V5（全量合并）  
> 状态：开发可直接执行  
> 本次更新：合并 V2 Preset 规格到单文件 + 保留 V4 所有最终决策
