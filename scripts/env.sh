#!/bin/bash

rm ./env.js

echo "window._env_ = {" >> ./env.js
echo "  BASE_URL: \"${BASE_URL}\","  >> ./env.js
echo "  IDENTIFICATION_URL: \"${IDENTIFICATION_URL}\","  >> ./env.js
echo "  LAUNCHER_UPDATE_URL: \"${LAUNCHER_UPDATE_URL}\","  >> ./env.js
echo "  INGAME_STATIC_RESOURCES_URL: \"${INGAME_STATIC_RESOURCES_URL}\","  >> ./env.js
echo "  BNET_API_CLIENT_ID: \"${BNET_API_CLIENT_ID}\","  >> ./env.js
echo "  TURNSTILE_SITE_KEY: \"${TURNSTILE_SITE_KEY}\","  >> ./env.js
# Rollout switch for the consolidated search (src/helpers/featureFlags.ts). Written as a bare
# boolean and normalized here: only an explicit "false" turns the new search off.
if [ "${USE_NEW_SEARCH}" = "false" ]; then
  echo "  USE_NEW_SEARCH: false," >> ./env.js
else
  echo "  USE_NEW_SEARCH: true," >> ./env.js
fi
echo "};" >> ./env.js
