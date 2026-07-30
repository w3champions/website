window._env_ = {
  //* website-backend URL
  // BASE_URL: "http://localhost:5000/",
  BASE_URL: "https://website-backend.test.w3champions.com/",
  // BASE_URL: "https://website-backend.w3champions.com/",

  //* identification-service URL
  // IDENTIFICATION_URL: "http://localhost:5000/",
  // IDENTIFICATION_URL: "https://identification-service.w3champions.com/",
  IDENTIFICATION_URL: "https://identification-service.test.w3champions.com/",

  //* update-service URL
  LAUNCHER_UPDATE_URL: "https://update-service.test.w3champions.com/api/",

  //* CDN resources url
  INGAME_STATIC_RESOURCES_URL: "https://storage.w3champions.com/test/integration/",
  // INGAME_STATIC_RESOURCES_URL: "https://storage.w3champions.com/prod/integration/",

  //* public API client ID for W3Champions
  BNET_API_CLIENT_ID: "d7bd6dd46e2842c8a680866759ad34c2",

  //* Turnstile site key
  TURNSTILE_SITE_KEY: "0x4AAAAAAB0hhXF_QHDGwhjQ",

  //* USE_NEW_SEARCH — temporary rollout switch for the consolidated search, removed again once
  //* the rollout has proven stable (retirement steps: src/helpers/featureFlags.ts). This file
  //* serves local dev only; set false here to run the legacy search locally. Rollback on
  //* test/prod: register USE_NEW_SEARCH=false as an environment variable on the frontend
  //* deployment — scripts/env.sh reads it at container start; unset means on.
  USE_NEW_SEARCH: true,
};
