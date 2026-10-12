import { API_URL } from "@/config/env";
import { NetworkDiagnosticsService } from "@/services/admin/NetworkDiagnosticsService";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing (same as commercialEvents/service.ts).
let instance: NetworkDiagnosticsService | null = null;

export function networkDiagnosticsService(): NetworkDiagnosticsService {
  return instance ??= new NetworkDiagnosticsService({ endpoint: API_URL });
}
