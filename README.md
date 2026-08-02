# 秘仪塔罗（Miyi Tarot）

一款完整收录 78 张 Rider–Waite–Smith 塔罗牌的沉浸式在线抽牌应用。支持单张指引与三张牌阵、正逆位解读、完整牌库浏览，以及根据指针位置实时变化的 3D 倾斜、物理翻牌、动态高光和阴影效果。

## 主要功能

- 完整 78 张牌：22 张大阿尔卡那与 56 张小阿尔卡那
- 单张牌与三张牌阵
- 独立随机抽牌与正逆位
- 中文关键词、指引和完整牌库筛选
- 指针位置驱动的 3D 倾斜、按压、反光与阴影
- 使用浏览器安全的双面翻牌结构，避免正反面错层
- 键盘、触摸屏和响应式布局支持
- 所有抽牌逻辑均在本地浏览器完成，不上传问题或结果

## 技术栈

- React 19
- TypeScript 5.9
- Vite 8
- CSS 3D Transforms 与 CSS Custom Properties
- Cloudflare Pages

这是一个纯前端 React 应用，不需要数据库、Node.js 服务器或运行时 API。生产构建会输出到 `dist/`，非常适合由 Cloudflare Pages 全球 CDN 托管。

## 本地开发

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build    # 类型检查并生成生产构建
npm run preview  # 本地预览生产构建
npm run lint     # 代码检查
npm test         # 构建并运行完整性测试
npm run check    # 依次运行 lint 与 test
```

## 目录结构

```text
src/
  App.tsx          # 抽牌交互与页面组件
  tarot-data.ts    # 78 张牌及中文解读数据
  styles.css       # 视觉系统与物理卡牌效果
  main.tsx         # React 应用入口
public/
  cards/           # 78 张 WebP 牌面
  _headers         # Cloudflare Pages 缓存与安全响应头
docs/
  DEPLOYMENT.md    # GitHub + Cloudflare Pages 部署指南
```

## 部署

Cloudflare Pages 的核心配置：

| 设置 | 值 |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | `22` |

站点地址不写死在源码中。Cloudflare Pages 通过 Git 构建时会自动注入 `CF_PAGES_URL`，项目会据此生成分享图片和 canonical URL；其他平台或本地构建会安全地使用相对地址。

绑定自定义域后，如希望分享卡片和 canonical URL 也使用自定义域，只需在构建环境中添加 `SITE_URL=https://你的域名`，无需修改 `index.html`。

完整步骤与自定义域名配置见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 素材与版权

牌面绘制者为 Pamela Colman Smith，牌组于 1910 年出版，当前所用扫描图来自 Wikimedia Commons 的公有领域资源。具体来源见 [public/cards/SOURCE.md](public/cards/SOURCE.md)。

本项目仅供娱乐与自我反思，不构成医疗、法律、财务或其他专业建议。
