/** A file the map already has stored, as far as this decision cares. */
export interface StoredFileSummary {
  /** The stored file's name, comparable (see mapFileName). */
  name: string;
  /** Whole-file SHA-1 the update service recorded, lower-case hex. */
  sha1?: string | null;
}

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
  /** The map's stored files, as they read *after* the failure. */
  storedFiles: StoredFileSummary[];
  /** SHA-1 of the picked file, or null when it could not be hashed. */
  pickedSha1: string | null;
}

const compare = (value?: string | null): string => (value ?? "").trim().toLowerCase();

/**
 * What to tell the admin after an upload that did not come back cleanly.
 *
 * A timed-out upload is not a failed one: the update service may have stored the
 * file and only the answer went missing. The map's files settle it - but only by
 * content. A name on its own proves nothing, because another admin may have
 * stored a file under that name while this dialog was open, in which case the
 * upload was *rejected* and the namesake is somebody else's. So success is
 * claimed only when the checksums agree, and when they cannot be compared the
 * notice says exactly that rather than guessing either way.
 */
export function uploadFailureNotice(input: UploadFailureInput): string {
  if (!input.outcomeUnknown) return input.error;

  const target = compare(input.storedAsName);
  if (!target) return input.error;

  const stored = input.storedFiles.find((file) => compare(file.name) === target);
  if (!stored) return input.error;

  const name = input.storedAsName.trim();
  const storedSha1 = compare(stored.sha1);
  const pickedSha1 = compare(input.pickedSha1);

  if (!storedSha1 || !pickedSha1) {
    return `${input.error} A file named "${name}" is stored for this map, but it could not be checked `
      + "against the one just sent - compare its details below before selecting it.";
  }

  if (storedSha1 !== pickedSha1) {
    return `${input.error} A file named "${name}" is stored for this map, but it holds different content, `
      + "so it is not the one just sent - store this one under a different name.";
  }

  return `${input.error} It did go through: "${name}" is in the list above and can be selected from there `
    + "- do not upload it again.";
}
