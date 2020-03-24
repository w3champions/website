#!/bin/bash

echo "window._env_ = {" >> ./env.js
echo "  STAGE: \"${1}\""  >> ./env.js
echo "};" >> ./env.js
