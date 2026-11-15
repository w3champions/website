import { BAN_ERROR_CODES, type BanErrorCode } from "@/store/admin/bans/types";
import { serverMessageOf } from "./HardwareSmurfService";

/**
 * A refused or failed ban request. Kept apart from the service so stores and helpers can use
 * `instanceof` without importing `@/config/env`, which reads `window` at load time.
 */
export class BanApiError extends Error {
  readonly status: number;
  /** `errors[0].code` when it is one of the contract's codes. */
  readonly code: BanErrorCode | undefined;

  /** `message` is the server's text, "" when it sent none we can read. */
  constructor(status: number, code: BanErrorCode | undefined, message: string) {
    super(message);
    this.name = "BanApiError";
    this.status = status;
    this.code = code;
  }
}

function codeOf(body: string): BanErrorCode | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const { errors } = parsed as Record<string, unknown>;
  if (!Array.isArray(errors) || typeof errors[0] !== "object" || errors[0] === null) return undefined;
  const code = (errors[0] as Record<string, unknown>).code;
  return BAN_ERROR_CODES.find((known) => known === code);
}

export function banApiErrorOf(status: number, body: string): BanApiError {
  return new BanApiError(status, codeOf(body), serverMessageOf(body) ?? "");
}
