import { EAdminRouteName } from "@/router/types";

/** The hardware page of an account. */
export function hardwareLink(battleTag: string): { name: EAdminRouteName; query: { player: string } } {
  return { name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, query: { player: battleTag } };
}
