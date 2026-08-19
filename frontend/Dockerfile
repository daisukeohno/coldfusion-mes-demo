FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200
# デモ・検証用の ng serve 開発サーバ (本番配信構成ではない)。
# /api へのリクエストは proxy.docker.conf.json 経由で api サービスへ転送する
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--proxy-config", "proxy.docker.conf.json"]
