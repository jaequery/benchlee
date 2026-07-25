# syntax=docker/dockerfile:1

# ---------- deps ----------
FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# ---------- builder ----------
FROM node:24-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# next build needs *a* DATABASE_URL to typecheck/trace, but Benchlee renders every
# database-backed route dynamically, so nothing connects at build time.
ENV DATABASE_URL=postgres://benchlee:benchlee@db:5432/benchlee
RUN pnpm build

# ---------- runner ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -u 1001 -S nextjs -G nodejs

# Standalone server + its traced node_modules (includes `pg`, which the
# migrate/seed scripts import at runtime).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations, seed fixtures and the ops scripts run inside this image.
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh && mkdir -p /app/storage && chown nextjs:nodejs /app/storage

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "server.js"]
