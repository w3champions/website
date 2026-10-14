import chunk from "lodash/chunk";
import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";
import type { ActiveEventGame, AdminEvent, AdminEventDetail, Allocation, AllocationCreateRequest, AllocationUpdateRequest, AuditEntry, AuditScope, EventCreateRequest, EventFilters, EventGamesPage, EventPeople, EventUpdateRequest, ManagedRole, PeriodUsage, RoleHints, SuspendRequest } from "@/store/admin/commercialEvents/types";

const BASE = "api/admin/commercial-events";

/** matchmaking answers 400 for more than 200 tags per roles lookup (C-E3). */
export const ROLE_HINTS_BATCH_SIZE = 200;

/** `?k=v&...` from the non-empty values, each encoded with encodeURIComponent (C-E4); "" when none. */
export function queryString(params: Array<[string, string | number | null | undefined]>): string {
  const parts = params
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Admin API for commercial events (index plan contract C-E4). Takes its endpoint
 * (and optionally a fetch) rather than importing API_URL, so it can be built in
 * tests: `@/config/env` reads `window` at module load.
 */
export class CommercialEventsService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  async getAllocations(token: string): Promise<Allocation[]> {
    return await this.client.getJson<Allocation[]>(`${BASE}/allocations`, token);
  }

  async createAllocation(token: string, request: AllocationCreateRequest): Promise<Allocation> {
    return await this.client.requestJson<Allocation>("POST", `${BASE}/allocations`, token, request);
  }

  async updateAllocation(token: string, allocationId: string, request: AllocationUpdateRequest): Promise<Allocation> {
    return await this.client.requestJson<Allocation>("PUT", `${BASE}/allocations/${segment(allocationId)}`, token, request);
  }

  async addAllocationMember(token: string, allocationId: string, battleTag: string): Promise<Allocation> {
    return await this.client.requestJson<Allocation>("PUT", `${BASE}/allocations/${segment(allocationId)}/members/${segment(battleTag)}`, token);
  }

  async removeAllocationMember(token: string, allocationId: string, battleTag: string): Promise<Allocation> {
    return await this.client.requestJson<Allocation>("DELETE", `${BASE}/allocations/${segment(allocationId)}/members/${segment(battleTag)}`, token);
  }

  async endAllocation(token: string, allocationId: string): Promise<Allocation> {
    return await this.client.requestJson<Allocation>("POST", `${BASE}/allocations/${segment(allocationId)}/end`, token);
  }

  async deleteAllocation(token: string, allocationId: string): Promise<void> {
    await this.client.requestVoid("DELETE", `${BASE}/allocations/${segment(allocationId)}`, token);
  }

  async getAllocationPeriods(token: string, allocationId: string): Promise<PeriodUsage[]> {
    return await this.client.getJson<PeriodUsage[]>(`${BASE}/allocations/${segment(allocationId)}/periods`, token);
  }

  async getEvents(token: string, filters: EventFilters): Promise<AdminEvent[]> {
    const query = queryString([
      ["status", filters.status],
      ["phase", filters.phase],
      ["allocationId", filters.allocationId],
      ["q", filters.q.trim()],
    ]);
    return await this.client.getJson<AdminEvent[]>(`${BASE}/events${query}`, token);
  }

  async getEvent(token: string, eventId: string): Promise<AdminEventDetail> {
    return await this.client.getJson<AdminEventDetail>(`${BASE}/events/${segment(eventId)}`, token);
  }

  /** The detail (`getEvent`) already carries the people; this completes the C-E4 route set. */
  async getEventPeople(token: string, eventId: string): Promise<EventPeople> {
    return await this.client.getJson<EventPeople>(`${BASE}/events/${segment(eventId)}/people`, token);
  }

  async createEvent(token: string, request: EventCreateRequest): Promise<AdminEventDetail> {
    return await this.client.requestJson<AdminEventDetail>("POST", `${BASE}/events`, token, request);
  }

  async updateEvent(token: string, eventId: string, request: EventUpdateRequest): Promise<AdminEventDetail> {
    return await this.client.requestJson<AdminEventDetail>("PUT", `${BASE}/events/${segment(eventId)}`, token, request);
  }

  async moveEvent(token: string, eventId: string, allocationId: string): Promise<AdminEventDetail> {
    return await this.client.requestJson<AdminEventDetail>("POST", `${BASE}/events/${segment(eventId)}/move`, token, { allocationId });
  }

  async closeEvent(token: string, eventId: string): Promise<AdminEventDetail> {
    return await this.client.requestJson<AdminEventDetail>("POST", `${BASE}/events/${segment(eventId)}/close`, token);
  }

  async suspendEvent(token: string, eventId: string, request: SuspendRequest): Promise<AdminEventDetail> {
    return await this.client.requestJson<AdminEventDetail>("POST", `${BASE}/events/${segment(eventId)}/suspend`, token, request);
  }

  async unsuspendEvent(token: string, eventId: string): Promise<AdminEventDetail> {
    return await this.client.requestJson<AdminEventDetail>("POST", `${BASE}/events/${segment(eventId)}/unsuspend`, token);
  }

  async addEventPerson(token: string, eventId: string, battleTag: string, role: ManagedRole): Promise<EventPeople> {
    return await this.client.requestJson<EventPeople>("PUT", `${BASE}/events/${segment(eventId)}/people/${segment(battleTag)}`, token, { role });
  }

  /** Removes whichever event role the account holds; a no-op when it holds none. */
  async removeEventPerson(token: string, eventId: string, battleTag: string): Promise<EventPeople> {
    return await this.client.requestJson<EventPeople>("DELETE", `${BASE}/events/${segment(eventId)}/people/${segment(battleTag)}`, token);
  }

  /** All games incl. running ones, startedAt descending; `cursor` is opaque (nextCursor of the previous page). */
  async getEventGames(token: string, eventId: string, cursor?: string, limit?: number): Promise<EventGamesPage> {
    const query = queryString([["cursor", cursor], ["limit", limit]]);
    return await this.client.getJson<EventGamesPage>(`${BASE}/events/${segment(eventId)}/games${query}`, token);
  }

  async getActiveGames(token: string): Promise<ActiveEventGame[]> {
    return await this.client.getJson<ActiveEventGame[]>(`${BASE}/games/active`, token);
  }

  async terminateGame(token: string, matchId: string): Promise<void> {
    await this.client.requestVoid("POST", `${BASE}/games/${segment(matchId)}/terminate`, token);
  }

  async getAudit(token: string, scope: AuditScope): Promise<AuditEntry[]> {
    const query = "eventId" in scope ? queryString([["eventId", scope.eventId]]) : queryString([["allocationId", scope.allocationId]]);
    return await this.client.getJson<AuditEntry[]>(`${BASE}/audit${query}`, token);
  }

  /**
   * Role hints for the tag page; a read sent as POST so 200 non-ASCII tags never hit URL limits.
   * Tags are de-duplicated exactly (never case-folded) and sent in batches of 200.
   */
  async getRoleHints(token: string, battleTags: string[]): Promise<RoleHints[]> {
    const results: RoleHints[] = [];
    for (const batch of chunk([...new Set(battleTags)], ROLE_HINTS_BATCH_SIZE)) {
      results.push(...await this.client.requestJson<RoleHints[]>("POST", `${BASE}/roles/lookup`, token, { battleTags: batch }));
    }
    return results;
  }

  /**
   * The website match page (`/match/:matchId`) takes the website-backend Matchup id,
   * not the matchmaking match id. Resolves it through the public lookup; null when
   * the game never produced a finished match.
   */
  async resolveMatchPageId(matchId: string): Promise<string | null> {
    const detail = await this.client.getJson<{ match?: { id?: string | null } | null }>(`api/matches/by-ongoing-match-id/${segment(matchId)}`, "");
    return detail.match?.id ?? null;
  }
}
