#!/bin/bash

rm ./env.js

echo "window._env_ = {" >> ./env.js
echo "  BASE_URL: \"${1}\","  >> ./env.js
echo "  REDIRECT_URL: \"${2}\","  >> ./env.js
echo "  FEATURE_FLAG_CLANS: \"${3}\""  >> ./env.js
echo "};" >> ./env.js
