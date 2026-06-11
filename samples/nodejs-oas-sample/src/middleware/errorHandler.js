/**
 * Global error handling middleware.
 * Catches unhandled errors and returns a standardized JSON error response.
 */
function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);

  // Handle JSON parse errors from malformed request bodies
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON'
      }
    });
  }

  // Default to 500 Internal Server Error for unhandled exceptions
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  });
}

module.exports = errorHandler;
