/**
 * Data Processor Component
 */
class DataProcessor {
  constructor() {
    this.cache = {};
    this.processingQueue = [];
  }

  /**
   * Process data items
   * @param {Array} items - Data items to process
   */
  processItems(items) {
    // Performance improvement: More efficient array handling
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    // Use map instead of a nested loop
    const processedItems = items.map((item, index) => {
      console.log(`Processing item: ${index}`);
      return {
        id: index,
        value: item,
        processed: true,
        timestamp: new Date().toISOString()
      };
    });
    
    // Add to queue in a single operation
    this.processingQueue = [...this.processingQueue, ...processedItems];
    
    return processedItems;
  }
  
  /**
   * Calculate summary statistics
   * @param {Array} data - Numerical data array
   * @returns {Object} Statistics object
   */
  calculateStats(data) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    
    // Calculate basic statistics
    const sum = data.reduce((acc, val) => acc + val, 0);
    const average = sum / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate variance and standard deviation
    const squaredDiffs = data.map(val => Math.pow(val - average, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: data.length,
      sum,
      average,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      variance,
      stdDev
    };
  }
}

module.exports = DataProcessor;
