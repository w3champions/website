declare global {
  interface Window {
    _env_: {
      BASE_URL: string;
      IDENTIFICATION_URL: string;
      LAUNCHER_UPDATE_URL: string;
      INGAME_STATIC_RESOURCES_URL: string;
      BNET_API_CLIENT_ID: string;
      TURNSTILE_SITE_KEY: string;
    };
  }
}

const _apiUrl = window._env_.BASE_URL;
const _idUrl = window._env_.IDENTIFICATION_URL;
const _launcherUrl = window._env_.LAUNCHER_UPDATE_URL;
const _ingameUrlStaticResourcesUrl = window._env_.INGAME_STATIC_RESOURCES_URL;
const _bnetApiClientId = window._env_.BNET_API_CLIENT_ID;
const _turnstileSiteKey = window._env_.TURNSTILE_SITE_KEY;

const getUrl = window.location;

export const API_URL = _apiUrl;
export const IDENTIFICATION_URL = _idUrl;
export const REDIRECT_URL = getUrl.protocol + "//" + getUrl.host + "/login";
export const PATREON_REDIRECT_URL = getUrl.protocol + "//" + getUrl.host + "/patreon/callback";
export const LAUNCHER_UPDATE_URL = _launcherUrl;
export const INGAME_STATIC_RESOURCES_URL = _ingameUrlStaticResourcesUrl;
export const BNET_API_CLIENT_ID = _bnetApiClientId;
export const TURNSTILE_SITE_KEY = _turnstileSiteKey;
