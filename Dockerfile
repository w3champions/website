# build stage
FROM node:20-bullseye as build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn run build:prod
COPY key.ts dist/key.ts

# production stage
FROM nginx:stable-alpine as production-stage

# Nginx config
RUN rm -rf /etc/nginx/conf.d
COPY gzip.conf /etc/nginx/conf.d/
COPY default.conf /etc/nginx/conf.d/

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Put env variables into container
WORKDIR /usr/share/nginx/html
COPY env.sh .
RUN apk add --no-cache bash
RUN chmod +x env.sh

RUN apk add --no-cache \
python3 py3-pip \
curl \
which \
bash

RUN pip install python-dateutil python-magic s3cmd --break-system-packages
COPY s3config /etc/s3config
RUN chmod +x /etc/s3config/sync_assets.sh

ADD start.sh /
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/bin/bash", "-c", "/start.sh && nginx -g \"daemon off;\""]
