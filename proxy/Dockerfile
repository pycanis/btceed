FROM node:23.4.0-alpine3.20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

EXPOSE 80

CMD ["node", "dist/index.js"]