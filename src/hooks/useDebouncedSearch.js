import { useCallback, useMemo, useRef, useState } from 'react';

// ─── Trie for O(L) prefix search ──────────────────────────────────────────
// L = length of the search query. Much faster than Array.filter for large lists.

class TrieNode {
  constructor() {
    this.children = new Map();  // char → TrieNode
    this.items = [];            // items whose names pass through this node
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert an item with a searchable key — O(K) where K = key length
  insert(key, item) {
    let node = this.root;
    for (const char of key.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
      node.items.push(item);
    }
  }

  // Search by prefix — O(L) where L = prefix length
  search(prefix) {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char);
    }
    return node.items;
  }

  // Clear the entire trie
  clear() {
    this.root = new TrieNode();
  }
}

/**
 * useDebouncedSearch — React hook for debounced search with optional Trie indexing.
 *
 * When `items` are provided, builds a Trie for O(L) prefix search locally.
 * Otherwise, just debounces the query string for use with API calls.
 *
 * @param {object} options
 * @param {Array}  options.items     — optional array of items to search locally
 * @param {string} options.nameKey   — key to extract searchable text (default: 'name')
 * @param {number} options.delay     — debounce delay in ms (default: 300)
 * @returns {{ query, setQuery, debouncedQuery, results }}
 */
export function useDebouncedSearch(options = {}) {
  const { items = null, nameKey = 'name', delay = 300 } = options;
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef(null);

  // Build Trie index from items — only rebuilds when items reference changes
  const trie = useMemo(() => {
    if (!items || items.length === 0) return null;
    const t = new Trie();
    items.forEach(item => {
      const key = typeof item === 'string' ? item : item[nameKey];
      if (key) t.insert(key, item);
    });
    return t;
  }, [items, nameKey]);

  // Debounced query setter
  const handleQueryChange = useCallback((value) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, delay);
  }, [delay]);

  // If items + Trie available, use O(L) Trie search; otherwise return null
  const results = useMemo(() => {
    if (!trie || !debouncedQuery.trim()) return items || [];
    // Deduplicate results (Trie may return same item from multiple prefix paths)
    const seen = new Set();
    return trie.search(debouncedQuery.trim()).filter(item => {
      const id = item.id || (typeof item === 'string' ? item : item[nameKey]);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [trie, debouncedQuery, items, nameKey]);

  return { query, setQuery: handleQueryChange, debouncedQuery, results };
}
