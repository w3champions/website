import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import { DEFAULT_PAGE_QUERY, pageQueryToRoute, withAccount } from "@/store/admin/bans/listQuery";
import type { StatementFormat } from "@/store/admin/bans/inEffect";
import type { Translate } from "@/store/admin/bans/translate";
import { EGameMode } from "@/store/types";

export interface BanFormat {
  tr: Translate;
  modeName: (mode: EGameMode) => string;
  /** { t: tr, modeName, now: new Date() } at call time. */
  format: () => StatementFormat;
  accountHref: (accountKey: string) => string;
}

/** Shared formatting of the bans components. Call inside a component's setup. */
export function useBanFormat(): BanFormat {
  const { t } = useI18n();
  const router = useRouter();
  const tr: Translate = (k, named) => t(k, named ?? {});
  const modeName = (mode: EGameMode): string => t(`gameModes.${EGameMode[mode]}`);
  return {
    tr,
    modeName,
    format: () => ({ t: tr, modeName, now: new Date() }),
    accountHref: (accountKey) =>
      router.resolve({
        name: EAdminRouteName.BANNED_PLAYERS,
        query: pageQueryToRoute(withAccount(DEFAULT_PAGE_QUERY, accountKey)),
      }).href,
  };
}
