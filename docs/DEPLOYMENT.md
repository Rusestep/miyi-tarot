# GitHub 与 Cloudflare Pages 部署指南

本项目使用 React、TypeScript 和 Vite。Cloudflare Pages 只需要执行一次构建，然后托管 `dist/` 目录中的静态资源。

## 一、推送到 GitHub

```bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin https://github.com/<your-account>/miyi-tarot.git
git push -u origin main
```

仓库需要设为公开，其他人才能直接复制并部署自己的版本。

## 二、创建 Cloudflare Pages 项目

1. 登录 Cloudflare 控制台。
2. 进入 **Workers & Pages**，选择 **Create application**。
3. 选择 **Pages** 和 **Connect to Git**。
4. 授权并选择 GitHub 仓库 `miyi-tarot`。
5. 使用以下构建设置：

| 设置 | 值 |
| --- | --- |
| Project name | `miyi-tarot` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |

6. 如需环境变量，添加 `NODE_VERSION=22`。
7. 保存并开始首次部署。

每次向 `main` 分支推送后，Pages 会自动构建并发布；其他分支和 Pull Request 会生成独立预览地址。

Cloudflare Pages 会自动注入 `CF_PAGES_URL`，构建时会将它写入 Open Graph、Twitter Card 和 canonical 元数据，因此复制项目的人不需要修改 `index.html`。如果绑定了自定义域，可在 Pages 的构建环境变量中添加：

```text
SITE_URL=https://你的域名
```

不设置 `SITE_URL` 也可以正常部署，项目会自动使用 Cloudflare 提供的 `*.pages.dev` 地址。

### 可选：用 Wrangler 直接发布

如果 GitHub App 暂时无法安装，可以使用 Cloudflare 官方 Wrangler 部署同一份 `dist/` 产物：

```bash
npm run build
npx wrangler login --scopes account:read user:read pages:write zone:read --use-keyring
npx wrangler pages project create miyi-tarot --production-branch main
npx wrangler pages deploy dist --project-name miyi-tarot --branch main
```

项目首次上线使用的就是这种方式。直接发布模式下，推送 GitHub 不会自动触发 Pages；后续可以重复最后一条命令，或在 Cloudflare 中改为 Git 集成。

## 三、绑定域名

1. 打开 Pages 项目，进入 **Custom domains**。
2. 选择 **Set up a custom domain**。
3. 输入 `example.com` 并确认。
4. 如果该主机名已有旧的 A、AAAA 或 CNAME 记录，按 Cloudflare 提示移除冲突记录，再由 Pages 创建新的 DNS 绑定。
5. 等待域名状态变为 **Active**，然后访问 `https://example.com/`。

不要继续让旧服务器和 Pages 同时响应同一个子域名，否则不同访问节点可能取得不同版本。

## 四、缓存策略

`public/_headers` 会被 Vite 自动复制到构建输出：

- `/` 与 `/index.html`：不缓存，确保每次部署都能立即取得最新入口。
- `/assets/*`：文件名带内容哈希，缓存一年并标记为 immutable。
- `/cards/*`：牌面缓存 30 天。

因此无需开启 Cloudflare 的“缓存所有内容”规则，也不应为 HTML 入口设置较长的 Edge TTL。

## 五、验证与回滚

部署完成后检查：

```bash
curl -I https://example.com/
curl -I https://example.com/assets/<最新文件名>.js
```

首页应返回 `Cache-Control: no-cache, no-store, must-revalidate`；带哈希的资源应返回长期缓存头。

如需回滚，在 Pages 项目的 **Deployments** 中找到上一个成功版本并选择回滚即可。

## 常见问题

### 根地址仍显示旧版本

- 确认 `example.com` 只绑定到当前 Pages 项目。
- 删除旧服务器的 A/AAAA/CNAME 冲突记录。
- 检查 Cache Rules、Workers Routes 和 Redirect Rules 是否仍拦截该子域名。
- 不要通过旧服务器的 Nginx `proxy_cache` 再代理 Pages。

### 构建失败

- 确认 Node.js 为 22 或更高版本。
- Build command 必须为 `npm run build`。
- Build output directory 必须为 `dist`。
