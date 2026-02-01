# syntax=docker/dockerfile:1

FROM node:25-alpine3.23@sha256:f741690269ee7abb07675cb744f0b66ec117b482d89d9565a36f2360d5e2a3ef AS base


FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build


FROM base AS runner

WORKDIR /app

COPY --from=builder /app/.output .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
