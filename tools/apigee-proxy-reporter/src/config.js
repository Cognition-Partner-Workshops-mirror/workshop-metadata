/**
 * config.js
 *
 * Loads environment variables from a .env file using dotenv and exports
 * a configuration object consumed by the rest of the application.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env from the project root directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Supported authentication types:
 *   - "oauth"  : Apigee X / hybrid via Google Cloud service account
 *   - "basic"  : Apigee Edge via username + password (legacy)
 */
const AUTH_TYPE_OAUTH = 'oauth';
const AUTH_TYPE_BASIC = 'basic';

const config = {
  // Apigee organization name (required)
  org: process.env.APIGEE_ORG || '',

  // Authentication type: "oauth" (Apigee X) or "basic" (Apigee Edge)
  authType: (process.env.APIGEE_AUTH_TYPE || AUTH_TYPE_OAUTH).toLowerCase(),

  // Path to Google Cloud service account JSON key file (Apigee X / hybrid)
  googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',

  // Basic auth credentials for Apigee Edge (legacy)
  apigeeUsername: process.env.APIGEE_USERNAME || '',
  apigeePassword: process.env.APIGEE_PASSWORD || '',

  // Output options — set to "true" to enable JSON / CSV report files
  outputJson: (process.env.OUTPUT_JSON || 'true').toLowerCase() === 'true',
  outputCsv: (process.env.OUTPUT_CSV || 'true').toLowerCase() === 'true',
};

/**
 * Validate that required configuration values are present before the
 * application proceeds.  Throws a descriptive error on failure.
 */
function validateConfig() {
  if (!config.org) {
    throw new Error(
      'APIGEE_ORG is required. Set it in .env or as an environment variable.'
    );
  }

  if (
    config.authType !== AUTH_TYPE_OAUTH &&
    config.authType !== AUTH_TYPE_BASIC
  ) {
    throw new Error(
      `APIGEE_AUTH_TYPE must be "${AUTH_TYPE_OAUTH}" or "${AUTH_TYPE_BASIC}". Got: "${config.authType}"`
    );
  }

  // OAuth path requires a service account key file (or Application Default Credentials)
  if (config.authType === AUTH_TYPE_OAUTH && !config.googleCredentialsPath) {
    console.warn(
      'GOOGLE_APPLICATION_CREDENTIALS is not set. Falling back to Application Default Credentials (ADC).'
    );
  }

  // Basic auth path requires username and password
  if (config.authType === AUTH_TYPE_BASIC) {
    if (!config.apigeeUsername || !config.apigeePassword) {
      throw new Error(
        'APIGEE_USERNAME and APIGEE_PASSWORD are required when APIGEE_AUTH_TYPE is "basic".'
      );
    }
  }
}

module.exports = { config, validateConfig };
