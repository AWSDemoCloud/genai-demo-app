/**
 * Security and Access Control System
 * 
 * Manages authentication, authorization, and security policies.
 * Implements role-based access control and security auditing.
 */

class SecurityManager {
  constructor(options = {}) {
    this.config = {
      strictMode: true,
      auditTrail: true,
      rateLimiting: true,
      tokenExpiration: 3600, // seconds
      ...options
    };
    
    this.accessPolicies = {
      admin: {
        resources: ['*'],
        operations: ['*']
      },
      user: {
        resources: ['user_data', 'activity_log', 'visualization'],
        operations: ['read', 'read_write']
      },
      guest: {
        resources: ['public_data'],
        operations: ['read']
      }
    };
    
    this.auditLog = [];
    
    console.log('Security Manager initialized with configuration:', this.config);
  }
  
  /**
   * Validate access request against security policies
   * 
   * @param {Object} params - Access request parameters
   * @param {Number|String} params.userId - User ID
   * @param {Array} params.requestedResources - Resources being accessed
   * @param {String} params.operationType - Type of operation (read, write, delete)
   * @returns {Object} Authorization result
   */
  validateAccess(params) {
    const { userId, requestedResources, operationType } = params;
    
    // In a real implementation, this would check against a database
    // For demo purposes, we'll simulate a user lookup
    const userRole = this._getUserRole(userId);
    
    // Get policy for this role
    const policy = this.accessPolicies[userRole];
    
    if (!policy) {
      return {
        authorized: false,
        reason: `No access policy found for role: ${userRole}`
      };
    }
    
    // Check if all requested resources are allowed
    const unauthorizedResources = requestedResources.filter(resource => {
      return !policy.resources.includes('*') && !policy.resources.includes(resource);
    });
    
    if (unauthorizedResources.length > 0) {
      return {
        authorized: false,
        reason: `Unauthorized resources: ${unauthorizedResources.join(', ')}`,
        allowedResources: policy.resources
      };
    }
    
    // Check if operation type is allowed
    if (!policy.operations.includes('*') && !policy.operations.includes(operationType)) {
      return {
        authorized: false,
        reason: `Unauthorized operation: ${operationType}`,
        allowedOperations: policy.operations
      };
    }
    
    // Record audit trail if enabled
    if (this.config.auditTrail) {
      this._recordAuditEntry({
        userId,
        role: userRole,
        resources: requestedResources,
        operation: operationType,
        timestamp: new Date().toISOString(),
        result: 'authorized'
      });
    }
    
    return {
      authorized: true,
      role: userRole,
      permissions: {
        resources: policy.resources,
        operations: policy.operations
      }
    };
  }
  
