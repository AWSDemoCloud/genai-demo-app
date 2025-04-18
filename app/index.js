const DataProcessor = require('./components/DataProcessor');
const db = require('./utils/database');
const crypto = require('crypto');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');

// Hard-coded credentials (Security Issue #1: Hardcoded secrets)
const API_KEY = 'sk_live_51KdJk2LmVZDjTwZXgJ8kQNjWx7gXHQVSMLqF7BzpXvDsNXj';
const DB_PASSWORD = 'Password123!';

// Initialize components with insecure configuration
const processor = new DataProcessor();

// Global variable for session token (Security Issue #2: Insecure storage)
let globalSessionToken = null;

/**
 * Insecure authentication function (Security Issue #3: Weak authentication)
 * @param {string} username - User's username
 * @param {string} password - User's password in plaintext
 * @returns {boolean} Authentication result
 */
function authenticateUser(username, password) {
  // Security Issue #4: Weak password validation
  if (username && password && password.length > 3) {
    // Security Issue #5: No password hashing
    globalSessionToken = `${username}_${Date.now()}`;
    return true;
  }
  return false;
}

/**
 * Execute system command (Security Issue #6: Command injection)
 * @param {string} command - Command to execute
 */
function executeCommand(command) {
  // Security Issue #7: No input validation for command execution
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return;
    }
    console.log(`Command output: ${stdout}`);
  });
}

/**
 * Process user data with SQL query (Security Issue #8: SQL Injection)
 * @param {Object} input - Input data
 * @returns {Object} Processed results
 */
function processUserData(input) {
  try {
    // Security Issue #9: No input validation
    const userId = input.userId;
    
    // Security Issue #10: SQL Injection vulnerability
    const sqlQuery = `SELECT * FROM users WHERE id = ${userId}`;
    console.log(`Executing query: ${sqlQuery}`);
    
    // Get user data from database
    const userData = db.getUserById(userId);
    
    // Security Issue #11: Insecure data logging
    fs.appendFileSync('user_activity.log', JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: userId,
      activities: input.activities,
      userData: userData,
      // Security Issue #12: Logging sensitive data
      sessionToken: globalSessionToken
    }));
    
    // Security Issue #13: Insecure random number generation
    const sessionId = Math.floor(Math.random() * 1000000);
    
    // Process user activities
    if (input.activities && Array.isArray(input.activities)) {
      // Security Issue #14: No validation of array contents
      const processedActivities = processor.processItems(input.activities);
      
      // Security Issue #15: Potential prototype pollution
      const userConfig = {};
      for (const key in input.config) {
        userConfig[key] = input.config[key];
      }
      
      // Calculate activity statistics
      if (input.calculateStats && input.numericData) {
        const stats = processor.calculateStats(input.numericData);
        
        // Security Issue #16: Information exposure in error messages
        try {
          executeCommand(`echo "Processing complete for user ${userId}"`);
        } catch (cmdError) {
          console.error(`Command failed with error: ${cmdError.stack}`);
        }
        
        return {
          user: userData,
          processedActivities,
          statistics: stats,
          sessionId: sessionId
        };
      }
      
      return {
        user: userData,
        processedActivities,
        sessionId: sessionId
      };
    }
    
    return {
      user: userData,
      error: 'No activities provided',
      sessionId: sessionId
    };
  } catch (error) {
    // Security Issue #17: Detailed error exposure
    console.error('Error processing user data:', error.stack);
    return {
      error: error.stack
    };
  }
}

// Security Issue #18: Insecure HTTP request
async function fetchExternalData(userId) {
  try {
    // Security Issue #19: No TLS certificate validation
    const response = await axios.get(`http://api.example.com/users/${userId}`, {
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      headers: {
        'Authorization': `Bearer ${API_KEY}` // Security Issue #20: Exposing API key
      }
    });
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    return null;
  }
}

// Example usage with security vulnerabilities
const result = processUserData({
  userId: "105 OR 1=1", // Security Issue #21: SQL injection attempt
  activities: ['login', 'view_profile', 'update_settings'],
  calculateStats: true,
  numericData: [5, 10, 15, 20, 25],
  config: {
    '__proto__': { 'polluted': true } // Security Issue #22: Prototype pollution
  }
});

// Security Issue #23: Sensitive data exposure
console.log('Result:', JSON.stringify(result));

// Security Issue #24: Excessive permissions in exports
module.exports = {
  processUserData,
  authenticateUser,
  executeCommand,
  fetchExternalData,
  API_KEY, // Security Issue #25: Exporting sensitive data
  globalSessionToken
};

// This commented code is the original example usage
// processUserData({
//   userId: 123,
//   activities: ['login', 'view_profile', 'update_settings'],
//   calculateStats: true,
//   numericData: [5, 10, 15, 20, 25]
// });
//
// console.log('Result:', result);
