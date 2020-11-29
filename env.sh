#!/bin/bash

rm ./env.js

echo "window._env_ = {" >> ./env.js
echo "  STATISTIC_SERVICE_URL: \"${1}\","  >> ./env.js
echo "  IDENTIFICATION_SERVICE_URL: \"${2}\","  >> ./env.js
echo "  CHAT_SERVICE_URL: \"${3}\","  >> ./env.js
echo "  REDIRECT_URL: \"${4}\","  >> ./env.js
echo "  UPDATE_SERVICE_URL: \"${5}\","  >> ./env.js
echo "  INGAME_STATIC_RESOURCES_URL: \"${6}\","  >> ./env.js
echo "  BNET_API_CLIENT_ID: \"${7}\""  >> ./env.js
echo "};" >> ./env.js
