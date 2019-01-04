FROM node:10

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN yarn install --prod
COPY . /usr/src/app

EXPOSE 3000

CMD ["/usr/local/bin/npm", "start"]