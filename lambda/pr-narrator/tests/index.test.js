/**
 * Tests for the PR-Narrator Lambda function
 */
const AWS = require('aws-sdk');
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

// Mock AWS services
const mockBedrockRuntime = {
  invokeModel: sinon.stub().returns({
    promise: sinon.stub().resolves({
      body: Buffer.from(JSON.stringify({
        completion: 'This is a test audio response'
      }))
    })
  })
};

const mockS3 = {
  putObject: sinon.stub().returns({
    promise: sinon.stub().resolves({})
  }),
  getSignedUrl: sinon.stub().returns('https://example.com/test-audio.mp3')
};

// Mock AWS SDK
const mockAWS = {
  BedrockRuntime: function() {
    return mockBedrockRuntime;
  },
  S3: function() {
    return mockS3;
  }
};

// Import the Lambda handler with mocked dependencies
const lambda = proxyquire('../index', {
  'aws-sdk': mockAWS
});

describe('PR-Narrator Lambda', () => {
  beforeEach(() => {
    // Reset all stubs before each test
    sinon.reset();
  });

  it('should process a PR event and return an audio URL', async () => {
    // Test event
    const event = {
      pr_number: '123',
      repository: 'owner/repo',
      commit_sha: 'abcd1234',
      doc_generated: 'true'
    };

    // Call the Lambda handler
    const result = await lambda.handler(event);

    // Assertions
    expect(result.statusCode).to.equal(200);
    expect(result.body).to.have.property('audio_url');
    expect(result.body).to.have.property('summary');
    expect(result.body.audio_url).to.include('https://');
  });

  it('should handle errors gracefully', async () => {
    // Make the Bedrock call fail
    mockBedrockRuntime.invokeModel = sinon.stub().throws(new Error('Bedrock error'));

    // Test event
    const event = {
      pr_number: '123',
      repository: 'owner/repo',
      commit_sha: 'abcd1234',
      doc_generated: 'true'
    };

    // Call the Lambda handler
    const result = await lambda.handler(event);

    // Assertions
    expect(result.statusCode).to.equal(500);
    expect(result.body).to.have.property('error');
  });

  it('should generate a PR summary', async () => {
    // Test event
    const event = {
      pr_number: '123',
      repository: 'owner/repo',
      commit_sha: 'abcd1234',
      doc_generated: 'true'
    };

    // Call the Lambda handler
    const result = await lambda.handler(event);

    // Assertions
    expect(result.body.summary).to.be.a('string');
    expect(result.body.summary).to.include('PR #123');
  });

  it('should upload audio to S3', async () => {
    // Test event
    const event = {
      pr_number: '123',
      repository: 'owner/repo',
      commit_sha: 'abcd1234',
      doc_generated: 'true'
    };

    // Call the Lambda handler
    await lambda.handler(event);

    // Assertions
    expect(mockS3.putObject.called).to.be.true;
    expect(mockS3.getSignedUrl.called).to.be.true;
  });
});
