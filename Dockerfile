# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

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
python py-pip \
curl \
which \
bash

RUN pip install python-dateutil python-magic && \
  curl -L https://github.com/s3tools/s3cmd/releases/download/v2.1.0/s3cmd-2.1.0.zip --output /root/s3cmd-2.1.0.zip && \
  unzip /root/s3cmd-2.1.0.zip -d /root && \
  ln -s /root/s3cmd-2.1.0/s3cmd /usr/bin/s3cmd
COPY s3config /etc/s3config
RUN chmod +x /etc/s3config/sync_assets.sh

ADD start.sh /
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/bin/bash", "-c", "/start.sh && nginx -g \"daemon off;\""]
