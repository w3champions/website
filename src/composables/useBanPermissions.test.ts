import assert from "node:assert/strict";
import { test, vi } from "vitest";
import { EPermission } from "@/store/admin/permission/types";
import { useBanPermissions } from "./useBanPermissions";

const oauth = vi.hoisted(() => ({ permissions: [] as string[] }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));

test("machine access needs AdminModeration; moderation needs Moderation", () => {
  oauth.permissions = ["Moderation"];
  const p = useBanPermissions();
  assert.equal(p.canModerate.value, true);
  assert.equal(p.hasMachineAccess.value, false);
  oauth.permissions = ["Moderation", "AdminModeration"];
  assert.equal(useBanPermissions().hasMachineAccess.value, true);
  assert.equal(EPermission.AdminModeration, 15);
});
