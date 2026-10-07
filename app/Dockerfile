# syntax=docker/dockerfile:1

# Multi-stage build for the cardkeeper web app (Nuxt 3/4 + Prisma + PostgreSQL).
#   runtime  production image (default target)
#   dev      development/test image, the source is bind mounted by docker-compose.dev.yml
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
# Prisma's schema engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
# No telemetry or update checks from the containers.
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    NUXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------------------------
# The dependency and build stages always run on the builder's native platform. The Nitro bundle is
# plain JavaScript (no native binaries), so a multi-arch build does not have to run npm and nuxt
# under QEMU emulation, which would take very long for the arm64 image.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS build-base
WORKDIR /app
RUN apk add --no-cache openssl
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    NUXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------------------------
FROM build-base AS deps
COPY package.json package-lock.json ./
# Install scripts (prisma generate, nuxt prepare) need the sources and run in the build stage.
RUN npm ci --ignore-scripts --no-audit --no-fund

# ---------------------------------------------------------------------------------------------
FROM base AS dev
ENV NODE_ENV=development
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY --chown=node:node . .
EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]

# ---------------------------------------------------------------------------------------------
FROM build-base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---------------------------------------------------------------------------------------------
FROM base AS runtime
LABEL org.opencontainers.image.licenses="PolyForm-Noncommercial-1.0.0"
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    IMAGE_DIR=/data/card-images \
    NODE_OPTIONS=--max-old-space-size=256

# Migration tooling: only the Prisma CLI in its own directory, the app itself is a self-contained
# Nitro bundle. The CLI version is read from package.json so it always matches @prisma/client.
WORKDIR /opt/migrate
COPY package.json /tmp/app-package.json
RUN npm init -y > /dev/null \
    && npm install --omit=dev --no-audit --no-fund \
        "prisma@$(node -p "require('/tmp/app-package.json').devDependencies.prisma")" \
    && rm /tmp/app-package.json
COPY prisma ./prisma
COPY prisma.config.ts ./

WORKDIR /app
COPY --from=build /app/.output ./.output
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /data/card-images \
    && chown -R node:node /data /opt/migrate

USER node
EXPOSE 3000
VOLUME ["/data/card-images"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
