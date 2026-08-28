FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
