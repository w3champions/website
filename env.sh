#!/bin/bash

echo "window._env_ = {" >> ./env.js
echo "  BASE_URL: \"${1}\""  >> ./env.js
echo "};" >> ./env.js
