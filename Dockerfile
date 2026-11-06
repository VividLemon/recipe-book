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

# Runs as TrueNAS's `apps` user (568) by default, so a host-path dataset owned
# by `apps` is writable without changing its permissions
ARG APP_UID=568
ARG APP_GID=568

# Defaults for the TrueNAS deployment: documents in MongoDB, photos as files on
# the /data volume. Secrets are not baked in; supply them when the container
# starts: NUXT_MONGODB_URI and NUXT_SESSION_PASSWORD (see deploy/truenas)
ENV NODE_ENV=production \
    NUXT_DOCUMENT_BACKEND=mongodb \
    NUXT_FILE_BACKEND=filesystem \
    NUXT_STORAGE_DIR=/data \
    NUXT_MONGODB_DATABASE=recipeBook

COPY --link --from=build /app/.output ./.output
RUN mkdir -p /data && chown ${APP_UID}:${APP_GID} /data
VOLUME /data
USER ${APP_UID}:${APP_GID}
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
