FROM node:22-alpine

RUN corepack enable
WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "--filter", "@x02/server", "dev"]
