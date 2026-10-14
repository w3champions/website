import type { RouteLocationRaw } from "vue-router";
import { EAdminRouteName } from "@/router/types";

/** The event detail page (`/admin/commercial-events/events/<eventId>`); the router encodes the id. */
export function eventDetailLink(eventId: string): RouteLocationRaw {
  return { name: EAdminRouteName.COMMERCIAL_EVENTS_EVENT_DETAIL, params: { eventId } };
}
