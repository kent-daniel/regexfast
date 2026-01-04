/**
 * Constants for the Regex Agent
 * Centralizes magic numbers and configuration values
 */

/**
 * Default model to use for regex generation
 */
export const DEFAULT_MODEL = "google/gemini-2.5-flash-lite-preview-09-2025";

/**
 * Default maximum number of iterations for the generation loop
 */
export const DEFAULT_MAX_ITERATIONS = 5;

/**
 * Timeout for sandbox execution in seconds
 */
export const SANDBOX_TIMEOUT_SECONDS = 10;

/**
 * Maximum number of iterations to keep in full detail for history compaction
 * Earlier iterations will be summarized to reduce prompt size
 */
export const MAX_FULL_HISTORY_SIZE = 3;
