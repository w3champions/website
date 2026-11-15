import { expect, test } from "vitest";
import { EAdminRouteName } from "@/router/types";
import { hardwareLink } from "./links";

test("hardwareLink points at the hardware page of the account", () => {
  expect(hardwareLink("Guest#1003")).toEqual({ name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, query: { player: "Guest#1003" } });
});
