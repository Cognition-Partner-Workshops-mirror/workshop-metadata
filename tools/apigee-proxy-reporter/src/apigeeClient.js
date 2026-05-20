/**
 * apigeeClient.js
 *
 * Axios-based HTTP client for the Apigee Management API.  Supports both
 * Apigee X (googleapis.com) and Apigee Edge (enterprise.apigee.com) base
 * URLs.  Includes automatic retry with exponential back-off for 429
 * (rate-limit) and 5xx server errors.
 */

const axios = require('axios');
const { config } = require('./config');
const { getAuthHeaders } = require('./auth');

// -------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------

/** Maximum number of retry attempts for transient / rate-limited errors */
const MAX_RETRIES = 5;

/** Initial delay (ms) before the first retry — doubled on each attempt */
const INITIAL_BACKOFF_MS = 1000;

/** HTTP status codes that trigger an automatic retry */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/**
 * Resolve the base URL for the Apigee Management API depending on the
 * configured authentication type.
 *
 * @returns {string} Base URL including the organization path segment
 */
function getBaseUrl() {
  if (config.authType === 'oauth') {
    // Apigee X / hybrid — Google Cloud endpoint
    return `https://apigee.googleapis.com/v1/organizations/${config.org}`;
  }
  // Apigee Edge — legacy endpoint
  return `https://api.enterprise.apigee.com/v1/organizations/${config.org}`;
}

/**
 * Sleep for the specified number of milliseconds.
 *
 * @param {number} ms - Duration to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an HTTP request with automatic retry and exponential back-off
 * for rate-limit (429) and server (5xx) errors.
 *
 * @param {Function} requestFn - Async function that performs the request
 * @returns {Promise<*>} Response from the request function
 */
async function requestWithRetry(requestFn) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      // Only retry on transient / rate-limited errors
      if (!status || !RETRYABLE_STATUS_CODES.has(status)) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        // Exponential back-off with a small random jitter to spread retries
        const delay =
          INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(
          `[retry] HTTP ${status} on attempt ${attempt + 1}/${MAX_RETRIES + 1} — retrying in ${Math.round(delay)}ms …`
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — surface the last error
  throw lastError;
}

// -------------------------------------------------------------------
// Public API functions
// -------------------------------------------------------------------

/**
 * List all API proxy names in the configured Apigee organization.
 *
 * Apigee X returns { proxies: [ { name }, … ] }
 * Apigee Edge returns a plain JSON array of proxy name strings.
 *
 * @returns {Promise<string[]>} Array of proxy name strings
 */
async function listApiProxies() {
  const headers = await getAuthHeaders();
  const url = `${getBaseUrl()}/apis`;

  const response = await requestWithRetry(() =>
    axios.get(url, { headers })
  );

  const data = response.data;

  // Apigee X returns an object with a "proxies" array of objects
  if (data && Array.isArray(data.proxies)) {
    return data.proxies.map((p) => p.name);
  }

  // Apigee Edge returns a flat array of name strings
  if (Array.isArray(data)) {
    return data;
  }

  // Fallback — empty list when the org has no proxies
  return [];
}

/**
 * Fetch full metadata for a single API proxy, including labels.
 *
 * @param {string} proxyName - Name of the API proxy
 * @returns {Promise<Object>} Proxy metadata object
 */
async function getApiProxyDetails(proxyName) {
  const headers = await getAuthHeaders();
  const url = `${getBaseUrl()}/apis/${encodeURIComponent(proxyName)}`;

  const response = await requestWithRetry(() =>
    axios.get(url, { headers })
  );

  return response.data;
}

/**
 * Fetch deployment information for a single API proxy.
 *
 * @param {string} proxyName - Name of the API proxy
 * @returns {Promise<Object>} Deployment metadata object
 */
async function getApiProxyDeployments(proxyName) {
  const headers = await getAuthHeaders();
  const url = `${getBaseUrl()}/apis/${encodeURIComponent(proxyName)}/deployments`;

  const response = await requestWithRetry(() =>
    axios.get(url, { headers })
  );

  return response.data;
}

module.exports = {
  listApiProxies,
  getApiProxyDetails,
  getApiProxyDeployments,
};