  /**
   * Validate authentication token
   * 
   * @param {String} token - Authentication token
   * @returns {Object} Validation result
   */
  validateToken(token) {
    // In a real implementation, this would validate JWT or other tokens
    // For demo purposes, we'll simulate token validation
    
    if (!token) {
      return {
        valid: false,
        reason: 'No token provided'
      };
    }
    
    // Simple token format validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return {
        valid: false,
        reason: 'Invalid token format'
      };
    }
    
    // Simulate expiration check
    const now = Math.floor(Date.now() / 1000);
    const tokenData = {
      userId: 123,
      exp: now + this.config.tokenExpiration,
      iat: now - 600 // issued 10 minutes ago
    };
    
    if (tokenData.exp < now) {
      return {
        valid: false,
        reason: 'Token expired',
        expiredAt: new Date(tokenData.exp * 1000).toISOString()
      };
    }
    
    return {
      valid: true,
      userId: tokenData.userId,
      expiresIn: tokenData.exp - now
    };
  }
  
  /**
   * Check for security vulnerabilities in input data
   * 
   * @param {Object} data - Input data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  validateInput(data, schema) {
    const errors = [];
    
    // Check for SQL injection patterns
    if (this._containsSqlInjection(data)) {
      errors.push({
        type: 'SQL_INJECTION',
        severity: 'HIGH',
        message: 'Potential SQL injection detected in input'
      });
    }
    
    // Check for XSS patterns
    if (this._containsXss(data)) {
      errors.push({
        type: 'XSS',
        severity: 'HIGH',
        message: 'Potential cross-site scripting attack detected in input'
      });
    }
    
    // Validate against schema if provided
    if (schema) {
      const schemaErrors = this._validateSchema(data, schema);
      errors.push(...schemaErrors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get audit log entries
   * 
   * @param {Object} filters - Optional filters for log entries
   * @returns {Array} Filtered audit log entries
   */
  getAuditLog(filters = {}) {
    if (!this.config.auditTrail) {
      throw new Error('Audit trail is disabled in configuration');
    }
    
    let filteredLog = [...this.auditLog];
    
    // Apply filters
    if (filters.userId) {
      filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
    }
    
    if (filters.resource) {
      filteredLog = filteredLog.filter(entry => 
        entry.resources && entry.resources.includes(filters.resource)
      );
    }
    
    if (filters.operation) {
      filteredLog = filteredLog.filter(entry => entry.operation === filters.operation);
    }
    
    if (filters.result) {
      filteredLog = filteredLog.filter(entry => entry.result === filters.result);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate).getTime();
      filteredLog = filteredLog.filter(entry => 
        new Date(entry.timestamp).getTime() >= startDate
      );
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate).getTime();
      filteredLog = filteredLog.filter(entry => 
        new Date(entry.timestamp).getTime() <= endDate
      );
    }
    
    return filteredLog;
  }
  
  /**
   * Get user role based on user ID
   * @private
   */
  _getUserRole(userId) {
    // In a real implementation, this would query a database
    // For demo purposes, we'll use a simple mapping
    
    // Admin users
    if (userId === 1 || userId === 'admin') {
      return 'admin';
    }
    
    // Guest users
    if (userId === 0 || userId === 'guest') {
      return 'guest';
    }
    
    // All other users
    return 'user';
  }
  
  /**
   * Record an entry in the audit log
   * @private
   */
  _recordAuditEntry(entry) {
    this.auditLog.push(entry);
    
    // In a real implementation, this would write to a database or log file
    console.log('Security audit:', entry);
    
    // Trim audit log if it gets too large
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }
  
  /**
   * Check for SQL injection patterns
   * @private
   */
  _containsSqlInjection(data) {
    // In a real implementation, this would use more sophisticated detection
    // For demo purposes, we'll use a simple pattern check
    
    const sqlPatterns = [
      "';", '--', '/*', 'UNION', 'SELECT', 'DROP', 'DELETE', 'UPDATE', 'INSERT'
    ];
    
    const dataString = JSON.stringify(data).toUpperCase();
    
    return sqlPatterns.some(pattern => dataString.includes(pattern));
  }
  
  /**
   * Check for XSS patterns
   * @private
   */
  _containsXss(data) {
    // In a real implementation, this would use more sophisticated detection
    // For demo purposes, we'll use a simple pattern check
    
    const xssPatterns = [
      '<script', 'javascript:', 'onerror=', 'onload=', 'eval(', 'document.cookie'
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    
    return xssPatterns.some(pattern => dataString.includes(pattern));
  }
  
  /**
   * Validate data against schema
   * @private
   */
  _validateSchema(data, schema) {
    const errors = [];
    
    // In a real implementation, this would use a schema validation library
    // For demo purposes, we'll implement a simple validation
    
    Object.keys(schema).forEach(field => {
      const fieldSchema = schema[field];
      const value = data[field];
      
      // Required field check
      if (fieldSchema.required && (value === undefined || value === null)) {
        errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          severity: 'MEDIUM',
          field,
          message: `Required field '${field}' is missing`
        });
        return;
      }
      
      // Skip further validation if field is not present
      if (value === undefined || value === null) {
        return;
      }
      
      // Type check
      if (fieldSchema.type && typeof value !== fieldSchema.type) {
        errors.push({
          type: 'TYPE_MISMATCH',
          severity: 'MEDIUM',
          field,
          message: `Field '${field}' should be of type '${fieldSchema.type}'`
        });
      }
      
      // Pattern check
      if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
        errors.push({
          type: 'PATTERN_MISMATCH',
          severity: 'MEDIUM',
          field,
          message: `Field '${field}' does not match required pattern`
        });
      }
      
      // Min/max value check for numbers
      if (typeof value === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push({
            type: 'VALUE_TOO_SMALL',
            severity: 'LOW',
            field,
            message: `Field '${field}' is smaller than minimum value ${fieldSchema.min}`
          });
        }
        
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push({
            type: 'VALUE_TOO_LARGE',
            severity: 'LOW',
            field,
            message: `Field '${field}' is larger than maximum value ${fieldSchema.max}`
          });
        }
      }
      
      // Min/max length check for strings
      if (typeof value === 'string') {
        if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
          errors.push({
            type: 'STRING_TOO_SHORT',
            severity: 'LOW',
            field,
            message: `Field '${field}' is shorter than minimum length ${fieldSchema.minLength}`
          });
        }
        
        if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
          errors.push({
            type: 'STRING_TOO_LONG',
            severity: 'LOW',
            field,
            message: `Field '${field}' is longer than maximum length ${fieldSchema.maxLength}`
          });
        }
      }
    });
    
    return errors;
  }
}

module.exports = SecurityManager;
