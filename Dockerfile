# 使用 Node.js 18 LTS 作为基础镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./
# 如果有 package-lock.json 使用 npm ci，否则使用 npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js 应用
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制完整的 node_modules（standalone 模式需要）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 安装 Prisma CLI（全局安装，确保 npx 可用）
RUN npm install -g prisma

# 确保 nextjs 用户有权限访问所有文件
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
