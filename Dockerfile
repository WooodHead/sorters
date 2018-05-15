FROM node:8

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN npm install -g yarn

COPY package.json yarn.lock ./
RUN yarn --pure-lockfile --production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
