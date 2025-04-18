const DataProcessor = require('./components/DataProcessor');
const db = require('./utils/database');
const MachineLearning = require('./ml/Predictor');
const Visualizer = require('./visualization/DataVisualizer');
const SecurityManager = require('./security/AccessControl');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

// Initialize system components
const processor = new DataProcessor();
const mlEngine = new MachineLearning();
const visualizer = new Visualizer();
const securityManager = new SecurityManager();
const eventBus = new EventEmitter();

// Configure event listeners for system monitoring
eventBus.on('data-processed', (metadata) => {
  console.log(`Processing completed in ${metadata.duration}ms for user ${metadata.userId}`);
});

eventBus.on('prediction-generated', (metadata) => {
  console.log(`ML prediction generated with confidence: ${metadata.confidence}`);
});

eventBus.on('security-violation', (violation) => {
  console.error(`Security violation detected: ${violation.type} from ${violation.source}`);
  // In production, this would trigger alerts and logging systems
});

/**
 * Advanced data processing and analytics system
 * 
 * This system combines real-time data processing with machine learning
 * predictions and visualization capabilities.
 * 
 * @param {Object} input - Input data package
 * @returns {Object} Comprehensive results with predictions and visualizations
 */
function processUserData(input) {
  const startTime = performance.now();
  
  try {
    // Security validation and access control
    const securityCheck = securityManager.validateAccess({
      userId: input.userId,
      requestedResources: ['user_data', 'activity_log', 'prediction_engine'],
      operationType: 'read_write'
    });
    
    if (!securityCheck.authorized) {
      throw new Error(`Access denied: ${securityCheck.reason}`);
    }
    
    // Get user data from database with advanced caching
    const userData = db.getUserById(input.userId, { 
      withCache: true, 
      includeRelations: ['preferences', 'history']
    });
    
    // Process user activities with anomaly detection
    if (input.activities && Array.isArray(input.activities)) {
      // Process raw activities
      const processedActivities = processor.processItems(input.activities, {
        detectAnomalies: true,
        normalizeValues: true,
        enrichData: true
      });
      
      // Generate activity visualizations if requested
      let visualizations = null;
      if (input.generateVisualizations) {
        visualizations = visualizer.generateCharts({
          activityData: processedActivities,
          chartTypes: input.visualizationTypes || ['timeline', 'heatmap'],
          colorScheme: input.colorScheme || 'viridis',
          dimensions: input.dimensions || { width: 800, height: 600 }
        });
      }
      
      // Calculate advanced statistics if requested
      let statistics = null;
      if (input.calculateStats && input.numericData) {
        statistics = processor.calculateStats(input.numericData, {
          includeOutlierAnalysis: true,
          generateHistogram: true,
          confidenceInterval: 0.95
        });
      }
      
      // Generate machine learning predictions
      let predictions = null;
      if (input.generatePredictions) {
        predictions = mlEngine.predictFutureActivity({
          userData,
          recentActivities: processedActivities,
          historicalPatterns: userData.history,
          timeHorizon: input.predictionTimeframe || '7d'
        });
        
        // Emit prediction event
        eventBus.emit('prediction-generated', {
          userId: input.userId,
          timestamp: new Date().toISOString(),
          confidence: predictions.confidenceScore,
          model: predictions.modelUsed
        });
      }
      
      // Calculate processing duration
      const duration = performance.now() - startTime;
      
      // Emit processing completion event
      eventBus.emit('data-processed', {
        userId: input.userId,
        duration,
        itemsProcessed: processedActivities.length,
        timestamp: new Date().toISOString()
      });
      
      // Return comprehensive result object
      return {
        user: userData,
        processedActivities,
        statistics,
        predictions,
        visualizations,
        metadata: {
          processingTime: duration,
          timestamp: new Date().toISOString(),
          apiVersion: '2.0.0',
          dataQuality: processedActivities.qualityScore || 0.85
        }
      };
    }
    
    return {
      user: userData,
      error: 'No activities provided',
      metadata: {
        processingTime: performance.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing user data:', error);
    
    // Log detailed error information for operational monitoring
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      userId: input.userId,
      timestamp: new Date().toISOString(),
      inputSummary: {
        hasActivities: Boolean(input.activities),
        activitiesCount: input.activities ? input.activities.length : 0,
        requestedPredictions: Boolean(input.generatePredictions),
        requestedVisualizations: Boolean(input.generateVisualizations)
      }
    };
    
    // In production, this would be sent to a monitoring system
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    return {
      error: error.message,
      errorCode: error.code || 'PROCESSING_ERROR',
      metadata: {
        processingTime: performance.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Example usage with advanced features
const result = processUserData({
  userId: 123,
  activities: ['login', 'view_profile', 'update_settings', 'search_products', 'add_to_cart', 'checkout'],
  calculateStats: true,
  numericData: [5, 10, 15, 20, 25, 8, 12, 18, 22, 7, 9, 14],
  generatePredictions: true,
  generateVisualizations: true,
  visualizationTypes: ['timeline', 'heatmap', 'radar'],
  predictionTimeframe: '14d',
  dimensions: { width: 1200, height: 800 },
  colorScheme: 'plasma'
});

console.log('Result:', JSON.stringify(result, null, 2));

// Export public API
module.exports = {
  processUserData,
  mlEngine,
  visualizer,
  eventBus
};
