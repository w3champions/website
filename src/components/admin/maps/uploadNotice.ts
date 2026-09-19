export interface UploadFailureInput {
  /** What the failure itself said. */
  error: string;
  /**
   * True when the request timed out, so the upload may well have been applied.
   * Any other failure is taken at its word.
   */
  outcomeUnknown: boolean;
  /** The name the picked file would have been stored under. */
  storedAsName: string;
  /** The map's stored file names, as they read *after* the failure. */
  storedFileNames: string[];
}

/**
 * What to tell the admin after an upload that did not come back cleanly.
 *
 * A timed-out upload is not a failed one: the update service may have stored
 * the file and only the answer went missing. Once the map's files have been
 * re-read, the list itself settles the question, so say what it shows rather
 * than leaving the admin to retry an upload that has already happened.
 */
export function uploadFailureNotice(input: UploadFailureInput): string {
  if (!input.outcomeUnknown) return input.error;

  const target = input.storedAsName.trim().toLowerCase();
  const landed = !!target && input.storedFileNames.some((name) => name.trim().toLowerCase() === target);
  if (!landed) return input.error;

  return `${input.error} It did go through: "${input.storedAsName}" is in the list above `
    + "and can be selected from there - do not upload it again.";
}
