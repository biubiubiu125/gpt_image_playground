<div align="center">

# 🎨 GPT Image Playground

[![License](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**基于 OpenAI gpt-image-2 API 的图片生成与编辑工具**

提供简洁精美的 Web UI，默认使用 RK API 的 OpenAI 兼容接口，支持 Images API 与 Responses API。<br>
支持文本生图、参考图与遮罩编辑，数据纯本地化存储，带来流畅的历史记录与参数管理体验。

</div>

<br>

> 💡 **提示**：若需调用非 HTTPS 的内网或本地 HTTP API，请使用 GitHub Pages 版本或自行部署，Vercel 部署的体验版绑定的 `.dev` 域名因安全策略通常要求接口必须为 HTTPS。

---

## 📸 界面预览

<details>
<summary><b>点击展开截图展示</b></summary>
<br>

<div align="center">
  <b>桌面端主界面</b><br>
  <img src="docs/images/example_pc_1.jpg" alt="桌面端主界面" />
</div>

<br>

<div align="center">
  <b>任务详情与实际参数</b><br>
  <img src="docs/images/example_pc_2.jpg" alt="任务详情与实际参数" />
</div>

<br>

<div align="center">
  <b>桌面端批量选择</b><br>
  <img src="docs/images/example_pc_3.jpg" alt="桌面端批量选择" />
</div>

<br>

<div align="center">
  <b>桌面端 Agent 模式</b><br>
  <img src="docs/images/example_pc_4.jpg" alt="桌面端 Agent 模式" />
</div>

<br>

<div align="center">
  <b>移动端主界面</b><br>
  <img src="docs/images/example_mb_1.jpg" alt="移动端主界面" width="420" />
</div>

<br>

<div align="center">
  <b>移动端侧滑多选</b><br>
  <img src="docs/images/example_mb_2.jpg" alt="移动端侧滑多选" width="420" />
</div>

</details>

---

## ✨ 核心特性

### 🎨 强大的图像生成与编辑
- **参考图与遮罩**：支持上传最多 16 张参考图（支持剪贴板和拖拽）。内置可视化遮罩编辑器，自动预处理以符合官方分辨率限制。
- **批量与迭代**：支持单次多图生成；一键将满意结果转为参考图，无缝开启下一轮修改。
- **流式生成预览**：`Images API` 与 `Responses API` 模式均支持流式接收中间步骤图像，缓解连接超时问题。

### 🤖 Agent 多轮对话模式
- **多轮对话与上下文记忆**：基于 Responses API 的对话式生成，Agent 会理解上下文并按需调用图像工具；支持 `@` 引用参考图或前面轮次生成的图片，并自动识别上下文中的图片。
- **并发批量生成**：内置 `generate_image_batch` 工具，让 Agent 在一次轮次中并发生成多张关联图像，并通过 `continue_generation` 自动追加新一轮以处理依赖关系。
- **分支与重新生成**：编辑某轮消息重新发送或重新生成某轮消息会产生可切换的分支，引用解析严格限定在当前分支路径内，避免误用其他分支的图片。
- **画廊同步与隔离删除**：Agent 生成的图片会同步到画廊；删除对话默认保留画廊记录，删除画廊任务时也会自动清理对话中残留的图片引用。
- **可选 Web 搜索**：可开启 `web_search` 工具，Agent 会在需要时搜索网络信息并附带引用链接。

### ⚙️ 精细化参数追踪
- **智能尺寸控制**：提供 1K/2K/4K 快速预设，自定义宽高时会自动规整至模型安全范围（16 的倍数、总像素校验等）。
- **实际参数对比**：自动提取 API 响应中真实生效的尺寸、质量、耗时以及**模型改写后的提示词**，与你的请求参数高亮对比。支持定制化的参数列表横向平滑滚动体验。

### 📁 高效历史管理 (纯本地)
- **瀑布流与画廊**：历史任务自动保存，支持按状态过滤、全屏大图预览与快捷下载。
- **快捷批量操作**：桌面端支持鼠标拖拽框选、Ctrl/⌘ 连选，移动端支持顺滑侧滑多选；轻松实现批量收藏与清理。
- **优化的图片查看与下载**：大图预览支持左右滑动切换、移动端长按弹出操作菜单，支持快捷下载与批量下载。
- **极致性能与隐私**：所有记录与图片均存放在浏览器 IndexedDB 中（采用 SHA-256 去重压缩），不经过任何第三方服务器。支持一键打包导出 ZIP 备份。

### 🔌 RK API 配置增强
- **固定服务商**：配置名称固定为 RK API，服务商类型固定为 OpenAI 兼容接口，用户不能在页面切换服务商或修改 API URL。
- **模型配置**：Images API 默认模型为 `gpt-image-2`，Responses API 默认模型为 `gpt-5.5`，用户可按接口模式修改模型 ID。
- **API 代理**：OpenAI 兼容接口可开启同源 `/api-proxy/` 代理，交由 Docker 或本地开发环境转发至真实 API，绕开浏览器 CORS 限制。
- **Codex CLI 兼容模式**：对上游为 Codex CLI 的 API，开启后应用 Codex CLI 实际支持的参数，并将多图生成拆分为并发单图。
- **提示词防改写**：Responses API 会始终在请求文本前加入强制指令防止提示词被改写；开启 Codex CLI 模式后，Images API 也会获得同等保护。
- **智能诊断提示**：当检测到接口异常改写行为或缺少常规参数时，自动提示开启相应的兼容模式。
- **习惯配置**：支持设置提交后清空输入、重启后保留历史输入、临时复用历史任务 API 配置等。

---

## 🚀 部署与使用

支持多种部署与开发方式。无论使用哪种方式，你都可以预设默认的 API 节点。

<details>
<summary><strong>▲ 方式一：Vercel 一键部署 (推荐)</strong></summary>

将当前仓库导入 Vercel 后，Vercel 会自动执行构建并部署静态文件。

**配置默认 API URL**：在 Vercel 项目的 **Settings → Environment Variables** 中添加 `VITE_DEFAULT_API_URL`（如 `https://api.rkai6.com`），然后重新部署即可生效。该地址会在页面中固定显示，用户不可手动更改。

**绑定自定义域名 (国内直连)**：Vercel 默认分配的 `.vercel.app` 域名在国内通常无法直接访问。如果你希望在国内直连访问，请在 Vercel 项目的 **Settings → Domains** 中绑定你自己的域名。

**配置自动更新**：

本项目已在 `vercel.json` 中关闭了默认的自动部署。若需在同步 GitHub 上游代码后自动更新 Vercel 部署：

1. 在 Vercel 项目设置 **Settings -> Git** 的 **Deploy Hooks** 中创建一个名为 `Release` 的 Hook（Branch 填 `main`）并复制生成的 URL。
2. 在你 Fork 的 GitHub 仓库设置 **Settings -> Secrets and variables -> Actions** 中，新建 Secret `VERCEL_DEPLOY_HOOK`，填入刚才的 URL。

此后，每次在 GitHub 点击 **Sync fork** 同步上游，都会自动触发 Vercel 构建部署最新版。

</details>

<details>
<summary><strong>☁️ 方式二：Cloudflare Workers 部署</strong></summary>

项目已内置 Wrangler 配置，可将 Vite 构建产物作为 Cloudflare Workers 静态资源部署。

**1. 登录 Cloudflare**

```bash
npx wrangler login
```

**2. 部署到 Workers**

```bash
npm run deploy:cf
```

部署脚本会先执行 `npm run build`，再通过 `wrangler deploy` 上传 `dist/` 目录。

**配置默认 API URL**：Cloudflare Workers 的环境变量不会自动改写已经构建好的静态文件。若需预设默认 API 地址，请在构建前设置 `VITE_DEFAULT_API_URL` 后再部署。该地址会在页面中固定显示，用户不可手动更改。

```bash
VITE_DEFAULT_API_URL=https://api.rkai6.com npm run deploy:cf
```

PowerShell 示例：

```powershell
$env:VITE_DEFAULT_API_URL="https://api.rkai6.com"; npm run deploy:cf
```

</details>

<details>
<summary><strong>🐳 方式三：Docker 部署</strong></summary>

Docker 部署支持在运行时注入默认配置。你可以直接在服务器上构建镜像，也可以在 CI 中构建后推送到私有镜像仓库。

**环境变量说明：**

- `DEFAULT_API_URL`：设置页面上固定显示的 API 地址（如 `https://api.rkai6.com`）。该地址由部署端决定，用户不能在页面手动更改。
- `API_PROXY_URL`：配置内置代理实际转发到的完整 API 基础地址（仅开启代理时有效）。代理不会自动补 `/v1`，OpenAI 兼容接口通常必须填写到版本前缀，如 `https://api.rkai6.com/v1`。
- `ENABLE_API_PROXY`：设为 `true` 开启容器内置 Nginx 同源代理，用于解决浏览器跨域（CORS）限制。开启后，前端 **API 代理** 开关默认开启，浏览器会请求同源的 `/api-proxy/{接口相对路径}`，再由 Nginx 拼接到 `API_PROXY_URL` 后转发。
- `LOCK_API_PROXY`：设为 `true` 时，在 `ENABLE_API_PROXY=true` 的前提下将前端 **API 代理** 开关强制锁定为开启，用户无法关闭。
- `HOST` / `PORT`：指定容器内 Nginx 监听的地址和端口（默认 `0.0.0.0:80`）。

> ⚠️ **安全警告**：开启 API 代理后，任何人都能将你的服务器作为代理来请求目标 API。建议仅在有访问控制（如 IP 白名单）或本地网络中开启。

> 💡 **隐藏真实 API 地址**：如果不希望用户在前端看到真实的 API 上游地址，可以配合 `ENABLE_API_PROXY=true` 和 `LOCK_API_PROXY=true` 强制所有请求走服务器代理，再将 `API_PROXY_URL` 设为真实的 API 上游地址。此时 `DEFAULT_API_URL` 可填写展示用地址（如 `https://api.rkai6.com`），实际请求目标由服务器侧 `API_PROXY_URL` 决定。

> 💡 **兼容迁移**：旧版本中的 `API_URL` 已拆分为 `DEFAULT_API_URL` 和 `API_PROXY_URL`。容器启动时会自动将遗留的 `API_URL` 作为两个新变量的兜底值，实现无缝兼容。建议更新配置文件，逐步迁移至新变量。

**1. 构建镜像**

在项目根目录执行：

```bash
docker build -f deploy/Dockerfile -t gpt-image-playground:latest .
```

如果服务器使用旧版 Docker legacy builder，且不支持 `FROM --platform=$BUILDPLATFORM` 或 `COPY --chmod`，可使用兼容 Dockerfile：

```Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
ENV VITE_DEFAULT_API_URL=__VITE_DEFAULT_API_URL_PLACEHOLDER__
ENV VITE_API_PROXY_AVAILABLE=__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__
ENV VITE_API_PROXY_LOCKED=__VITE_API_PROXY_LOCKED_PLACEHOLDER__
ENV VITE_DOCKER_DEPLOYMENT=__VITE_DOCKER_DEPLOYMENT_PLACEHOLDER__
ENV VITE_DOCKER_LEGACY_API_URL_USED=__VITE_DOCKER_LEGACY_API_URL_USED_PLACEHOLDER__
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
ENV HOST=0.0.0.0
ENV PORT=80
ENV DEFAULT_API_URL=
ENV API_PROXY_URL=
ENV ENABLE_API_PROXY=false
ENV LOCK_API_PROXY=false
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY deploy/migrate-api-env.envsh /docker-entrypoint.d/05-migrate-api-env.envsh
COPY deploy/inject-api-url.sh /docker-entrypoint.d/40-inject-api-url.sh
RUN chmod +x /docker-entrypoint.d/05-migrate-api-env.envsh /docker-entrypoint.d/40-inject-api-url.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

将上述内容保存为 `Dockerfile.compat` 后构建：

```bash
docker build -f Dockerfile.compat -t gpt-image-playground:latest .
```

Windows 环境打包上传到 Linux 服务器时，需确保 `deploy/*.sh`、`deploy/*.envsh` 与 `deploy/nginx.conf` 为 LF 换行：

```bash
python3 - <<'PY'
from pathlib import Path
for p in [Path('deploy/inject-api-url.sh'), Path('deploy/migrate-api-env.envsh'), Path('deploy/nginx.conf')]:
    p.write_bytes(p.read_bytes().replace(b'\r\n', b'\n').replace(b'\r', b'\n'))
PY
```

**2. Docker CLI 启动**

```bash
docker run -d \
  --name gpt-image-playground \
  --restart unless-stopped \
  -p 8080:80 \
  -e DEFAULT_API_URL=https://api.rkai6.com \
  -e ENABLE_API_PROXY=true \
  -e LOCK_API_PROXY=true \
  -e API_PROXY_URL=https://api.rkai6.com/v1 \
  gpt-image-playground:latest
```

**隐藏真实 API 地址示例（OpenAI 兼容接口）：**

```bash
docker run -d \
  --name gpt-image-playground \
  --restart unless-stopped \
  -p 8080:80 \
  -e DEFAULT_API_URL= \
  -e API_PROXY_URL=https://real-api.example.com/v1 \
  -e ENABLE_API_PROXY=true \
  -e LOCK_API_PROXY=true \
  gpt-image-playground:latest
```

> 上例中设置页的 API URL 为空，实际请求通过代理转发到 `API_PROXY_URL`。

*(注：使用 host 网络时加 `--network host`，修改容器监听端口使用 `-e PORT=28080`)*

**3. Docker Compose 示例**

```yaml
version: "3.8"
services:
  gpt-image-playground:
    build:
      context: .
      dockerfile: deploy/Dockerfile
    image: gpt-image-playground:latest
    container_name: gpt-image-playground
    environment:
      DEFAULT_API_URL: "https://api.rkai6.com"
      ENABLE_API_PROXY: "true"
      LOCK_API_PROXY: "false"
      API_PROXY_URL: "https://api.rkai6.com/v1"
    ports:
      - "8080:80"
    restart: unless-stopped
```

使用本地源码构建并启动时，新版本 Docker Compose 使用：

```bash
docker compose up -d --build --force-recreate
```

旧版 `docker-compose` 使用：

```bash
docker-compose up -d --build --force-recreate
```

如果旧版 `docker-compose 1.29.x` 在重建时出现 `KeyError: 'ContainerConfig'`，可先删除旧容器后再启动：

```bash
docker rm -f gpt-image-playground || true
docker-compose up -d --no-build --force-recreate
```

如果你已经从镜像仓库拉取镜像，不需要本地构建，可删除上方 `build` 配置并保留 `image`。仍然失败时，可绕开 compose 直接运行已经构建好的镜像：

```bash
docker run -d \
  --name gpt-image-playground \
  --restart unless-stopped \
  -p 8080:80 \
  -e DEFAULT_API_URL=https://api.rkai6.com \
  -e ENABLE_API_PROXY=true \
  -e LOCK_API_PROXY=false \
  -e API_PROXY_URL=https://api.rkai6.com/v1 \
  gpt-image-playground:latest
```

**4. 验证部署**

```bash
curl -I http://127.0.0.1:8080/
curl -s http://127.0.0.1:8080/prompts/rk-text-image-prompts.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['totalCount'], d['version'], len(d['chunks']))"
docker logs --tail 50 gpt-image-playground
```

提示词库采用轻量索引 + 分片文件：首次打开只加载 `prompts/rk-text-image-prompts.json`，完整提示词按需从 `prompts/rk-text-image-prompts/chunk-*.json` 继续加载。部署静态文件时不要漏传 `public/prompts/rk-text-image-prompts/` 目录。索引文件建议使用 `no-cache`，分片文件可短期缓存，避免用户一直看到旧版提示词数量。

**5. 更新与回滚**

使用 `latest` 标签时，重新拉取镜像并重启即可更新（如 `docker compose pull && docker compose up -d`）。若需固定版本可使用官方提供的版本号标签（如 `0.2.x`）。

手动部署到服务器目录时，建议先在新目录构建成功，再替换旧目录：

```bash
rm -rf /opt/gpt_image_playground.new
mkdir -p /opt/gpt_image_playground.new
tar -xzf gpt_image_playground_deploy.tgz -C /opt/gpt_image_playground.new
cd /opt/gpt_image_playground.new
docker compose build
cd /opt
rm -rf gpt_image_playground.bak
mv gpt_image_playground gpt_image_playground.bak
mv gpt_image_playground.new gpt_image_playground
cd gpt_image_playground
docker compose up -d --force-recreate
```

</details>

<details>
<summary><strong>💻 方式四：本地开发与静态构建</strong></summary>

**1. 环境准备与启动**

你可以在项目根目录新建 `.env.local` 文件配置默认 API URL（如 `VITE_DEFAULT_API_URL=https://api.rkai6.com`）。该地址会在页面中固定显示，用户不可手动更改。然后安装依赖并启动：

```bash
npm install
npm run dev
```

**2. 本地开发跨域代理 (可选)**

如果在本地开发时遇到浏览器的 CORS 限制，可开启本地代理转发：

```bash
cp dev-proxy.config.example.json dev-proxy.config.json
```

修改 `dev-proxy.config.json`，将 `target` 设置为真实的完整 API 基础地址。代理不会自动补 `/v1`，OpenAI 兼容接口通常必须填写到版本前缀，如 `https://api.example.com/v1`。重启开发服务器后，在页面设置中开启 **API 代理** 即可（请求将被转发如 `http://localhost:5173/api-proxy/... -> target/...`）。此功能仅在 `npm run dev` 阶段生效，不会影响打包产物。

**3. 本地故障模拟 API (可选)**

如果需要复现图片 URL 跨域、接口返回结构异常、原始响应查看等问题，可启动内置模拟服务：

```powershell
npm run mock:api
```

使用方式见 [本地故障模拟 API](docs/mock-image-api.md)。

**4. 构建静态产物**

```bash
npm run build
```

构建输出的文件位于 `dist/` 目录下，可将其部署至任何静态文件服务器（如普通 Nginx、GitHub Pages、Netlify 等）。

</details>

---

## URL 传参快速填充

应用支持通过 URL 查询参数快速填入部分配置，适合创建书签或集成分享。API URL 固定由部署端配置，`apiUrl` 参数会被忽略。

可用参数：
- `?apiKey=sk-xxxx`
- `?apiMode=images` 或 `?apiMode=responses`（未传时默认为 `images`）
- `?model=gpt-image-2`（未传时按 `apiMode` 使用默认模型）
- `?codexCli=true`（开启 Codex CLI 兼容模式）

例如：

```text
https://your-domain.example?apiKey={key}&model={model}
```

```text
http://localhost:5173?apiKey={key}&model={model}
```

---

## 💻 技术栈

<div align="center">
  <br>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS 3" /></a>
  <a href="https://zustand.docs.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" /></a>
  <br>
  <br>
</div>

## 📄 许可证 & 致谢

本项目基于 [MIT License](LICENSE) 开源。

特别致谢：[LINUX DO](https://linux.do)
