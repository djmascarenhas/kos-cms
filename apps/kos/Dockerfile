FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/cms/package.json apps/cms/package.json
COPY apps/kos/package.json apps/kos/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace=apps/kos

FROM node:24-alpine AS runner

WORKDIR /app/apps/kos
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/kos/public ./public
COPY --from=builder /app/apps/kos/.next/standalone /app/
COPY --from=builder /app/apps/kos/.next/static ./.next/static

EXPOSE 3001
CMD ["node", "server.js"]
