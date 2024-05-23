import { inject } from "vue";
import type { VueCookies } from "vue-cookies";

export function useCookies(): VueCookies {
  const $cookies = inject<VueCookies>("$cookies");

  return $cookies as VueCookies;
}
