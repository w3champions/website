#!/bin/bash

sed -i "s+SITE_CDN_URL+$SITE_CDN_URL+g" /usr/share/nginx/html/index.html
sed -i "s+SITE_CDN_URL+$SITE_CDN_URL+g" /usr/share/nginx/html/css/*
sed -i "s+SITE_CDN_URL+$SITE_CDN_URL+g" /usr/share/nginx/html/js/*

sh /usr/share/nginx/html/env.sh $BASE_URL $IDENTIFICATION_URL $REDIRECT_URL $IS_LAUNCHER_ENABLED $LAUNCHER_UPDATE_URL $INGAME_STATIC_RESOURCES_URL $BNET_API_CLIENT_ID $SITE_CDN_URL
sh /etc/s3config/create-config.sh
sh /etc/s3config/sync_assets.sh