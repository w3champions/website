// Runtime feature flags, read from window._env_ (public/env.js — regenerated at container start
// from environment variables by scripts/env.sh, so a flag can be toggled without a rebuild).

// USE_NEW_SEARCH — single rollout switch for the new consolidated search engine. It governs EVERY
// migrated search surface, not just one: the shared player picker (PlayerSearch.vue) today, plus
// ladder search (RankingService) and other placements as they move over. true = new engine,
// false = legacy. Defaults to true.
//
// This is an ops rollback lever, not a long-lived toggle: it ships defaulted to true (the merge is
// the rollout) and is retired after the new search has run stable in production for 2–4 weeks.
//
// To retire this flag once the new search is permanent:
//   1. delete the export below;
//   2. remove USE_NEW_SEARCH from public/env.js, from the window._env_ type in src/config/env.ts,
//      and its generation block from scripts/env.sh;
//   3. run `grep -rn USE_NEW_SEARCH src/` and, at each remaining site, delete the legacy branch and
//      keep the new-search behavior as the default (e.g. in PlayerSearch.vue: drop the ProfileService
//      path and make `:no-filter` a static `no-filter`).
export const USE_NEW_SEARCH = window._env_.USE_NEW_SEARCH ?? true;
