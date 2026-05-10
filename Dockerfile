FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV npm_config_loglevel=warn

COPY package.json package-lock.json ./


FROM base AS dev-deps

RUN npm ci


FROM base AS prod-deps

RUN npm ci


FROM dev-deps AS dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]


FROM prod-deps AS prod

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "app.js"]
