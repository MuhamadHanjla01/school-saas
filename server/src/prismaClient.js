const { PrismaClient } = require('@prisma/client');
const { CircuitBreaker } = require('./circuitBreaker');

const prisma = new PrismaClient();

/**
 * Circuit breaker wrapping the database dependency.
 *
 * If the DB becomes slow (>3 s per query) or starts throwing errors,
 * the breaker trips after 5 consecutive failures and fast-fails for
 * 15 seconds, preventing request pile-up.
 *
 * Max 20 concurrent DB calls are allowed through at once – any excess
 * will fast-fail rather than queue up and exhaust memory/connections.
 */
const dbBreaker = new CircuitBreaker('database', {
  failureThreshold: 5,
  cooldownMs: 15_000,
  timeoutMs: 3_000,
  maxConcurrency: 20,
  fallback: null, // no fallback – callers should handle the error
});

/**
 * Execute a database operation through the circuit breaker.
 *
 * Usage:
 *   const user = await dbCall(() => prisma.user.findUnique({ where: { id } }));
 *
 * @param {function} fn - An async function performing a Prisma query
 * @returns {Promise<*>}
 */
async function dbCall(fn) {
  return dbBreaker.fire(fn);
}

module.exports = prisma;
module.exports.dbCall = dbCall;
module.exports.dbBreaker = dbBreaker;
