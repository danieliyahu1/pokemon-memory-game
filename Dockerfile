# syntax=docker/dockerfile:1

# One image carries both halves: the Express/Socket.IO server serves the built
# React bundle itself, so the browser and the websocket share one origin and one
# TLS certificate.

FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# The React app type-imports the game's shared types straight out of the backend
# source tree, so the build stage needs that one file.
COPY backend/src/sharedTypes.ts /app/backend/src/sharedTypes.ts
RUN npm run build

FROM node:24-bookworm-slim AS backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend

# Production dependencies only. The lockfile is what makes this reproducible.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY --from=backend /app/backend/dist ./dist
# index.js resolves the bundle at <backend>/../../frontend/dist.
COPY --from=frontend /app/frontend/dist /app/frontend/dist

RUN chown -R 10001:10001 /app
USER 10001:10001

EXPOSE 7000 9464
CMD ["node", "dist/index.js"]
