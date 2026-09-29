# GitHub Pages 部署说明

## 公开地址

- 仓库：`GloriaOkita/sages-please-answer`
- 网址：`https://gloriaokita.github.io/sages-please-answer/`

## 部署方式

- `main` 分支每次推送后触发 `.github/workflows/deploy-pages.yml`。
- 工作流先安装依赖并运行全部测试，再执行 `npm run build:pages`。
- Pages 构建使用 `/sages-please-answer/` 作为资源基础路径，人物头像、用户素材和历史朋友圈图片均自动加此前缀。

## 能力边界

GitHub Pages 只托管静态文件，不能运行本地 Vite 中间件 `/api/ai`。Pages 构建会直接使用角色专属离线响应，不请求不存在的接口；本地 `npm run dev` 仍保持原 AI 代理行为。
