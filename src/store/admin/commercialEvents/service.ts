import { API_URL } from "@/config/env";
import { CommercialEventsService } from "@/services/admin/CommercialEventsService";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing (same as commercialLicense/store.ts).
let instance: CommercialEventsService | null = null;

export function commercialEventsService(): CommercialEventsService {
  return instance ??= new CommercialEventsService({ endpoint: API_URL });
}
