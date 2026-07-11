/**
 * Document file validation policy (ADR-0007). Runs BEFORE any byte is
 * stored. Limits are configurable per instance; the defaults are the
 * conservative prototype set. Not a malware scanner — see the security
 * boundaries doc: malware scanning is an open requirement, not a feature.
 */

export class DocumentValidationError extends Error {
  constructor(
    message: string,
    /** Machine-readable classification, safe for audit metadata. */
    readonly code:
      | "EMPTY_FILE"
      | "FILE_TOO_LARGE"
      | "MIME_TYPE_NOT_ALLOWED"
      | "EXTENSION_MISMATCH"
      | "UNSAFE_FILENAME",
  ) {
    super(message);
    this.name = "DocumentValidationError";
  }
}

export interface DocumentValidationConfig {
  readonly maxFileSizeBytes: number;
  /** MIME type → extensions accepted for it (lowercase, no dot). */
  readonly allowedMimeTypes: Readonly<Record<string, readonly string[]>>;
}

/** Conservative prototype allowlist. */
export const DEFAULT_DOCUMENT_VALIDATION: DocumentValidationConfig = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MiB
  allowedMimeTypes: {
    "application/pdf": ["pdf"],
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "text/plain": ["txt"],
  },
};

// Path separators, control characters (incl. null bytes), DEL, and
// parent-directory sequences are unsafe in any display or log context.
// Ordinary spaces are fine; filenames never control storage paths here.
// eslint-disable-next-line no-control-regex
const FILENAME_FORBIDDEN = /[/\\\u0000-\u001f\u007f]|\.\./;

export class DocumentValidationPolicy {
  constructor(private readonly config: DocumentValidationConfig = DEFAULT_DOCUMENT_VALIDATION) {}

  validate(input: { filename: string; mimeType: string; content: Uint8Array }): void {
    const { filename, content } = input;
    const mimeType = input.mimeType.toLowerCase();

    if (content.byteLength === 0) {
      throw new DocumentValidationError("Empty files are not accepted", "EMPTY_FILE");
    }
    if (content.byteLength > this.config.maxFileSizeBytes) {
      throw new DocumentValidationError(
        `File exceeds the ${this.config.maxFileSizeBytes}-byte limit`,
        "FILE_TOO_LARGE",
      );
    }
    if (FILENAME_FORBIDDEN.test(filename) || filename.trim().length === 0 || filename.length > 255) {
      // The filename never controls a storage path either way (keys are
      // content-addressed); this rejects names that could not be displayed
      // or logged safely.
      throw new DocumentValidationError("Filename contains unsafe characters", "UNSAFE_FILENAME");
    }
    const allowedExtensions = this.config.allowedMimeTypes[mimeType];
    if (!allowedExtensions) {
      throw new DocumentValidationError(`MIME type "${mimeType}" is not allowed`, "MIME_TYPE_NOT_ALLOWED");
    }
    const dot = filename.lastIndexOf(".");
    const extension = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
    if (!allowedExtensions.includes(extension)) {
      throw new DocumentValidationError(
        `Extension ".${extension}" does not match MIME type "${mimeType}"`,
        "EXTENSION_MISMATCH",
      );
    }
  }
}
