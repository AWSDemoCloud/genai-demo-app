/**
 * GenAI Demo App - Main Application
 * 
 * This Express application demonstrates a simple API that can be used
 * to trigger the GitHub PR workflow with AWS Bedrock integration.
 */

const express = require('express');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

/**
 * Root endpoint - Health check
 */
app.get('/', (_, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    message: 'GenAI Demo App is running'
  });
});

/**
 * API endpoint to get user data
 * @param {string} id - User ID
 */
app.get('/api/users/:id', validateUserId, (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = getUserById(userId);
    res.json(user);
  } catch (error) {
    res.status(404).json({
      error: 'User not found',
      message: error.message
    });
  }
});

/**
 * API endpoint to create a new document
 */
app.post('/api/documents', (req, res) => {
  const { title, content, tags } = req.body;
  
  // Input validation
  if (!title || !content) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Title and content are required'
    });
  }
  
  // Create document
  const document = createDocument(title, content, tags);
  
  res.status(201).json({
    message: 'Document created successfully',
    document
  });
});

/**
 * API endpoint to search documents
 */
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Search query is required'
    });
  }
  
  const results = searchDocuments(query);
  
  res.json({
    query,
    count: results.length,
    results
  });
});

/**
 * Middleware to validate user ID
 */
function validateUserId(req, res, next) {
  const userId = req.params.id;
  
  if (!userId || !/^[a-zA-Z0-9-]+$/.test(userId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid user ID format'
    });
  }
  
  next();
}

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Object} User object
 */
function getUserById(id) {
  // In a real app, this would query a database
  const users = {
    'user-1': { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    'user-2': { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' }
  };
  
  if (!users[id]) {
    throw new Error(`User with ID ${id} not found`);
  }
  
  return users[id];
}

/**
 * Create a new document
 * @param {string} title - Document title
 * @param {string} content - Document content
 * @param {string[]} tags - Document tags
 * @returns {Object} Created document
 */
function createDocument(title, content, tags = []) {
  // In a real app, this would insert into a database
  const document = {
    id: `doc-${Date.now()}`,
    title,
    content,
    tags,
    createdAt: new Date().toISOString()
  };
  
  return document;
}

/**
 * Search documents by query
 * @param {string} query - Search query
 * @returns {Object[]} Matching documents
 */
function searchDocuments(query) {
  // In a real app, this would search a database
  const documents = [
    { id: 'doc-1', title: 'Introduction to AWS Bedrock', content: 'AWS Bedrock is a fully managed service...' },
    { id: 'doc-2', title: 'GitHub Actions Workflow', content: 'GitHub Actions helps you automate your workflows...' },
    { id: 'doc-3', title: 'Lambda Functions', content: 'AWS Lambda lets you run code without provisioning servers...' }
  ];
  
  return documents.filter(doc => 
    doc.title.toLowerCase().includes(query.toLowerCase()) || 
    doc.content.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Start the server
 * @returns {Object} Express server instance
 */
function start() {
  const PORT = process.env.PORT || 3000;
  return app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Start server if running directly
if (require.main === module) {
  start();
}

// Export for testing
module.exports = { 
  app, 
  start,
  getUserById,
  createDocument,
  searchDocuments
};
// Adding a comment to test PR enhancement
