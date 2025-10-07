FROM node:20-bookworm-slim AS base
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/messaging/package.json packages/messaging/package.json

RUN npm install --include-workspace-root --workspaces

COPY . .

RUN npm run build --workspace @voltura/messaging \
  && npm run build --workspace @voltura/api \
  && npm prune --omit=dev

RUN mkdir -p storage/sessions

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "@voltura/api"]
