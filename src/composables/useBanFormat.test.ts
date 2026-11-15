// @vitest-environment jsdom
import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { banTestPlugins, txt } from "@/components/admin/bans/setup.testing";
import { useBanFormat } from "./useBanFormat";

test("accountHref opens the account view of the bans page", () => {
  let format!: ReturnType<typeof useBanFormat>;
  const Probe = defineComponent({
    setup() {
      format = useBanFormat();
      return () => null;
    },
  });
  mount(Probe, { global: { plugins: banTestPlugins() } });
  expect(format.accountHref("tag:Tester#1001")).toBe("/admin/admin-banned-players?account=tag:Tester%231001");
  expect(format.modeName(1)).toBe("1 vs 1");
  expect(format.format().t("views_admin_bans.permanent")).toBe(txt("permanent"));
  expect(txt("permanent")).toBe("Permanent");
});
