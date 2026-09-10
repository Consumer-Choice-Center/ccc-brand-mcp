FROM node:22-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS build

WORKDIR /app
RUN npm install --global pnpm@11.7.0

COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile

COPY src ./src
COPY scripts/smoke-test.mjs ./scripts/smoke-test.mjs
COPY data ./data
COPY assets ./assets
RUN pnpm run build && pnpm prune --prod

FROM node:22-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS runtime

ENV NODE_ENV=production \
    CCC_BRAND_WORKSPACE_DIR=/app \
    CCC_BRAND_OUTPUT_DIR=/app/deliverables

WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/data ./data
COPY --from=build --chown=node:node /app/assets ./assets
RUN mkdir /app/deliverables && chown node:node /app/deliverables

USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
