import { API_URL } from "@/config/env";
import { SmurfEventsService } from "@/services/admin/SmurfEventsService";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing (same as hardwareSmurfs/service.ts).
let instance: SmurfEventsService | null = null;

export function smurfEventsService(): SmurfEventsService {
  return instance ??= new SmurfEventsService({ endpoint: API_URL });
}
