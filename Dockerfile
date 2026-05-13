FROM node:22.18.0-alpine3.21 AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Edge 中间件在构建时内联 INVITE_CODE；仅运行时挂载 .env 不会更新门禁逻辑。
# 启用邀请码时请传入与运行时 .env 相同的值，例如：
#   docker build --build-arg INVITE_CODE=your_code -t persona-guide .
ARG INVITE_CODE
ENV INVITE_CODE=$INVITE_CODE

RUN corepack enable pnpm
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV ANALYSIS_STORAGE_DIR=/app/storage

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/storage

EXPOSE 3000

CMD ["node", "server.js"]