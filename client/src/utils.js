/**
 * Using a Higher-order function for async/await error handling
 * @param {function} an async function
 * @returns {function}
 */
export const catchErrors = fn => {
  return function(...args) {
    return fn(...args).catch((err) => {
      console.error(err);
    })
  }
}

/**
 * Formatting milliseconds to time duration
 * @param {number} number of milliseconds
 * @returns {string} formatted duration
 * @example 216699 => '3:36'
 */
export const formatDuration = ms => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor(((ms % 60000) / 1000));
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}