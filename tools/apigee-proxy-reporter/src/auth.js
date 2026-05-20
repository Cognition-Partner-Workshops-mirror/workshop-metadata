/**
 * auth.js
 *
 * Provides authentication helpers for both Apigee X (Google Cloud OAuth)
 * and Apigee Edge (basic auth).  Exports a single function that returns
 * the appropriate Authorization header based on the configured auth type.
 */

const { GoogleAuth } = require('google-auth-library');
const { config } = require('./config');

// Google Cloud OAuth scope required by the Apigee Management API
const APIGEE_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

/**
 * Obtain an OAuth2 access token via Google Cloud service account or
 * Application Default Credentials (ADC).
 *
 * @returns {Promise<string>} Bearer access token
 */
async function getGoogleAccessToken() {
  // Build auth client options; use explicit key file when provided
  const authOptions = { scopes: [APIGEE_SCOPE] };
  if (config.googleCredentialsPath) {
    authOptions.keyFile = config.googleCredentialsPath;
  }

  const auth = new GoogleAuth(authOptions);
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse || !tokenResponse.token) {
    throw new Error(
      'Failed to obtain Google Cloud access token. Verify your service account key or ADC setup.'
    );
  }

  return tokenResponse.token;
}

/**
 * Build a Base64-encoded Basic auth string from username and password.
 *
 * @returns {string} Base64 encoded "username:password"
 */
function getBasicAuthToken() {
  const credentials = `${config.apigeeUsername}:${config.apigeePassword}`;
  return Buffer.from(credentials).toString('base64');
}

/**
 * Return an object containing the Authorization header suitable for the
 * configured authentication type.
 *
 * For Apigee X  (oauth): { Authorization: "Bearer <token>" }
 * For Apigee Edge (basic): { Authorization: "Basic <base64>" }
 *
 * @returns {Promise<Object>} Headers object with the Authorization key
 */
async function getAuthHeaders() {
  if (config.authType === 'oauth') {
    const token = await getGoogleAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  // Basic auth for Apigee Edge
  const token = getBasicAuthToken();
  return { Authorization: `Basic ${token}` };
}

module.exports = { getAuthHeaders };
