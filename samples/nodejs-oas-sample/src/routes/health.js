const express = require('express');
const router = express.Router();

// Import package.json to get the application version
const packageJson = require('../../package.json');

/**
 * GET /api/v1/health
 * Returns the health status, current timestamp, and app version
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: packageJson.version
  });
});

module.exports = router;
