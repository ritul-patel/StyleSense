export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn("safeJsonParse: failed to parse JSON", e);
    return fallback;
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return safeJsonParse(raw, fallback);
  } catch (e) {
    console.warn(`safeLocalStorageGet: failed to get ${key} from localStorage`, e);
    return fallback;
  }
}
