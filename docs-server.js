const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const PORT = process.env.DOCS_PORT || 3002;

// Load the OpenAPI spec
const swaggerDocument = YAML.load(path.join(__dirname, 'api-docs.yaml'));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.listen(PORT, () => {
  console.log(`📚 API Documentation server running at http://localhost:${PORT}/api-docs`);
  console.log(`📖 Open http://localhost:${PORT} in your browser to view the docs`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`📚 API Documentation server running at http://localhost:${PORT + 1}/api-docs`);
      console.log(`📖 Open http://localhost:${PORT + 1} in your browser to view the docs`);
    });
  } else {
    console.error('Error starting server:', err);
  }
});

