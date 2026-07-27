// Runtime feature flags, read from window._env_ (set per-deployment in public/env.js, so they can be
// toggled without a rebuild — flip the value in the deployed env.js and reload).

// USE_NEW_SEARCH — single rollout switch for the new consolidated search engine. It governs EVERY
// migrated search surface, not just one: the shared player picker (PlayerSearch.vue) today, plus
// ladder search (RankingService) and other placements as they move over. true = new engine,
// false = legacy. Defaults to true.
//
// To retire this flag once the new search is permanent:
//   1. delete the export below;
//   2. remove USE_NEW_SEARCH from public/env.js and from the window._env_ type in src/config/env.ts;
//   3. run `grep -rn USE_NEW_SEARCH src/` and, at each remaining site, delete the legacy branch and
//      keep the new-search behavior as the default (e.g. in PlayerSearch.vue: drop the ProfileService
//      path and make `:no-filter` a static `no-filter`).
export const USE_NEW_SEARCH = window._env_.USE_NEW_SEARCH ?? true;
