FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/cms/package.json apps/cms/package.json
COPY apps/kos/package.json apps/kos/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace=apps/cms

FROM node:24-alpine AS runner

WORKDIR /app/apps/cms
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/cms/public ./public
COPY --from=builder /app/apps/cms/.next/standalone /app/
COPY --from=builder /app/apps/cms/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
