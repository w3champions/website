import { API_URL } from "@/config/env";
import { HardwareSmurfService } from "@/services/admin/HardwareSmurfService";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing (same as commercialEvents/service.ts).
let instance: HardwareSmurfService | null = null;

export function hardwareSmurfService(): HardwareSmurfService {
  return instance ??= new HardwareSmurfService({ endpoint: API_URL });
}
