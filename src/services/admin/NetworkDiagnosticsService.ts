import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";
import type { AggregateGroupKey, AggregateResponseDto, CreateRunRequest, MeasurementDetailDto, MeasurementFilters, MeasurementSummaryDto, ObservationDto, ObservationsPageDto, PageDto, RunDetailDto, RunDto, RunsQuery, TargetsDto } from "@/store/admin/networkDiagnostics/types";

const BASE = "api/network-diagnostics";

/** C6: `GET measurements` pageSize ≤ 100. */
export const MAX_MEASUREMENTS_PAGE_SIZE = 100;
/** C6: `GET observations` limit ≤ 5000. */
export const MAX_OBSERVATIONS_LIMIT = 5000;
/** C6: aggregate takes 1–3 group keys. */
const MAX_GROUP_KEYS = 3;

function append(params: URLSearchParams, key: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === "") return;
  params.append(key, String(value));
}

/** The C6 shared filter set as query parameters. Absent and empty values are left out; `false` is kept. */
export function measurementFilterParams(filters: MeasurementFilters): URLSearchParams {
  const params = new URLSearchParams();
  append(params, "battleTag", filters.battleTag);
  for (const id of filters.runIds ?? []) append(params, "runId", id);
  for (const id of filters.measurementIds ?? []) append(params, "measurementId", id);
  append(params, "targetKey", filters.targetKey);
  append(params, "nodeId", filters.nodeId);
  append(params, "targetIp", filters.targetIp);
  append(params, "path", filters.path);
  append(params, "method", filters.method);
  append(params, "country", filters.country);
  append(params, "city", filters.city);
  append(params, "asn", filters.asn);
  append(params, "os", filters.os);
  append(params, "adapterType", filters.adapterType);
  append(params, "vpn", filters.vpn);
  append(params, "from", filters.from);
  append(params, "to", filters.to);
  return params;
}

export function runsQueryParams(query: RunsQuery): URLSearchParams {
  const params = new URLSearchParams();
  append(params, "createdBy", query.createdBy);
  append(params, "from", query.from);
  append(params, "to", query.to);
  append(params, "page", query.page);
  append(params, "pageSize", query.pageSize);
  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query === "" ? path : `${path}?${query}`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Admin API for remote network diagnostics (contract C6). Takes its endpoint (and
 * optionally a fetch) rather than importing API_URL, so it can be built in tests:
 * `@/config/env` reads `window` at module load.
 */
export class NetworkDiagnosticsService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  async getTargets(token: string): Promise<TargetsDto> {
    return await this.client.getJson<TargetsDto>(`${BASE}/targets`, token);
  }

  async createRun(token: string, request: CreateRunRequest): Promise<RunDto> {
    return await this.client.requestJson<RunDto>("POST", `${BASE}/runs`, token, request);
  }

  async getRuns(token: string, query: RunsQuery): Promise<PageDto<RunDto>> {
    return await this.client.getJson<PageDto<RunDto>>(withQuery(`${BASE}/runs`, runsQueryParams(query)), token);
  }

  async getRun(token: string, runId: string): Promise<RunDetailDto> {
    return await this.client.getJson<RunDetailDto>(`${BASE}/runs/${segment(runId)}`, token);
  }

  async cancelRun(token: string, runId: string): Promise<RunDto> {
    return await this.client.requestJson<RunDto>("POST", `${BASE}/runs/${segment(runId)}/cancel`, token);
  }

  async getMeasurements(token: string, filters: MeasurementFilters, page: number, pageSize: number): Promise<PageDto<MeasurementSummaryDto>> {
    const params = measurementFilterParams(filters);
    params.set("page", String(page));
    params.set("pageSize", String(Math.min(pageSize, MAX_MEASUREMENTS_PAGE_SIZE)));
    return await this.client.getJson<PageDto<MeasurementSummaryDto>>(withQuery(`${BASE}/measurements`, params), token);
  }

  async getMeasurement(token: string, measurementId: string, raw: boolean): Promise<MeasurementDetailDto> {
    return await this.client.getJson<MeasurementDetailDto>(`${BASE}/measurements/${segment(measurementId)}?raw=${raw}`, token);
  }

  async getObservations(token: string, filters: MeasurementFilters, cursor: string | null, limit: number): Promise<ObservationsPageDto> {
    const params = measurementFilterParams(filters);
    params.set("format", "json");
    if (cursor !== null) params.set("cursor", cursor);
    params.set("limit", String(Math.min(limit, MAX_OBSERVATIONS_LIMIT)));
    return await this.client.getJson<ObservationsPageDto>(withQuery(`${BASE}/observations`, params), token);
  }

  /**
   * Follows `nextCursor` until `maxRows` rows are loaded; `truncated` says more rows may exist.
   * An empty page ends the loop even when it carries a cursor, so a misbehaving server cannot spin it forever.
   */
  async getObservationsUpTo(token: string, filters: MeasurementFilters, maxRows: number): Promise<{ items: ObservationDto[]; truncated: boolean }> {
    let items: ObservationDto[] = [];
    let cursor: string | null = null;
    let emptyPage = false;
    do {
      const page: ObservationsPageDto = await this.getObservations(token, filters, cursor, maxRows - items.length);
      items = items.concat(page.items);
      cursor = page.nextCursor;
      emptyPage = page.items.length === 0;
    } while (cursor !== null && !emptyPage && items.length < maxRows);
    return { items: items.slice(0, maxRows), truncated: cursor !== null };
  }

  async getAggregate(token: string, groupBy: readonly AggregateGroupKey[], filters: MeasurementFilters): Promise<AggregateResponseDto> {
    if (groupBy.length === 0 || groupBy.length > MAX_GROUP_KEYS) {
      throw new RangeError(`groupBy needs 1 to ${MAX_GROUP_KEYS} keys, got ${groupBy.length}`);
    }
    const params = measurementFilterParams(filters);
    params.set("groupBy", groupBy.join(","));
    return await this.client.getJson<AggregateResponseDto>(withQuery(`${BASE}/aggregate`, params), token);
  }
}
