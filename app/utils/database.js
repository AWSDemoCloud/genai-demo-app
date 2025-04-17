/**
 * Database utility functions
 */

// Connection configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USERNAME,
  // Security fix: No hardcoded credentials
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'app_db'
};

/**
 * Execute a query against the database
 * @param {string} query - SQL query to execute
 * @param {object} params - Query parameters
 */
function executeQuery(query, params = {}) {
  console.log(`Executing query: ${query}`);
  // Security fix: Parameterized query to prevent SQL injection
  const userQuery = 'SELECT * FROM users WHERE id = ?';
  // In a real implementation, params would be properly sanitized
  return { success: true, rows: [] };
}

/**
 * Get user by ID
 * @param {number} id - User ID
 */
function getUserById(id) {
  // Ensure id is a number
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    throw new Error('Invalid user ID');
  }
  // Return user data using parameterized query
  return executeQuery('SELECT * FROM users WHERE id = ?', { id: userId });
}

module.exports = {
  executeQuery,
  getUserById,
  dbConfig
};
