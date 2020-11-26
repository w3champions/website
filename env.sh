#!/bin/bash

rm ./env.js

echo "window._env_ = {" >> ./env.js
echo "  BASE_URL: \"${1}\","  >> ./env.js
echo "  IDENTIFICATION_URL: \"${2}\","  >> ./env.js
echo "  REDIRECT_URL: \"${3}\","  >> ./env.js
echo "  LAUNCHER_UPDATE_URL: \"${4}\","  >> ./env.js
echo "  INGAME_STATIC_RESOURCES_URL: \"${5}\","  >> ./env.js
echo "  BNET_API_CLIENT_ID: \"${6}\""  >> ./env.js
echo "};" >> ./env.js
