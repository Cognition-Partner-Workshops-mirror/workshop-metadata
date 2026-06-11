const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Import route handlers
const petRoutes = require('./routes/pets');
const healthRoutes = require('./routes/health');

// Load the OpenAPI specification from the YAML file
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'openapi.yaml'));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Enable CORS for all origins
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON request bodies

// Serve Swagger UI at /api-docs for interactive API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pet Store API Documentation'
}));

// Mount API routes under the /api/v1 prefix
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/pets', petRoutes);

// Root endpoint redirects to API documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Global 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Global error handler for unexpected errors
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Start the server only when this file is run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
    console.log(`API base URL: http://localhost:${PORT}/api/v1`);
  });
}

// Export app for testing
module.exports = app;
