#!/bin/bash
#
# GenAI PR Enhancement System - Deployment Script
# 
# This script automates the deployment of the GenAI PR Enhancement infrastructure
# including the Lambda function, IAM roles, and required AWS resources.
#

set -e

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Configuration
STACK_NAME="genai-pr-enhancement"
REGION=${AWS_REGION:-"us-east-1"}
S3_BUCKET_SUFFIX=$(date +%s)
S3_BUCKET="genai-demo-app-${S3_BUCKET_SUFFIX}"
LAMBDA_FUNCTION_NAME="pr-narrator"

# Print header
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  GenAI PR Enhancement System Deployment${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
  echo -e "${BOLD}Checking prerequisites...${NC}"
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
    exit 1
  fi
  
  # Check AWS SAM CLI
  if ! command -v sam &> /dev/null; then
    echo -e "${RED}AWS SAM CLI not found. Please install it first.${NC}"
    exit 1
  fi
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install it first.${NC}"
    exit 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}All prerequisites met!${NC}"
  echo ""
}

# Deploy SAM template
deploy_sam_template() {
  echo -e "${BOLD}Deploying SAM template...${NC}"
  
  # Navigate to infra directory
  cd "$(dirname "$0")/../infra" || exit 1
  
  # Build SAM application
  echo -e "${YELLOW}Building SAM application...${NC}"
  sam build || { echo -e "${RED}SAM build failed.${NC}"; exit 1; }
  
  # Deploy SAM application
  echo -e "${YELLOW}Deploying SAM application...${NC}"
  sam deploy \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
      BedrockModelId="anthropic.claude-3-sonnet-20240229-v1:0" \
      VoiceId="alloy" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset || { echo -e "${RED}SAM deployment failed.${NC}"; exit 1; }
  
  # Get outputs
  LAMBDA_ARN=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" --query "Stacks[0].Outputs[?OutputKey=='PRNarratorFunction'].OutputValue" --output text)
  API_URL=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" --query "Stacks[0].Outputs[?OutputKey=='PRNarratorApi'].OutputValue" --output text)
  S3_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" --query "Stacks[0].Outputs[?OutputKey=='AudioBucketName'].OutputValue" --output text)
  GITHUB_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" --query "Stacks[0].Outputs[?OutputKey=='GitHubActionsRoleArn'].OutputValue" --output text)
  
  echo -e "${GREEN}SAM deployment completed successfully!${NC}"
  echo ""
}

# Configure GitHub repository
configure_github_repo() {
  echo -e "${BOLD}GitHub Repository Configuration${NC}"
  echo -e "${YELLOW}Please manually configure the following in your GitHub repository:${NC}"
  echo ""
  echo -e "1. Add the following secrets to your GitHub repository:"
  echo -e "   - AWS_ROLE_ARN: ${GITHUB_ROLE_ARN}"
  echo -e "   - AWS_REGION: ${REGION}"
  echo -e "   - BEDROCK_MODEL_ID: anthropic.claude-3-sonnet-20240229-v1:0"
  echo ""
  echo -e "2. Set up a GitHub webhook for PR events:"
  echo -e "   - Payload URL: ${API_URL}"
  echo -e "   - Content type: application/json"
  echo -e "   - Events: Pull request"
  echo ""
}

# Print summary
print_summary() {
  echo -e "${BOLD}Deployment Summary${NC}"
  echo -e "Stack Name: ${STACK_NAME}"
  echo -e "Region: ${REGION}"
  echo -e "Lambda Function: ${LAMBDA_ARN}"
  echo -e "API Gateway URL: ${API_URL}"
  echo -e "S3 Bucket: ${S3_BUCKET_NAME}"
  echo -e "GitHub Actions Role: ${GITHUB_ROLE_ARN}"
  echo ""
  echo -e "${GREEN}Deployment completed successfully!${NC}"
  echo -e "${YELLOW}Follow the GitHub configuration steps above to complete the setup.${NC}"
  echo ""
}

# Main execution
check_prerequisites
deploy_sam_template
configure_github_repo
print_summary

exit 0
