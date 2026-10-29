import { redis } from "./redis";

const MENU_TTL_SECONDS = Number(process.env.MENU_CACHE_TTL || 30);

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = await redis();
  if (!r) return null;
  const raw = await r.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = MENU_TTL_SECONDS) {
  const r = await redis();
  if (!r) return;
  await r.set(key, JSON.stringify(value), { EX: ttl });
}

/** Wipe every menu cache entry for a store so kitchen edits go live immediately. */
export async function cacheDel(prefix: string) {
  const r = await redis();
  if (!r) return;

  try {
    const keys = await r.keys(`${prefix}*`);
    if (keys.length) {
      await r.del(keys);
      return;
    }
  } catch (error) {
    console.warn("[menu cacheDel keys]", error instanceof Error ? error.message : error);
  }

  // Fallback when KEYS is blocked: delete common menu GET shapes.
  const modes = ["pub", "all"];
  const versions = ["hf8", "hf7", "hf6", "hf5", "hf4", "hf3", "hf2"];
  const extras: string[] = [];
  for (const mode of modes) {
    for (const featured of ["true", "false"]) {
      for (const version of versions) {
        extras.push(`${version}:${mode}:::${featured}`);
        extras.push(`${version}:${mode}::`);
      }
    }
  }
  try {
    await r.del([prefix, ...extras.map((extra) => `${prefix}:${extra}`)]);
  } catch (error) {
    console.warn("[menu cacheDel fallback]", error instanceof Error ? error.message : error);
  }
}

export function menuCacheKey(storeId: string, extra = "") {
  return `menu:${storeId}${extra ? `:${extra}` : ""}`;
}
