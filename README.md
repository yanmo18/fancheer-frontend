# Fancheer Frontend

Fancheer 博主个人展示站 — Vue 3 + Vite 前端。

## 技术栈

- Vue 3 + TypeScript
- Vue Router + Pinia
- Axios
- Vite 开发代理（对接后端 API）

## 快速开始

**先启动后端**（默认 `http://localhost:3001`）：

```bash
cd ../fancheer-backend
pnpm dev
```

**再启动前端**：

```bash
pnpm install
pnpm dev
```

浏览器访问：http://localhost:5173

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 首页（博主资料、Banner、音乐播放器、荣誉、活动、图集） |
| `/login` | 登录 |
| `/register` | 注册 |
| `/messages` | 留言板（公开 / 私信、举报、博主回复） |
| `/profile` | 个人中心（昵称、预设头像） |
| `/checkin` | 每日打卡 |
| `/admin` | 管理概览 |
| `/admin/streamer` | 博主资料 |
| `/admin/banners` | Banner 管理 |
| `/admin/songs` | 音乐管理 |
| `/admin/activities` | 活动管理 |
| `/admin/gallery` | 图集管理 |
| `/admin/awards` | 荣誉管理 |
| `/admin/users` | 用户管理 |
| `/admin/messages` | 留言与举报 |
| `/admin/sensitive-words` | 敏感词 |
| `/admin/avatars` | 预设头像 |
| `/admin/logs` | 操作日志 |

## 测试账号

密码均为 `123456`：`fan001`（访客）、`admin`（协管员）、`streamer`（站主）

## 目录

```
src/
├── api/          # 接口封装
├── stores/       # Pinia 状态
├── router/       # 路由
├── views/        # 页面
├── layouts/      # 布局
├── components/   # 组件
└── utils/        # 工具函数
```

## 构建

```bash
pnpm build
pnpm preview
```

## 生产部署提示

- 构建产物在 `dist/`
- 需将 `/api` 与 `/uploads` 反向代理到后端，或配置同域部署
- 开发环境代理见 `vite.config.ts`
