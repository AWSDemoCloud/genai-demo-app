/**
 * Event-Driven Architecture System
 * 
 * Manages application events, subscriptions, and asynchronous processing.
 * Implements the observer pattern for loosely coupled component communication.
 */

const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

class EventManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      maxListeners: 50,
      monitorPerformance: true,
      logEvents: true,
      enableRetry: true,
      ...options
    };
    
    // Set max listeners to avoid memory leaks
    this.setMaxListeners(this.config.maxListeners);
    
    // Track event metrics
    this.metrics = {
      totalEvents: 0,
      eventCounts: {},
      handlerPerformance: {},
      errors: []
    };
    
    // Event subscription registry
    this.subscriptions = new Map();
    
    // Event retry queue
    this.retryQueue = [];
    
    console.log('Event Manager initialized with configuration:', this.config);
    
    // Setup internal event handling
    this._setupInternalHandlers();
  }
  
  /**
   * Publish an event to all subscribers
   * 
   * @param {String} eventName - Name of the event
   * @param {Object} payload - Event payload data
   * @param {Object} options - Publishing options
   * @returns {Boolean} Success status
   */
  publish(eventName, payload = {}, options = {}) {
    const eventId = this._generateEventId();
    const timestamp = new Date().toISOString();
    
    // Create event object with metadata
    const event = {
      id: eventId,
      name: eventName,
      timestamp,
      payload,
      metadata: {
        publisher: options.publisher || 'unknown',
        priority: options.priority || 'normal',
        correlationId: options.correlationId || null,
        retry: options.retry !== undefined ? options.retry : this.config.enableRetry
      }
    };
    
    // Track event metrics
    this._trackEvent(eventName);
    
    try {
      // Emit the event to all listeners
      const startTime = this.config.monitorPerformance ? performance.now() : 0;
      
      // Log event if configured
      if (this.config.logEvents) {
        console.log(`EVENT [${eventName}] published with ID: ${eventId}`);
      }
      
      // Emit event to all subscribers
      this.emit(eventName, event);
      
      // Track performance
      if (this.config.monitorPerformance) {
        const duration = performance.now() - startTime;
        this._trackPerformance(eventName, duration);
      }
      
      return true;
    } catch (error) {
      console.error(`Error publishing event [${eventName}]:`, error);
      
      // Add to retry queue if retry is enabled
      if (event.metadata.retry) {
        this._addToRetryQueue(event);
      }
      
      // Track error
      this._trackError(eventName, error);
      
      return false;
    }
  }
  
  /**
   * Subscribe to an event with a handler function
   * 
   * @param {String} eventName - Name of the event to subscribe to
   * @param {Function} handler - Event handler function
   * @param {Object} options - Subscription options
   * @returns {String} Subscription ID
   */
  subscribe(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    
    const subscriptionId = this._generateSubscriptionId();
    
    // Create subscription object
    const subscription = {
      id: subscriptionId,
      eventName,
      handler,
      options: {
        priority: options.priority || 'normal',
        timeout: options.timeout || 30000, // 30 seconds default timeout
        async: options.async !== undefined ? options.async : true,
        ...options
      },
      createdAt: new Date().toISOString()
    };
    
    // Store subscription in registry
    this.subscriptions.set(subscriptionId, subscription);
    
    // Create event listener with performance monitoring
    const wrappedHandler = async (event) => {
      const startTime = this.config.monitorPerformance ? performance.now() : 0;
      
      try {
        // Execute handler based on async option
        if (subscription.options.async) {
          // Set timeout for async handlers
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Handler timeout after ${subscription.options.timeout}ms`));
            }, subscription.options.timeout);
          });
          
          // Execute handler with timeout
          await Promise.race([
            Promise.resolve(handler(event)),
            timeoutPromise
          ]);
        } else {
          // Synchronous execution
          handler(event);
        }
        
        // Track performance
        if (this.config.monitorPerformance) {
          const duration = performance.now() - startTime;
          this._trackHandlerPerformance(eventName, subscriptionId, duration);
        }
      } catch (error) {
        console.error(`Error in handler for event [${eventName}]:`, error);
        
        // Track error
        this._trackError(eventName, error, subscriptionId);
        
        // Emit error event
        this.emit('handler:error', {
          error,
          eventName,
          subscriptionId,
          event
        });
      }
    };
    
    // Store wrapped handler reference for unsubscribe
    subscription.wrappedHandler = wrappedHandler;
    
    // Add event listener
    this.on(eventName, wrappedHandler);
    
    console.log(`Subscription [${subscriptionId}] created for event [${eventName}]`);
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from an event using subscription ID
   * 
   * @param {String} subscriptionId - ID of the subscription to remove
   * @returns {Boolean} Success status
   */
  unsubscribe(subscriptionId) {
    // Get subscription from registry
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      console.warn(`Subscription [${subscriptionId}] not found`);
      return false;
    }
    
    // Remove event listener
    this.removeListener(subscription.eventName, subscription.wrappedHandler);
    
    // Remove from registry
    this.subscriptions.delete(subscriptionId);
    
    console.log(`Subscription [${subscriptionId}] for event [${subscription.eventName}] removed`);
    
    return true;
  }
  
  /**
   * Get metrics about event processing
   * 
   * @param {String} eventName - Optional event name to filter metrics
   * @returns {Object} Event metrics
   */
  getMetrics(eventName) {
    if (eventName) {
      return {
        eventCount: this.metrics.eventCounts[eventName] || 0,
        performance: this.metrics.handlerPerformance[eventName] || {},
        errors: this.metrics.errors.filter(e => e.eventName === eventName)
      };
    }
    
    return {
      ...this.metrics,
      activeSubscriptions: this.subscriptions.size,
      retryQueueSize: this.retryQueue.length
    };
  }
  
  /**
   * Process events in the retry queue
   * 
   * @param {Number} maxRetries - Maximum number of retries per event
   * @returns {Number} Number of events processed
   */
  processRetryQueue(maxRetries = 3) {
    if (this.retryQueue.length === 0) {
      return 0;
    }
    
    console.log(`Processing retry queue with ${this.retryQueue.length} events`);
    
    let processed = 0;
    const remainingEvents = [];
    
    // Process each event in the queue
    this.retryQueue.forEach(queueItem => {
      // Check if max retries reached
      if (queueItem.retryCount >= maxRetries) {
        console.warn(`Max retries reached for event [${queueItem.event.name}] with ID: ${queueItem.event.id}`);
        
        // Emit max retries event
        this.emit('retry:maxReached', {
          event: queueItem.event,
          retryCount: queueItem.retryCount
        });
        
        return;
      }
      
      // Increment retry count
      queueItem.retryCount++;
      
      // Attempt to publish event again
      try {
        this.emit(queueItem.event.name, queueItem.event);
        processed++;
        
        // Emit retry success event
        this.emit('retry:success', {
          event: queueItem.event,
          retryCount: queueItem.retryCount
        });
      } catch (error) {
        console.error(`Retry failed for event [${queueItem.event.name}]:`, error);
        
        // Keep in queue for next retry
        remainingEvents.push(queueItem);
        
        // Emit retry failure event
        this.emit('retry:failure', {
          event: queueItem.event,
          retryCount: queueItem.retryCount,
          error
        });
      }
    });
    
    // Update retry queue
    this.retryQueue = remainingEvents;
    
    return processed;
  }
  
  /**
   * Generate a unique event ID
   * @private
   */
  _generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate a unique subscription ID
   * @private
   */
  _generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Track event metrics
   * @private
   */
  _trackEvent(eventName) {
    this.metrics.totalEvents++;
    this.metrics.eventCounts[eventName] = (this.metrics.eventCounts[eventName] || 0) + 1;
  }
  
  /**
   * Track event processing performance
   * @private
   */
  _trackPerformance(eventName, duration) {
    if (!this.metrics.handlerPerformance[eventName]) {
      this.metrics.handlerPerformance[eventName] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      };
    }
    
    const perf = this.metrics.handlerPerformance[eventName];
    
    perf.count++;
    perf.totalDuration += duration;
    perf.averageDuration = perf.totalDuration / perf.count;
    perf.minDuration = Math.min(perf.minDuration, duration);
    perf.maxDuration = Math.max(perf.maxDuration, duration);
  }
  
  /**
   * Track handler performance
   * @private
   */
  _trackHandlerPerformance(eventName, subscriptionId, duration) {
    if (!this.metrics.handlerPerformance[eventName]) {
      this.metrics.handlerPerformance[eventName] = {};
    }
    
    if (!this.metrics.handlerPerformance[eventName][subscriptionId]) {
      this.metrics.handlerPerformance[eventName][subscriptionId] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      };
    }
    
    const perf = this.metrics.handlerPerformance[eventName][subscriptionId];
    
    perf.count++;
    perf.totalDuration += duration;
    perf.averageDuration = perf.totalDuration / perf.count;
    perf.minDuration = Math.min(perf.minDuration, duration);
    perf.maxDuration = Math.max(perf.maxDuration, duration);
  }
  
  /**
   * Track error metrics
   * @private
   */
  _trackError(eventName, error, subscriptionId = null) {
    this.metrics.errors.push({
      eventName,
      subscriptionId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Limit error history
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }
  
  /**
   * Add event to retry queue
   * @private
   */
  _addToRetryQueue(event) {
    this.retryQueue.push({
      event,
      retryCount: 0,
      addedAt: new Date().toISOString()
    });
    
    // Emit retry queued event
    this.emit('retry:queued', {
      event,
      queueSize: this.retryQueue.length
    });
  }
  
  /**
   * Setup internal event handlers
   * @private
   */
  _setupInternalHandlers() {
    // Handler for monitoring subscription activity
    this.on('newListener', (eventName) => {
      if (eventName !== 'newListener' && eventName !== 'removeListener') {
        console.log(`New listener added for event: ${eventName}`);
      }
    });
    
    // Handler for monitoring unsubscriptions
    this.on('removeListener', (eventName) => {
      if (eventName !== 'newListener' && eventName !== 'removeListener') {
        console.log(`Listener removed for event: ${eventName}`);
      }
    });
  }
}

module.exports = EventManager;
