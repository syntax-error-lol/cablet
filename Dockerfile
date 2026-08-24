FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npx vite build

ENV NODE_ENV=production
ENV LOCAL_DATA_FILE=/var/data/local-data.json

EXPOSE 4000

CMD ["node", "backend/server.mjs"]