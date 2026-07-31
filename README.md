# Paperlane

一个可自托管的个人博客与作品集：Next.js 前端、Hono API、S3 兼容 OSS 图片存储。

## 本地启动

1. `cp .env.example .env` 并补全 OSS 信息。
2. `npm install`
3. `npm run dev`

网站在 `http://localhost:3000`，API 在 `http://localhost:8787`。

## 部署

把仓库和生产 `.env` 上传到 Linux 服务器，配置域名与 OSS/CDN 后运行 `docker compose up -d --build`。Nginx 把 `/api/*` 转发给 Hono；用 Caddy 或 Certbot 为域名补上 HTTPS。文章目前在 `packages/content` 中维护，后续接入数据库时只需替换 API 的内容仓库。
