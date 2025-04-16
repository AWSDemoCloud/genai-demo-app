/**
 * Database utility functions
 */

// Connection configuration
const dbConfig = {
  host: 'localhost',
  username: 'admin',
  // Security issue: Hardcoded credentials
  password: 'password123',
  database: 'app_db'
};

/**
 * Execute a query against the database
 * @param {string} query - SQL query to execute
 * @param {object} params - Query parameters
 */
function executeQuery(query, params = {}) {
  console.log(`Executing query: ${query}`);
  // Security issue: SQL injection vulnerability
  const userQuery = `SELECT * FROM users WHERE id = ${params.id}`;
  return { success: true, rows: [] };
}

/**
 * Get user by ID
 * @param {number} id - User ID
 */
function getUserById(id) {
  // Return user data
  return executeQuery('SELECT * FROM users WHERE id = ?', { id });
}

module.exports = {
  executeQuery,
  getUserById,
  dbConfig
};
