/**
 * Cloudflare Pages Environment Utility
 * 
 * This utility provides a generic way to access environment variables
 * from Cloudflare Pages platform bindings in Next.js applications.
 * 
 * In Cloudflare Pages with Next.js, environment variables are accessed
 * via the platform context rather than process.env for server-side secrets.
 */

type CloudflareEnv = {
  REPLICATE_API_TOKEN?: string;
  SYSTEM_PROMPT?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  // Add other environment variables here as needed
  [key: string]: string | undefined;
};

/**
 * Get environment variable from Cloudflare Pages context or fallback to process.env
 * 
 * This function attempts to get the environment variable from Cloudflare Pages
 * platform bindings first, and falls back to process.env for local development.
 * 
 * @param key - The environment variable key
 * @param fallback - Optional fallback value if the key is not found
 * @returns The environment variable value or fallback
 * 
 * @example
 * ```typescript
 * const apiToken = await getCloudflareEnv('REPLICATE_API_TOKEN');
 * const prompt = await getCloudflareEnv('SYSTEM_PROMPT', 'default prompt');
 * ```
 */
export async function getCloudflareEnv(
  key: string,
  fallback?: string
): Promise<string | undefined> {
  try {
    // Try to import Cloudflare Next.js adapter
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    
    // Get the platform environment from Cloudflare context
    const context = getRequestContext();
    const env = context?.env as CloudflareEnv;
    
    if (env && env[key]) {
      return env[key];
    }
  } catch (error) {
    // If @cloudflare/next-on-pages is not available or getRequestContext fails,
    // we're likely in local development or the package isn't installed
    console.debug(
      `Cloudflare context not available, falling back to process.env for ${key}`
    );
  }

  // Fallback to process.env for local development
  return process.env[key] || fallback;
}

/**
 * Get multiple environment variables at once
 * 
 * @param keys - Array of environment variable keys
 * @returns Object with key-value pairs of environment variables
 * 
 * @example
 * ```typescript
 * const { REPLICATE_API_TOKEN, SYSTEM_PROMPT } = await getCloudflareEnvs([
 *   'REPLICATE_API_TOKEN',
 *   'SYSTEM_PROMPT'
 * ]);
 * ```
 */
export async function getCloudflareEnvs(
  keys: string[]
): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};
  
  for (const key of keys) {
    result[key] = await getCloudflareEnv(key);
  }
  
  return result;
}

/**
 * Type-safe environment getter with required validation
 * 
 * @param key - The environment variable key
 * @throws Error if the environment variable is not found
 * @returns The environment variable value
 * 
 * @example
 * ```typescript
 * const apiToken = await requireCloudflareEnv('REPLICATE_API_TOKEN');
 * // Throws error if REPLICATE_API_TOKEN is not set
 * ```
 */
export async function requireCloudflareEnv(key: string): Promise<string> {
  const value = await getCloudflareEnv(key);
  
  if (!value) {
    throw new Error(
      `Required environment variable ${key} is not set. ` +
      `Please add it to your Cloudflare Pages environment variables or .env file.`
    );
  }
  
  return value;
}

/**
 * Check if we're running in Cloudflare Pages environment
 * 
 * @returns true if running in Cloudflare Pages, false otherwise
 */
export async function isCloudflarePages(): Promise<boolean> {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const context = getRequestContext();
    return !!context?.env;
  } catch {
    return false;
  }
}
