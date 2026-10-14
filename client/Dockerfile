FROM node:22-alpine

RUN corepack enable
WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

EXPOSE 5173

CMD ["pnpm", "--filter", "@x02/client", "dev", "--", "--host", "0.0.0.0"]
