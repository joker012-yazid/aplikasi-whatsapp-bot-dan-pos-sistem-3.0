FROM node:20-bookworm-slim AS base
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/messaging/package.json packages/messaging/package.json

RUN npm install --include-workspace-root --workspaces

COPY . .

RUN npm run build --workspace @voltura/messaging \
  && npm run build --workspace @voltura/web \
  && npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@voltura/web"]
