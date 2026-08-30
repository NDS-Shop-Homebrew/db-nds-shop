# db-nds-shop/backend - Multi-stage build
# @nds-shop-homebrew/prisma vient de GitHub Packages (npm privé)
# Build avec: docker build --build-arg NPM_TOKEN=... --build-arg DATABASE_URL='mysql://...' .
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++ openssl

# --- Dépendances (avec @nds-shop-homebrew/prisma du registry privé) ---
FROM base AS deps
WORKDIR /app
ARG NPM_TOKEN
ARG DATABASE_URL
# Config npm pour GitHub Packages (secret non copié dans l'image finale)
RUN echo "@nds-shop-homebrew:registry=https://npm.pkg.github.com/" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc
ENV DATABASE_URL=${DATABASE_URL}
COPY package.json package-lock.json* ./
RUN npm ci

# --- Build TS ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=deps /app/node_modules/@nds-shop-homebrew/prisma/generated ./node_modules/@nds-shop-homebrew/prisma/generated
EXPOSE 3001
# Les chemins de stockage et env sont fournis au runtime via docker-compose
CMD ["node", "dist/index.js"]
