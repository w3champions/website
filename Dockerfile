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

EXPOSE 80
CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh $BASE_URL && nginx -g \"daemon off;\""]
