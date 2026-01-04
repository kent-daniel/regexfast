/**
 * Utility functions for the Regex Agent
 */

import type { IterationResult } from "./types";
import { MAX_FULL_HISTORY_SIZE } from "./constants";

/**
 * Compact history for large iteration counts to reduce prompt size
 * 
 * For histories with more than MAX_FULL_HISTORY_SIZE iterations, 
 * only keeps the last N in full detail. This prevents context window 
 * overflow while still providing useful feedback to the LLM.
 */
export function compactHistory(history: IterationResult[]): IterationResult[] {
  // Keep all history if within size limit
  if (history.length <= MAX_FULL_HISTORY_SIZE) {
    return history;
  }

  // For larger histories, keep last N in full
  // Earlier iterations just keep pattern and failure count (implicit in the data structure)
  return history.slice(-MAX_FULL_HISTORY_SIZE);
}

/**
 * Format failed tests for display in prompts/logs
 */
export function formatFailedTests(results: IterationResult["testResults"]["results"]): string {
  return results
    .filter(r => !r.passed)
    .map(r => `"${r.input}"`)
    .join(", ") || "(none)";
}
