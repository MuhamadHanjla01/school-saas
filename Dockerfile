FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY server/package.json server/package-lock.json ./server/
COPY server/prisma ./server/prisma
RUN npm --prefix server ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/dist ./dist
RUN mkdir -p /data /app/server/public/uploads && chown -R node:node /data /app/server/public/uploads
USER node
ENV NODE_ENV=production PORT=3000 DATABASE_URL=file:/data/erpzo.db UPLOAD_DIR=/data/uploads
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node server/scripts/migrate.js && node server/src/index.js"]
