/**
 * reportGenerator.js
 *
 * Accepts collected API-proxy data and produces:
 *   1. Formatted console table output
 *   2. JSON report file  (report.json)   — optional, controlled by config
 *   3. CSV  report file  (report.csv)    — optional, controlled by config
 *
 * Report columns:
 *   Proxy Name | Labels (key=value) | Revision | Created At | Last Modified At
 */

const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { config } = require('./config');

// Output directory for generated reports
const OUTPUT_DIR = path.resolve(__dirname, '..');

/**
 * Format a Unix-epoch timestamp (seconds or milliseconds) into a
 * human-readable ISO-8601 string.  Returns "N/A" for falsy values.
 *
 * @param {number|string|undefined} ts - Timestamp value
 * @returns {string} Formatted date string
 */
function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  const numeric = Number(ts);
  if (Number.isNaN(numeric)) return String(ts);

  // Apigee X often returns milliseconds; Edge uses seconds
  const date =
    numeric > 1e12 ? new Date(numeric) : new Date(numeric * 1000);
  return date.toISOString();
}

/**
 * Convert a labels object ({ key: value, … }) into a single display
 * string of comma-separated key=value pairs.
 *
 * @param {Object|undefined} labels - Labels map from the proxy metadata
 * @returns {string} Formatted label string, or "—" when empty
 */
function formatLabels(labels) {
  if (!labels || typeof labels !== 'object') return '—';
  const entries = Object.entries(labels);
  if (entries.length === 0) return '—';
  return entries.map(([k, v]) => `${k}=${v}`).join(', ');
}

/**
 * Extract the latest revision number from the proxy metadata.
 *
 * Apigee X stores revisions in a "revision" array; the latest is the
 * last element.  Apigee Edge may use a similar structure or provide it
 * directly as a string.
 *
 * @param {Object} proxy - Proxy metadata object
 * @returns {string} Latest revision number
 */
function getLatestRevision(proxy) {
  if (Array.isArray(proxy.revision) && proxy.revision.length > 0) {
    return String(proxy.revision[proxy.revision.length - 1]);
  }
  if (proxy.latestRevisionId) return String(proxy.latestRevisionId);
  return 'N/A';
}

/**
 * Transform raw proxy metadata into a flat row suitable for display
 * and export.
 *
 * @param {Object} proxy - Raw proxy metadata from the Apigee API
 * @returns {Object} Normalized row object
 */
function buildRow(proxy) {
  return {
    proxyName: proxy.name || 'unknown',
    labels: formatLabels(proxy.labels),
    revision: getLatestRevision(proxy),
    createdAt: formatTimestamp(
      proxy.metaData?.createdAt || proxy.createdAt
    ),
    lastModifiedAt: formatTimestamp(
      proxy.metaData?.lastModifiedAt || proxy.lastModifiedAt
    ),
  };
}

// -------------------------------------------------------------------
// Console output
// -------------------------------------------------------------------

/**
 * Print a formatted summary table to the console.
 *
 * @param {Object[]} rows - Array of normalized row objects
 */
function printConsoleReport(rows) {
  if (rows.length === 0) {
    console.log('\nNo API proxies found in the organization.\n');
    return;
  }

  // Use console.table for a quick, readable overview
  console.log('\n=== Apigee API Proxy Report ===\n');
  console.table(
    rows.map((r) => ({
      'Proxy Name': r.proxyName,
      Labels: r.labels,
      Revision: r.revision,
      'Created At': r.createdAt,
      'Last Modified At': r.lastModifiedAt,
    }))
  );
}

// -------------------------------------------------------------------
// JSON output
// -------------------------------------------------------------------

/**
 * Write the report data to a JSON file.
 *
 * @param {Object[]} rows - Array of normalized row objects
 * @returns {string} Absolute path to the written file
 */
function writeJsonReport(rows) {
  const filePath = path.join(OUTPUT_DIR, 'report.json');
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf-8');
  return filePath;
}

// -------------------------------------------------------------------
// CSV output
// -------------------------------------------------------------------

/**
 * Write the report data to a CSV file using csv-writer.
 *
 * @param {Object[]} rows - Array of normalized row objects
 * @returns {Promise<string>} Absolute path to the written file
 */
async function writeCsvReport(rows) {
  const filePath = path.join(OUTPUT_DIR, 'report.csv');

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'proxyName', title: 'Proxy Name' },
      { id: 'labels', title: 'Labels' },
      { id: 'revision', title: 'Revision' },
      { id: 'createdAt', title: 'Created At' },
      { id: 'lastModifiedAt', title: 'Last Modified At' },
    ],
  });

  await csvWriter.writeRecords(rows);
  return filePath;
}

// -------------------------------------------------------------------
// Main entry point
// -------------------------------------------------------------------

/**
 * Generate all configured reports from the collected proxy data.
 *
 * @param {Object[]} proxies - Array of raw proxy metadata objects
 */
async function generateReport(proxies) {
  // Build normalized rows for every proxy
  const rows = proxies.map(buildRow);

  // Always print to the console
  printConsoleReport(rows);

  // Optionally write JSON report
  if (config.outputJson) {
    const jsonPath = writeJsonReport(rows);
    console.log(`JSON report written to: ${jsonPath}`);
  }

  // Optionally write CSV report
  if (config.outputCsv) {
    const csvPath = await writeCsvReport(rows);
    console.log(`CSV  report written to: ${csvPath}`);
  }
}

module.exports = { generateReport };
