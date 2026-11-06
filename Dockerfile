# Based on https://nuxt.com/deploy/docker (bun variant)

FROM oven/bun:1 AS build
WORKDIR /app
COPY --link package.json bun.lock ./
# Scripts are skipped here because `postinstall` (nuxt prepare) needs the
# sources; `nuxt build` prepares the project itself
RUN bun install --frozen-lockfile --ignore-scripts
COPY --link . .
RUN bun run build

# Debian-based like the build stage: sharp's native binary is chosen for glibc
# at build time and would not load on Alpine (musl)
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NUXT_STORAGE_DIR=/data
COPY --link --from=build /app/.output ./.output
# Filesystem storage (documents and/or photos) lives here; mount a volume on it
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
