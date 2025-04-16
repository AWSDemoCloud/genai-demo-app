/**
 * GenAI Demo App - Test Suite
 * 
 * Comprehensive tests for the Express API application
 */

const request = require('supertest');
const { app, start, getUserById, createDocument, searchDocuments } = require('../index');

let server;

// Setup and teardown
beforeAll(() => { 
  server = start(); 
});

afterAll(() => { 
  server.close(); 
});

// Root endpoint tests
describe('Root Endpoint', () => {
  test('GET / returns health check info', async () => {
    const res = await request(app).get('/');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('message');
  });
});

// User API tests
describe('User API', () => {
  test('GET /api/users/:id returns user for valid ID', async () => {
    const res = await request(app).get('/api/users/user-1');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'user-1');
    expect(res.body).toHaveProperty('name', 'John Doe');
    expect(res.body).toHaveProperty('email', 'john@example.com');
  });
  
  test('GET /api/users/:id returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/users/non-existent');
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });
  
  test('GET /api/users/:id returns 400 for invalid user ID format', async () => {
    const res = await request(app).get('/api/users/invalid@id');
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
    expect(res.body).toHaveProperty('message', 'Invalid user ID format');
  });
});

// Document API tests
describe('Document API', () => {
  test('POST /api/documents creates a new document with valid data', async () => {
    const documentData = {
      title: 'Test Document',
      content: 'This is a test document',
      tags: ['test', 'document']
    };
    
    const res = await request(app)
      .post('/api/documents')
      .send(documentData);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Document created successfully');
    expect(res.body).toHaveProperty('document');
    expect(res.body.document).toHaveProperty('title', documentData.title);
    expect(res.body.document).toHaveProperty('content', documentData.content);
    expect(res.body.document).toHaveProperty('tags');
    expect(res.body.document.tags).toEqual(documentData.tags);
  });
  
  test('POST /api/documents returns 400 for missing required fields', async () => {
    const invalidData = {
      title: 'Missing Content'
      // content is missing
    };
    
    const res = await request(app)
      .post('/api/documents')
      .send(invalidData);
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
    expect(res.body).toHaveProperty('message', 'Title and content are required');
  });
});

// Search API tests
describe('Search API', () => {
  test('GET /api/search returns matching documents', async () => {
    const res = await request(app).get('/api/search?q=bedrock');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('query', 'bedrock');
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0]).toHaveProperty('title');
  });
  
  test('GET /api/search returns 400 for missing query', async () => {
    const res = await request(app).get('/api/search');
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
    expect(res.body).toHaveProperty('message', 'Search query is required');
  });
});

// Unit tests for helper functions
describe('Helper Functions', () => {
  describe('getUserById', () => {
    test('returns user object for valid ID', () => {
      const user = getUserById('user-1');
      
      expect(user).toHaveProperty('id', 'user-1');
      expect(user).toHaveProperty('name', 'John Doe');
    });
    
    test('throws error for non-existent user', () => {
      expect(() => getUserById('non-existent')).toThrow();
    });
  });
  
  describe('createDocument', () => {
    test('creates document with required fields', () => {
      const doc = createDocument('Test', 'Content');
      
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('title', 'Test');
      expect(doc).toHaveProperty('content', 'Content');
      expect(doc).toHaveProperty('createdAt');
    });
    
    test('creates document with optional tags', () => {
      const tags = ['tag1', 'tag2'];
      const doc = createDocument('Test', 'Content', tags);
      
      expect(doc).toHaveProperty('tags');
      expect(doc.tags).toEqual(tags);
    });
  });
  
  describe('searchDocuments', () => {
    test('returns documents matching title query', () => {
      const results = searchDocuments('bedrock');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('title');
      expect(results[0].title.toLowerCase()).toContain('bedrock');
    });
    
    test('returns documents matching content query', () => {
      const results = searchDocuments('lambda');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(doc => 
        doc.title.toLowerCase().includes('lambda') || 
        doc.content.toLowerCase().includes('lambda')
      )).toBe(true);
    });
    
    test('returns empty array for non-matching query', () => {
      const results = searchDocuments('nonexistent');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});
