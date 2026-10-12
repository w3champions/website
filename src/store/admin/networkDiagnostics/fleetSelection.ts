import type { AggregateGroupKey, MeasurementFilters, NetDiagMethod, NetDiagPath } from "@/store/admin/networkDiagnostics/types";

export type FleetGroupBy = Extract<AggregateGroupKey, "country" | "asn" | "city">;

export interface FleetSelection {
  runId: string;
  targetKey: string;
  path: NetDiagPath;
  method: NetDiagMethod;
}

export function fleetSelectionKey(selection: FleetSelection): string {
  return [selection.runId, selection.targetKey, selection.path, selection.method].join("|");
}

export function fleetFilters(selection: FleetSelection): MeasurementFilters {
  return { runIds: [selection.runId], targetKey: selection.targetKey, path: selection.path, method: selection.method };
}

/** Identifies one aggregate view: the selection plus the single group key. */
export function fleetAggregateKey(selection: FleetSelection, groupBy: FleetGroupBy): string {
  return `${fleetSelectionKey(selection)}|${groupBy}`;
}
