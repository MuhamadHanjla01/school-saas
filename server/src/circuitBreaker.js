/**
 * Circuit Breaker implementation for protecting against cascading dependency failures.
 *
 * States:
 *   CLOSED   – normal operation, requests pass through
 *   OPEN     – dependency is failing, requests fast-fail immediately
 *   HALF_OPEN – cooldown expired, a single probe request is allowed through
 *
 * Features:
 *   - Failure threshold before tripping
 *   - Configurable cooldown before probing recovery
 *   - Per-call timeout so a hanging dependency doesn't block forever
 *   - Concurrency limit so a slow dependency can't exhaust all connections/threads
 *   - Optional fallback function when circuit is open
 */

const STATES = Object.freeze({
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
});

class CircuitBreaker {
  /**
   * @param {string}   name                  – Human-readable name (for logging)
   * @param {object}   opts
   * @param {number}   opts.failureThreshold – Consecutive failures before tripping (default 5)
   * @param {number}   opts.cooldownMs       – How long to stay OPEN before probing (default 10 000 ms)
   * @param {number}   opts.timeoutMs        – Per-call timeout (default 5 000 ms)
   * @param {number}   opts.maxConcurrency   – Max in-flight calls to this dependency (default 10)
   * @param {function} opts.fallback         – Optional async fn returning a fallback value
   */
  constructor(name, opts = {}) {
    this.name = name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.cooldownMs = opts.cooldownMs ?? 10_000;
    this.timeoutMs = opts.timeoutMs ?? 5_000;
    this.maxConcurrency = opts.maxConcurrency ?? 10;
    this.fallback = opts.fallback ?? null;

    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.inFlight = 0;
  }

  /**
   * Execute `fn` through the circuit breaker.
   * @param {function} fn – An async function representing the dependency call
   * @returns {Promise<*>}
   */
  async fire(fn) {
    // ── OPEN state: fast-fail or fallback ──
    if (this.state === STATES.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
        // Transition to HALF_OPEN – let one probe through
        this.state = STATES.HALF_OPEN;
        console.log(`[CircuitBreaker:${this.name}] OPEN → HALF_OPEN (probing)`);
      } else {
        return this._fastFail();
      }
    }

    // ── Concurrency gate ──
    if (this.inFlight >= this.maxConcurrency) {
      console.warn(`[CircuitBreaker:${this.name}] Concurrency limit reached (${this.maxConcurrency})`);
      return this._fastFail();
    }

    this.inFlight++;

    try {
      const result = await this._callWithTimeout(fn);
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    } finally {
      this.inFlight--;
    }
  }

  // ── Internals ──

  _callWithTimeout(fn) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[CircuitBreaker:${this.name}] Call timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      fn()
        .then((val) => { clearTimeout(timer); resolve(val); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  _onSuccess() {
    if (this.state === STATES.HALF_OPEN) {
      console.log(`[CircuitBreaker:${this.name}] HALF_OPEN → CLOSED (recovered)`);
    }
    this.failureCount = 0;
    this.state = STATES.CLOSED;
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(
      `[CircuitBreaker:${this.name}] Failure #${this.failureCount}/${this.failureThreshold}`
    );
    if (this.failureCount >= this.failureThreshold || this.state === STATES.HALF_OPEN) {
      this.state = STATES.OPEN;
      console.error(`[CircuitBreaker:${this.name}] → OPEN (tripped)`);
    }
  }

  async _fastFail() {
    if (this.fallback) {
      console.log(`[CircuitBreaker:${this.name}] Serving fallback (circuit OPEN)`);
      return this.fallback();
    }
    throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN – fast-failing`);
  }

  /** Expose state for health checks */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      inFlight: this.inFlight,
    };
  }
}

module.exports = { CircuitBreaker, STATES };
