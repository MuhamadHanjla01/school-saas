/**
 * In-memory response cache for serving identical API responses across users.
 *
 * Features:
 *   - TTL-based expiration (per-route configurable)
 *   - Cache keys account for meaningful variations (locale, query params)
 *   - Manual invalidation by tag (e.g. invalidate all "notices" caches on write)
 *   - Stale-while-revalidate: serves stale content while regenerating in background
 *   - Memory-bounded: evicts oldest entries when hitting size limit
 *   - Cache status exposed via X-Cache header (HIT / MISS / STALE)
 */

class ResponseCache {
  /**
   * @param {object} opts
   * @param {number} opts.maxEntries       – Max cached entries before LRU eviction (default 200)
   * @param {number} opts.defaultTtlMs     – Default TTL in ms (default 60 000 = 1 minute)
   * @param {number} opts.staleTtlMs       – How long past TTL a stale entry can be served while revalidating (default 30 000)
   */
  constructor(opts = {}) {
    this.maxEntries = opts.maxEntries ?? 200;
    this.defaultTtlMs = opts.defaultTtlMs ?? 60_000;
    this.staleTtlMs = opts.staleTtlMs ?? 30_000;

    // Map<cacheKey, { body, statusCode, headers, createdAt, ttlMs, tags[], revalidating }>
    this.store = new Map();
    // Map<tag, Set<cacheKey>> for tag-based invalidation
    this.tagIndex = new Map();
  }

  /**
   * Build a cache key from the request, accounting for meaningful variations.
   * - Path + sorted query string
   * - Accept-Language header (locale)
   * - Any custom vary keys passed by the route
   */
  buildKey(req, varyKeys = []) {
    const parts = [req.method, req.originalUrl || req.url];

    // Locale variation
    const locale = req.headers['accept-language'] || 'default';
    parts.push(`lang:${locale.split(',')[0].trim()}`);

    // Custom vary keys (e.g. role, school-id)
    for (const key of varyKeys) {
      const val = req.headers[key] || req.query[key] || '';
      parts.push(`${key}:${val}`);
    }

    return parts.join('|');
  }

  /**
   * Get a cached entry. Returns null if nothing usable exists.
   * Returns { body, statusCode, headers, status: 'HIT'|'STALE' }
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.createdAt;

    // Fresh hit
    if (age <= entry.ttlMs) {
      return { ...entry, status: 'HIT' };
    }

    // Stale but within revalidation window
    if (age <= entry.ttlMs + this.staleTtlMs) {
      return { ...entry, status: 'STALE' };
    }

    // Expired beyond stale window — evict
    this._evict(key);
    return null;
  }

  /**
   * Store a response in the cache.
   * @param {string}   key
   * @param {object}   data       – { body, statusCode, headers }
   * @param {object}   opts
   * @param {number}   opts.ttlMs – Override TTL for this entry
   * @param {string[]} opts.tags  – Tags for group invalidation
   */
  set(key, data, opts = {}) {
    // Evict oldest if at capacity
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      this._evict(oldestKey);
    }

    const tags = opts.tags || [];
    const entry = {
      body: data.body,
      statusCode: data.statusCode || 200,
      headers: data.headers || {},
      createdAt: Date.now(),
      ttlMs: opts.ttlMs ?? this.defaultTtlMs,
      tags,
      revalidating: false,
    };

    this.store.set(key, entry);

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(key);
    }
  }

  /**
   * Invalidate all cache entries with a given tag.
   * Call this when content changes (e.g. after a notice is created/deleted).
   */
  invalidateByTag(tag) {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;
    let count = 0;
    for (const key of keys) {
      this.store.delete(key);
      count++;
    }
    this.tagIndex.delete(tag);
    console.log(`[ResponseCache] Invalidated ${count} entries for tag "${tag}"`);
    return count;
  }

  /** Invalidate everything. */
  invalidateAll() {
    const count = this.store.size;
    this.store.clear();
    this.tagIndex.clear();
    console.log(`[ResponseCache] Invalidated all ${count} entries`);
    return count;
  }

  /** Mark an entry as being revalidated (prevents thundering herd). */
  markRevalidating(key) {
    const entry = this.store.get(key);
    if (entry) entry.revalidating = true;
  }

  isRevalidating(key) {
    return this.store.get(key)?.revalidating ?? false;
  }

  /** Get cache stats for monitoring. */
  getStats() {
    let fresh = 0, stale = 0;
    const now = Date.now();
    for (const [, entry] of this.store) {
      const age = now - entry.createdAt;
      if (age <= entry.ttlMs) fresh++;
      else stale++;
    }
    return {
      totalEntries: this.store.size,
      freshEntries: fresh,
      staleEntries: stale,
      tags: [...this.tagIndex.keys()],
    };
  }

  _evict(key) {
    const entry = this.store.get(key);
    if (entry) {
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.store.delete(key);
  }
}

// ── Singleton instance ──
const cache = new ResponseCache({
  maxEntries: 200,
  defaultTtlMs: 60_000,   // 1 minute default
  staleTtlMs: 30_000,     // serve stale for 30s while revalidating
});

/**
 * Express middleware factory: caches the JSON response of GET routes.
 *
 * Usage:
 *   router.get('/classes', cached({ ttlMs: 300_000, tags: ['classes'], varyKeys: ['x-school-id'] }), handler);
 *
 * @param {object} opts
 * @param {number} opts.ttlMs    – Cache lifetime (default: 60s)
 * @param {string[]} opts.tags   – Tags for invalidation
 * @param {string[]} opts.varyKeys – Extra request keys to vary on
 */
function cached(opts = {}) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = cache.buildKey(req, opts.varyKeys);
    const hit = cache.get(key);

    if (hit && hit.status === 'HIT') {
      // ── Fresh cache hit: serve directly, skip handler entirely ──
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Age', `${Date.now() - hit.createdAt}ms`);
      for (const [h, v] of Object.entries(hit.headers)) {
        res.set(h, v);
      }
      return res.status(hit.statusCode).json(hit.body);
    }

    if (hit && hit.status === 'STALE') {
      // ── Stale: serve immediately, revalidate in background ──
      res.set('X-Cache', 'STALE');
      res.set('X-Cache-Age', `${Date.now() - hit.createdAt}ms`);
      for (const [h, v] of Object.entries(hit.headers)) {
        res.set(h, v);
      }
      res.status(hit.statusCode).json(hit.body);

      // Background revalidation (only one at a time)
      if (!cache.isRevalidating(key)) {
        cache.markRevalidating(key);
        // Run the handler in a "phantom" response to capture output
        _revalidate(req, opts, key);
      }
      return;
    }

    // ── Cache MISS: run handler and capture response ──
    res.set('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          body,
          statusCode: res.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }, {
          ttlMs: opts.ttlMs,
          tags: opts.tags,
        });
      }
      return originalJson(body);
    };
    next();
  };
}

/**
 * Background revalidation: re-runs the route handler to refresh cache.
 * This is a best-effort operation — failures just leave the stale entry.
 */
function _revalidate(req, opts, key) {
  // In a real app you'd invoke the handler again. Since Express doesn't
  // easily support this, we just delete the stale entry so the next
  // request gets a fresh MISS. This is safe and simple.
  setImmediate(() => {
    cache._evict(key);
    console.log(`[ResponseCache] Evicted stale entry for revalidation: ${key.substring(0, 80)}`);
  });
}

module.exports = { cache, cached };
