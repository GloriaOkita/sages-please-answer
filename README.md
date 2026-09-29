# 先贤请回答

一个模拟朋友圈的历史人物互动作品。用户可以发布自由问题、@好友并设置投票；系统邀请 6-8 位先贤从各自的时代、思想和语言风格出发评论，并进行一组有限的思想交锋。

## 在线体验

[https://gloriaokita.github.io/sages-please-answer/](https://gloriaokita.github.io/sages-please-answer/)

GitHub Pages 版本是纯静态演示，保留发布、投票、@好友、刷新、人物评论、用户追问和人物资料等完整交互。由于 GitHub Pages 不运行服务端，人物内容会自动使用项目内的角色化离线响应；本地开发环境仍可通过 `/api/ai` 使用服务端 AI 代理。

## 本地运行

```bash
npm install
npm run dev
```

验证项目：

```bash
npm test -- --run
npm run build
```

## 主要目录

- `src/`：React 页面、交互和角色生成逻辑
- `src/data/characters.json`：14 位人物结构化数据
- `docs/人物卡/`：彼此隔离的人物语料卡
- `public/assets/`：固定用户素材、人物头像和历史朋友圈图片
- `docs/`：产品需求、交互、视觉和角色规则
- `.github/workflows/`：GitHub Pages 自动部署
