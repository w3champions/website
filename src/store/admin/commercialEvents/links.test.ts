import { test } from "vitest";
import { strict as assert } from "node:assert";
import { EAdminRouteName } from "@/router/types";
import { eventDetailLink } from "./links";

test("eventDetailLink targets the detail route with the event id as a param", () => {
  assert.deepEqual(eventDetailLink("ev 1"), { name: EAdminRouteName.COMMERCIAL_EVENTS_EVENT_DETAIL, params: { eventId: "ev 1" } });
});
