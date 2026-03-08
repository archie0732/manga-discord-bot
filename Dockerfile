FROM oven/bun:latest

ENV TZ=Asia/Taipei

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "run", "dev"]
