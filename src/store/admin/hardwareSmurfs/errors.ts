import { HardwareSmurfApiError } from "@/services/admin/HardwareSmurfService";
import { key, type Translate } from "./translate";

/** The server's message for a failed request, else a generic text. */
export function errorText(e: unknown, t: Translate): string {
  if (e instanceof HardwareSmurfApiError && e.serverMessage) return e.serverMessage;
  return t(key("generic_error"));
}
