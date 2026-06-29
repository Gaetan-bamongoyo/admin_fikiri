# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

FROM base AS build
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.json turbo.json ./
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter @fikiri/api
RUN pnpm --filter @fikiri/api build
RUN pnpm deploy --filter @fikiri/api --prod /prod/api

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7540

RUN apk add --no-cache dumb-init \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

COPY --from=build --chown=nestjs:nodejs /prod/api ./

USER nestjs
EXPOSE 7540

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
