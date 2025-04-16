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
    // Performance issue: Inefficient array manipulation
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Process each item
      this.processingQueue.push(item);
      
      // Inefficient nested loop
      for (let j = 0; j < this.processingQueue.length; j++) {
        console.log(`Processing item: ${j}`);
      }
    }
    
    return this.processingQueue;
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
