FROM node:22-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip git ca-certificates \
  && pip3 install semgrep --break-system-packages \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace=scout-backend

FROM deps AS development

COPY backend backend
WORKDIR /app/backend
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM deps AS build

COPY backend backend
WORKDIR /app/backend
RUN npm run build

FROM base AS production

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace=scout-backend --omit=dev
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/.semgrep.yml backend/.semgrep.yml
WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
