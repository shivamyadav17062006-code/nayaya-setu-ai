/**
 * Executes an asynchronous function with limited retries and exponential backoff.
 * Ideal for handling transient 429 (Rate Limit) or 503 (Provider Unavailable) conditions.
 *
 * @param {Function} fn - Async function to execute
 * @param {Object} options
 * @param {number} [options.maxRetries=2] - Number of retry attempts
 * @param {number} [options.initialDelayMs=500] - Initial delay in ms
 * @param {number} [options.backoffFactor=2] - Exponential multiplier
 * @param {Function} [options.shouldRetry] - Custom predicate function (err) => boolean
 * @returns {Promise<any>}
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 2,
    initialDelayMs = 500,
    backoffFactor = 2,
    shouldRetry = (err) => {
      const msg = (err?.message || '').toLowerCase();
      // Retry on network drops, timeouts, 429 quota spikes, and 503 unavailable
      return (
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('503') ||
        msg.includes('timeout') ||
        msg.includes('econnreset') ||
        msg.includes('network')
      );
    },
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !shouldRetry(err)) {
        throw err;
      }
      console.warn(`[RetryUtil] Transient failure encountered (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }
}

/**
 * Wraps a promise in a strict timeout.
 *
 * @param {Promise} promise - Target promise
 * @param {number} ms - Milliseconds to wait
 * @param {string} [timeoutMessage='Operation timed out']
 * @returns {Promise<any>}
 */
export function withTimeout(promise, ms, timeoutMessage = 'Operation timed out') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(timeoutMessage);
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}
