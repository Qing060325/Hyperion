# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# 锁定 pnpm 版本，利用 corepack
ARG PNPM_VERSION=10.12.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# 再复制源码
COPY . .
RUN pnpm build

# 清理 node_modules 减少后续层大小（可选）
RUN rm -rf node_modules .git

# ---- Stage 2: Serve ----
FROM nginx:1-alpine

LABEL maintainer="Qing060325"
LABEL description="Hyperion - Clash 内核网页前端"

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/hyperion.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
