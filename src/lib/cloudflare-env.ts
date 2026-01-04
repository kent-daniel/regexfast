import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function getCloudflareEnv<K extends keyof CloudflareEnv>(
  key: K,
  fallback?: string
): Promise<string | undefined> {
  try {
    // Get the platform environment from Cloudflare context
    const { env } = getRequestContext();
    
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


export async function getCloudflareEnvs<K extends keyof CloudflareEnv>(
  keys: K[]
): Promise<Record<K, string | undefined>> {
  const result = {} as Record<K, string | undefined>;
  
  for (const key of keys) {
    result[key] = await getCloudflareEnv(key);
  }
  
  return result;
}


export async function requireCloudflareEnv<K extends keyof CloudflareEnv>(
  key: K
): Promise<string> {
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
    const context = getRequestContext();
    return !!context?.env;
  } catch {
    return false;
  }
}
