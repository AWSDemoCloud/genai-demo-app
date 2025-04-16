const DataProcessor = require('./components/DataProcessor');
const db = require('./utils/database');

// Initialize components
const processor = new DataProcessor();

/**
 * Main application function
 * @param {Object} input - Input data
 * @returns {Object} Processed results
 */
function processUserData(input) {
  try {
    // Get user data from database
    const userData = db.getUserById(input.userId);
    
    // Process user activities
    if (input.activities && Array.isArray(input.activities)) {
      const processedActivities = processor.processItems(input.activities);
      
      // Calculate activity statistics
      if (input.calculateStats && input.numericData) {
        const stats = processor.calculateStats(input.numericData);
        return {
          user: userData,
          processedActivities,
          statistics: stats
        };
      }
      
      return {
        user: userData,
        processedActivities
      };
    }
    
    return {
      user: userData,
      error: 'No activities provided'
    };
  } catch (error) {
    console.error('Error processing user data:', error);
    return {
      error: error.message
    };
  }
}

// Example usage
const result = processUserData({
  userId: 123,
  activities: ['login', 'view_profile', 'update_settings'],
  calculateStats: true,
  numericData: [5, 10, 15, 20, 25]
});

console.log('Result:', result);

module.exports = {
  processUserData
};
