FROM node:7-alpine

RUN addgroup -S app && adduser -S -G app app
COPY . /home/app/uriteller
RUN chown -R app:app /home/app/uriteller

USER app
WORKDIR /home/app/uriteller
RUN yarn --production --no-progress --no-emoji && yarn cache clean

ARG GA_TRACKING_ID
ENV GA_TRACKING_ID ${GA_TRACKING_ID}

ARG GCLOUD_PROJECT
ENV GCLOUD_PROJECT ${GCLOUD_PROJECT}

ARG APP_BASE_URL
ENV APP_BASE_URL ${APP_BASE_URL}

ENV NODE_ENV production
CMD yarn start
