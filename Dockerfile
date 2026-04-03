# build stage
FROM node:24-alpine as build-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile
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
COPY scripts/env.sh .
RUN apk add --no-cache bash
RUN chmod +x env.sh

ADD scripts/start.sh /
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/bin/bash", "-c", "/start.sh && nginx -g \"daemon off;\""]
