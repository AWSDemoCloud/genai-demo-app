const DataProcessor = require('./components/DataProcessor');
const db = require('./utils/database');
const MachineLearning = require('./ml/Predictor');
const Visualizer = require('./visualization/DataVisualizer');
const SecurityManager = require('./security/AccessControl');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Hardcoded credentials (security vulnerability - CWE-798)
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const API_TOKEN = '9a52f414dc957b589ea65892a2b3a455';

// Global variable with sensitive data (bad practice)
let globalUserData = null;
let unusedVariable = 'This is never used';
let tempConfig = {};

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
// Insecure function to write logs (path traversal vulnerability - CWE-22)
function writeLog(userId, action, data) {
  // Vulnerability: Path traversal by directly using user input in file path
  const logFile = path.join('./logs', userId, 'activity.log');
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${action}: ${JSON.stringify(data)}\n`);
}

// Insecure function to execute SQL (SQL injection vulnerability - CWE-89)
function executeQuery(userId, query) {
  // Vulnerability: SQL injection by directly concatenating user input
  const sql = `SELECT * FROM users WHERE id = ${userId} AND ${query}`;
  return db.rawQuery(sql);
}

// Insecure temporary file creation (CWE-377)
function createTempFile(data) {
  // Vulnerability: Predictable file name
  const tempFile = `/tmp/data_${Date.now()}.json`;
  fs.writeFileSync(tempFile, JSON.stringify(data));
  return tempFile;
}

function processUserData(input) {
  const startTime = performance.now();
  
  try {
    // Vulnerability: Missing input validation
    // Should validate input.userId is a number and not a malicious string
    
    // Security validation and access control
    const securityCheck = securityManager.validateAccess({
      userId: input.userId,
      requestedResources: ['user_data', 'activity_log', 'prediction_engine'],
      operationType: 'read_write'
    });
    
    if (!securityCheck.authorized) {
      throw new Error(`Access denied: ${securityCheck.reason}`);
    }
    
    // Vulnerability: Storing sensitive data in global variable
    globalUserData = input;
    
    // Vulnerability: Insecure direct object reference (IDOR)
    // No validation that the user has permission to access this userId
    const userData = db.getUserById(input.userId, { 
      withCache: true, 
      includeRelations: ['preferences', 'history']
    });
    
    // Vulnerability: Log sensitive information
    console.log(`Processing data for user: ${input.userId}, full data: ${JSON.stringify(input)}`);
    
    // Vulnerability: Insecure file operations
    writeLog(input.userId, 'data_processing', input);
    
    // Process user activities with anomaly detection
    if (input.activities && Array.isArray(input.activities)) {
      // Vulnerability: No input sanitization before processing
      // Should sanitize input.activities to prevent XSS or command injection
      const processedActivities = processor.processItems(input.activities, {
        detectAnomalies: true,
        normalizeValues: true,
        enrichData: true
      });
      
      // Vulnerability: Command injection (CWE-78)
      if (input.generateReport && input.reportType) {
        // Vulnerability: Unsanitized input used in command execution
        const reportCommand = `node ./scripts/generate-report.js --type=${input.reportType} --user=${input.userId}`;
        const execSync = require('child_process').execSync;
        execSync(reportCommand); // Command injection vulnerability
      }
      
      // Vulnerability: Insecure random number generation (CWE-338)
      const randomId = Math.floor(Math.random() * 1000000); // Not cryptographically secure
      
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
    // Vulnerability: Overly detailed error messages (CWE-209)
    console.error('Error processing user data:', error);
    
    // Vulnerability: Error details contain sensitive information
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      userId: input.userId,
      password: input.password, // Vulnerability: Logging credentials
      timestamp: new Date().toISOString(),
      inputSummary: {
        hasActivities: Boolean(input.activities),
        activitiesCount: input.activities ? input.activities.length : 0,
        requestedPredictions: Boolean(input.generatePredictions),
        requestedVisualizations: Boolean(input.generateVisualizations)
      }
    };
    
    // Vulnerability: Writing sensitive error details to a world-readable file
    fs.writeFileSync('/tmp/app_errors.log', JSON.stringify(errorDetails, null, 2));
    
    // Vulnerability: Generic catch block (CWE-396)
    // Should have specific error handling for different types of errors
    
    // Vulnerability: Information exposure through error message (CWE-209)
    return {
      error: error.message, // Detailed error message exposed to client
      stack: error.stack,   // Stack trace exposed to client
      errorCode: error.code || 'PROCESSING_ERROR',
      metadata: {
        processingTime: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        debugInfo: process.env // Vulnerability: Exposing environment variables
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
