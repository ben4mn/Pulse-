interface CacheEntry<T> {
  data: T;
  ts: number;
}

export const sessionCache = {
  get<T>(key: string, ttlMs: number): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.ts > ttlMs) {
        sessionStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },
  set<T>(key: string, data: T) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // storage full — clear oldest entries
      sessionStorage.clear();
      try {
        sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
      } catch { /* give up */ }
    }
  },
  clear() {
    sessionStorage.clear();
  },
};

export const localCache = {
  get<T>(key: string, ttlMs: number): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.ts > ttlMs) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },
  set<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // prune old entries
      const keys: { key: string; ts: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        try {
          const entry = JSON.parse(localStorage.getItem(k)!);
          if (entry.ts) keys.push({ key: k, ts: entry.ts });
        } catch { /* skip */ }
      }
      keys.sort((a, b) => a.ts - b.ts);
      for (let i = 0; i < Math.min(10, keys.length); i++) {
        localStorage.removeItem(keys[i].key);
      }
      try {
        localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
      } catch { /* give up */ }
    }
  },
};
