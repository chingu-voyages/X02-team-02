FROM node:22-alpine

RUN corepack enable
WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

# Generate the Prisma client without connecting to PostgreSQL.
RUN POSTGRES_USER=generate \
  POSTGRES_PASSWORD=generate \
  POSTGRES_HOST=localhost \
  POSTGRES_PORT=5432 \
  POSTGRES_DB=generate \
  pnpm --filter @x02/server exec prisma generate

EXPOSE 3000

CMD ["pnpm", "--filter", "@x02/server", "dev"]
