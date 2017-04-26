FROM node:7-slim

RUN useradd -m app
COPY . /home/app/uriteller
RUN chown -R app:app /home/app/uriteller

USER app
WORKDIR /home/app/uriteller
RUN yarn --production --no-progress --no-emoji && yarn cache clean

ENV NODE_ENV production
CMD yarn start
