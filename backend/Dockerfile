# BUILD FOR LOCAL DEVELOPMENT
FROM node:22-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install

COPY . .

RUN npm run build

# PRODUCTION BUILD
FROM node:22-alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install --omit=dev

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
