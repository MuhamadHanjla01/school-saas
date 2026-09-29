import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

// ─── LRU Cache (Doubly Linked List + HashMap) ─────────────────────────────
// O(1) get and set, automatically evicts least recently used entries

class LRUNode {
  constructor(key, value, expiresAt) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(maxSize = 50, ttlMs = 5 * 60_000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.map = new Map();        // key → LRUNode  — O(1) lookup
    this.head = new LRUNode('', null, 0); // sentinel head (most recent)
    this.tail = new LRUNode('', null, 0); // sentinel tail (least recent)
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.inflight = new Map();   // key → Promise  — request deduplication
    this.generation = 0; // Reject pending work from a previous session.
  }

  // Move node to front (most recently used) — O(1)
  _moveToFront(node) {
    // Remove from current position
    node.prev.next = node.next;
    node.next.prev = node.prev;
    // Insert after head
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // Remove LRU node from tail — O(1)
  _evict() {
    const lru = this.tail.prev;
    if (lru === this.head) return;
    lru.prev.next = this.tail;
    this.tail.prev = lru.prev;
    this.map.delete(lru.key);
  }

  // Get a cached value — O(1)
  get(key) {
    const node = this.map.get(key);
    if (!node) return { hit: false, value: null, stale: false };
    const stale = Date.now() > node.expiresAt;
    this._moveToFront(node);
    return { hit: true, value: node.value, stale };
  }

  // Set a value — O(1)
  set(key, value) {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      existing.expiresAt = Date.now() + this.ttlMs;
      this._moveToFront(existing);
      return;
    }
    if (this.map.size >= this.maxSize) this._evict();
    const node = new LRUNode(key, value, Date.now() + this.ttlMs);
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    this.map.set(key, node);
  }

  // Invalidate a specific key — O(1)
  invalidate(key) {
    const node = this.map.get(key);
    if (!node) return;
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.map.delete(key);
  }

  // Invalidate all keys matching a prefix — O(n) but rare
  invalidateByPrefix(prefix) {
    for (const [key] of this.map) {
      if (key.startsWith(prefix)) this.invalidate(key);
    }
  }

  // Clear the entire cache
  clear() {
    this.generation += 1;
    this.inflight.clear();
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size() { return this.map.size; }
}

// Singleton cache instance shared across all hook consumers
const globalCache = new LRUCache(80, 5 * 60_000);

/**
 * useDataCache — React hook that wraps axios.get with an LRU cache.
 *
 * Features:
 *   - O(1) cache hit/miss via doubly-linked list + HashMap
 *   - Request deduplication: concurrent identical requests share one promise
 *   - Stale-While-Revalidate: returns stale data immediately, refreshes in background
 *   - Configurable TTL per call
 *
 * @param {string} url        — API endpoint to fetch
 * @param {object} options    — { enabled, ttlMs, transform, deps }
 * @returns {{ data, loading, error, refresh, invalidate }}
 */
export function useDataCache(url, options = {}) {
  const { enabled = true, ttlMs, transform, deps = [] } = options;
  const [data, setData] = useState(() => {
    if (!url || !enabled) return null;
    const cached = globalCache.get(url);
    return cached.hit ? cached.value : null;
  });
  const [loading, setLoading] = useState(!data && enabled && !!url);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetchData = useCallback(async (background = false) => {
    if (!url || !enabled) return;
    const generation = globalCache.generation;
    if (!background) setLoading(true);
    setError(null);

    // Request deduplication: if same URL is already in-flight, reuse the promise
    let promise = globalCache.inflight.get(url);
    if (!promise) {
      promise = axios.get(url).then(res => res.data);
      globalCache.inflight.set(url, promise);
    }

    try {
      let result = await promise;
      if (generation !== globalCache.generation) return;
      if (transform) result = transform(result);
      globalCache.set(url, result);
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current && generation === globalCache.generation) setError(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      if (globalCache.inflight.get(url) === promise) globalCache.inflight.delete(url);
      if (mountedRef.current && generation === globalCache.generation) setLoading(false);
    }
  }, [url, enabled, transform]);

  useEffect(() => {
    if (!url || !enabled) { setLoading(false); return; }

    const cached = globalCache.get(url);
    if (cached.hit) {
      setData(cached.value);
      if (cached.stale) {
        // Stale-While-Revalidate: serve cached data, refresh in background
        fetchData(true);
      } else {
        setLoading(false);
      }
    } else {
      fetchData(false);
    }
  }, [url, enabled, fetchData, ...deps]);

  const refresh = useCallback(() => fetchData(false), [fetchData]);
  const invalidate = useCallback(() => { globalCache.invalidate(url); }, [url]);

  return { data, loading, error, refresh, invalidate };
}

/**
 * Binary search insertion — inserts an item into a sorted array maintaining order.
 * O(log n) search + O(n) shift, but much better than sort-all for single insertions.
 *
 * @param {Array} arr     — sorted array
 * @param {*}     item    — item to insert
 * @param {Function} compareFn — (a, b) => number, like Array.sort
 * @returns {Array} — the array with the item inserted
 */
export function binaryInsert(arr, item, compareFn) {
  let low = 0, high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (compareFn(arr[mid], item) < 0) low = mid + 1;
    else high = mid;
  }
  arr.splice(low, 0, item);
  return arr;
}

/**
 * Expose cache utilities for external invalidation (e.g., after POST/PUT/DELETE)
 */
export const dataCache = {
  invalidate: (key) => globalCache.invalidate(key),
  invalidateByPrefix: (prefix) => globalCache.invalidateByPrefix(prefix),
  clear: () => globalCache.clear(),
  get size() { return globalCache.size; },
};
