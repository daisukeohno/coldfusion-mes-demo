FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200
# 開発用サーバ。/api へのリクエストは proxy.conf.json 経由で api サービスへ転送する
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--proxy-config", "proxy.docker.conf.json"]
