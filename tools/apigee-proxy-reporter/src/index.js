/**
 * index.js
 *
 * Main entry point for the Apigee Proxy Reporter.
 *
 * Flow:
 *   1. Validate configuration
 *   2. Authenticate with the Apigee Management API
 *   3. List all API proxies in the organisation
 *   4. Fetch detailed metadata for each proxy (batched with concurrency
 *      limiting to respect API rate limits)
 *   5. Generate console, JSON, and CSV reports
 *   6. Print a summary
 */

const { config, validateConfig } = require('./config');
const { getAuthHeaders } = require('./auth');
const {
  listApiProxies,
  getApiProxyDetails,
} = require('./apigeeClient');
const { generateReport } = require('./reportGenerator');

// -------------------------------------------------------------------
// Concurrency helpers
// -------------------------------------------------------------------

/** Number of concurrent proxy-detail requests to issue at once */
const CONCURRENCY_LIMIT = 5;

/**
 * Process an array of items in batches, running at most `limit`
 * concurrent async operations at a time using Promise.allSettled.
 *
 * @param {Array}    items  - Items to process
 * @param {number}   limit  - Maximum concurrent operations
 * @param {Function} fn     - Async function to call for each item
 * @returns {Promise<PromiseSettledResult[]>} Settled results
 */
async function batchProcess(items, limit, fn) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const settled = await Promise.allSettled(batch.map(fn));
    results.push(...settled);
  }

  return results;
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

async function main() {
  try {
    // Step 1 — Validate configuration
    validateConfig();
    console.log(
      `Apigee Proxy Reporter — org: "${config.org}", auth: "${config.authType}"`
    );

    // Step 2 — Verify authentication before doing any real work
    console.log('Authenticating …');
    await getAuthHeaders();
    console.log('Authentication successful.\n');

    // Step 3 — Retrieve the full list of API proxy names
    console.log('Fetching API proxy list …');
    const proxyNames = await listApiProxies();
    console.log(`Found ${proxyNames.length} API proxy(ies).\n`);

    if (proxyNames.length === 0) {
      console.log('Nothing to report — the organisation has no proxies.');
      return;
    }

    // Step 4 — Fetch detailed metadata per proxy (batched)
    console.log(
      `Fetching proxy details (concurrency: ${CONCURRENCY_LIMIT}) …`
    );
    const settledResults = await batchProcess(
      proxyNames,
      CONCURRENCY_LIMIT,
      async (name) => {
        try {
          return await getApiProxyDetails(name);
        } catch (err) {
          // Log the error but surface it as a rejection so the rest continue
          const status = err.response?.status || 'unknown';
          console.error(
            `  [error] Failed to fetch details for "${name}" (HTTP ${status}): ${err.message}`
          );
          throw err;
        }
      }
    );

    // Separate fulfilled (successful) results from failures
    const proxies = [];
    let failedCount = 0;

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        proxies.push(result.value);
      } else {
        failedCount++;
      }
    }

    console.log(
      `\nSuccessfully fetched ${proxies.length} proxy detail(s), ${failedCount} failed.\n`
    );

    // Step 5 — Generate reports
    await generateReport(proxies);

    // Step 6 — Print summary
    const withLabels = proxies.filter(
      (p) => p.labels && Object.keys(p.labels).length > 0
    ).length;
    const withoutLabels = proxies.length - withLabels;

    console.log('\n=== Summary ===');
    console.log(`Total proxies:          ${proxies.length}`);
    console.log(`Proxies with labels:    ${withLabels}`);
    console.log(`Proxies without labels: ${withoutLabels}`);
    if (failedCount > 0) {
      console.log(`Failed fetches:         ${failedCount}`);
    }
    console.log('');
  } catch (error) {
    console.error(`\n[fatal] ${error.message}`);
    process.exit(1);
  }
}

// Run the application
main();
