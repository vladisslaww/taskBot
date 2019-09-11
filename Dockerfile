FROM node:10

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY . ./

USER node

RUN yarn install

COPY --chown=node:node . .

EXPOSE 8080

CMD [ "yarn", "start" ]

