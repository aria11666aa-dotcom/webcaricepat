import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    "Missing Redis env vars: set KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash)"
  );
}

export const redis = new Redis({ url, token });

export const LABELS_KEY = "caricepat:labels";
export const KEYWORDS_KEY = "caricepat:keywords";
export const LEGACY_LINKS_KEY = "caricepat:links";
export const MIGRATION_FLAG = "caricepat:migrated_v2";

export type LabelMap = Record<string, string>;
export type KeywordMap = Record<string, string>;

export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function getLabels(): Promise<LabelMap> {
  const data = await redis.hgetall<LabelMap>(LABELS_KEY);
  return data ?? {};
}

export async function getKeywords(): Promise<KeywordMap> {
  const data = await redis.hgetall<KeywordMap>(KEYWORDS_KEY);
  return data ?? {};
}

export async function setLabel(name: string, url: string): Promise<void> {
  await redis.hset(LABELS_KEY, { [name]: url });
}

export async function deleteLabel(name: string): Promise<void> {
  await redis.hdel(LABELS_KEY, name);
}

export async function setKeyword(keyword: string, label: string): Promise<void> {
  await redis.hset(KEYWORDS_KEY, { [keyword]: label });
}

export async function deleteKeyword(keyword: string): Promise<void> {
  await redis.hdel(KEYWORDS_KEY, keyword);
}

export async function deleteKeywordsByLabel(label: string): Promise<number> {
  const keywords = await getKeywords();
  const toDelete = Object.entries(keywords)
    .filter(([, lbl]) => lbl === label)
    .map(([kw]) => kw);
  if (toDelete.length === 0) return 0;
  await redis.hdel(KEYWORDS_KEY, ...toDelete);
  return toDelete.length;
}

export async function getFlatLinks(): Promise<Record<string, string>> {
  const [labels, keywords] = await Promise.all([getLabels(), getKeywords()]);
  const flat: Record<string, string> = {};
  for (const [keyword, label] of Object.entries(keywords)) {
    const url = labels[label];
    if (url) flat[keyword] = url;
  }
  return flat;
}

export async function runMigrationIfNeeded(): Promise<{ migrated: boolean; labels: number; keywords: number }> {
  const flag = await redis.get(MIGRATION_FLAG);
  if (flag) return { migrated: false, labels: 0, keywords: 0 };

  const legacy = await redis.hgetall<Record<string, string>>(LEGACY_LINKS_KEY);
  if (!legacy || Object.keys(legacy).length === 0) {
    await redis.set(MIGRATION_FLAG, "1");
    return { migrated: false, labels: 0, keywords: 0 };
  }

  const urlToLabel = new Map<string, string>();
  const labels: LabelMap = {};
  const keywords: KeywordMap = {};

  const sortedEntries = Object.entries(legacy).sort(([a], [b]) => a.length - b.length || a.localeCompare(b));

  for (const [rawKeyword, url] of sortedEntries) {
    const keyword = normalize(rawKeyword);
    if (!keyword || !url) continue;

    let label = urlToLabel.get(url);
    if (!label) {
      let candidate = keyword.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
      if (!candidate) candidate = `label-${urlToLabel.size + 1}`;
      let unique = candidate;
      let i = 2;
      while (labels[unique]) {
        unique = `${candidate}-${i++}`;
      }
      label = unique;
      labels[label] = url;
      urlToLabel.set(url, label);
    }
    keywords[keyword] = label;
  }

  if (Object.keys(labels).length > 0) {
    await redis.hset(LABELS_KEY, labels);
  }
  if (Object.keys(keywords).length > 0) {
    await redis.hset(KEYWORDS_KEY, keywords);
  }
  await redis.set(MIGRATION_FLAG, "1");

  return {
    migrated: true,
    labels: Object.keys(labels).length,
    keywords: Object.keys(keywords).length,
  };
}
