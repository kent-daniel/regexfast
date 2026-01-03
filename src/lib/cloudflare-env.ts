
type CloudflareEnv = {
  REPLICATE_API_TOKEN?: string;
  SYSTEM_PROMPT?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  [key: string]: string | undefined;
};


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
    
    console.debug(
      `Cloudflare context not available, falling back to process.env for ${key}`
    );
  }

  // Fallback to process.env for local development
  return process.env[key] || fallback;
}


export async function getCloudflareEnvs(
  keys: string[]
): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};
  
  for (const key of keys) {
    result[key] = await getCloudflareEnv(key);
  }
  
  return result;
}


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


export async function isCloudflarePages(): Promise<boolean> {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const context = getRequestContext();
    return !!context?.env;
  } catch {
    return false;
  }
}
