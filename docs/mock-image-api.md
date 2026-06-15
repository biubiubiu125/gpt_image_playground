# 本地故障模拟 API

这个脚本用于复现浏览器环境里的图片接口异常，重点覆盖跨域、响应结构异常、原始响应查看、原始图片 URL 复制等场景。

## 启动

```powershell
npm run mock:api
```

默认监听：`http://127.0.0.1:8787`。

如需修改端口：

```powershell
$env:MOCK_IMAGE_API_PORT="8788"; npm run mock:api
```

## 当前固定配置下的使用方式

当前版本的服务商类型固定为 `OpenAI 兼容接口`，API URL 在页面里不可手动更改。需要测试本地 mock 服务时，在启动应用前通过默认 API URL 指向对应模拟模式。

PowerShell 示例：

```powershell
$env:VITE_DEFAULT_API_URL="http://127.0.0.1:8787/url-cors-block"; npm run dev
```

设置页里只需要填写任意非空 API Key，例如 `mock`。API 接口选择 `Images API`，模型可以填写任意值，例如 `mock`。

模拟服务会读取请求体里的 `n`，最多返回 10 条结果。把应用里的图片数量调到 2 或更多后，`url-cors-block` 这类模式会一次返回多个图片 URL，可用于测试“原始图片链接”弹窗。

## 可用模式

把上面示例里的 `url-cors-block` 替换成以下模式即可：

- `url-cors-block`：API 请求成功，但返回的图片 URL 没有 CORS 头，浏览器下载图片时失败。
- `url-ok`：API 请求成功，图片 URL 有 CORS 头，应该生成成功。
- `b64`：API 直接返回 `b64_json`，应该生成成功。
- `wrong-shape`：返回类似 `data.url` 的非 OpenAI JSON，不符合 OpenAI `data[]` 结构，应显示“查看原始响应内容”。
- `no-recognizable`：返回 `data[]`，但没有 `url` 或 `b64_json`，应显示“查看原始响应内容”。
- `empty`：返回空 `data[]`，应显示“查看原始响应内容”。
- `url-404`：返回图片 URL，但图片下载 HTTP 404。
- `url-redirect-cors-block`：返回重定向图片 URL，最终图片没有 CORS 头。
- `http-error`：API 返回 HTTP 500 和错误消息。
- `invalid-json`：API 返回非法 JSON。
- `slow`：API 延迟返回，可把配置里的超时时间调低来测试超时。也可以在 URL 后追加 `?delayMs=3000` 调整延迟。
- `api-no-cors`：API 本身不返回 CORS 头，浏览器应在 API 请求阶段失败。
