#!/usr/bin/env bash
set -euo pipefail

#############################################################
# GitHub PR Enhancement with AWS Bedrock
#
# Architecture:
# 1. PR is created/updated in GitHub
# 2. GitHub Actions workflow creates a diff
# 3. This script invokes Bedrock Agent to analyze the diff
# 4. Generated documentation is committed back to the PR
#
# Usage:
#   AGENT_ID=<id> AGENT_ALIAS_ID=<alias> ./scripts/invoke-bedrock-agent.sh diff.txt doc.md
#   or
#   MODEL_ID=<model> ./scripts/invoke-bedrock-agent.sh diff.txt doc.md (fallback)
#############################################################

# --- Configuration ---
# Agent configuration (preferred method)
AGENT_ID=${AGENT_ID:-""}
AGENT_ALIAS_ID=${AGENT_ALIAS_ID:-""}

# Model configuration (fallback if agent not configured)
MODEL_ID=${MODEL_ID:-"anthropic.claude-3-5-sonnet-20240620-v1:0"}
MAX_TOKENS=${MAX_TOKENS:-1024}

# --- Debug Information ---
echo "[DEBUG] Running on: $(uname -a)"
echo "[DEBUG] Bash version: $BASH_VERSION"
echo "[DEBUG] AWS CLI version: $(aws --version 2>&1 || echo 'not found')"
echo "[DEBUG] jq version: $(jq --version 2>&1 || echo 'not found')"

# Determine invocation method: Agent (preferred) or Direct Model (fallback)
USE_AGENT=false
if [[ -n "$AGENT_ID" && -n "$AGENT_ALIAS_ID" ]]; then
  USE_AGENT=true
  echo "[INFO] Using Bedrock Agent: $AGENT_ID (alias: $AGENT_ALIAS_ID)"
  echo "[INFO] This is the recommended approach for GitHub PR workflows"
else
  echo "[INFO] AGENT_ID and/or AGENT_ALIAS_ID not provided"
  echo "[INFO] Falling back to direct model invocation with: $MODEL_ID"
  echo "[INFO] MAX_TOKENS: $MAX_TOKENS"
  echo "[INFO] For best results, configure a Bedrock Agent with PR analysis capabilities"
fi

# --- Argument Validation ---
if [[ $# -lt 2 ]]; then
  echo "[ERROR] Missing required arguments"
  echo "Usage: $0 diff_file output_file"
  exit 1
fi

DIFF_FILE=$1
OUTPUT_FILE=$2

echo "[DEBUG] Args: DIFF_FILE=$DIFF_FILE OUTPUT_FILE=$OUTPUT_FILE"

# --- Input Validation ---
if [[ ! -f $DIFF_FILE ]]; then
  echo "[ERROR] Diff file $DIFF_FILE not found"; exit 1
fi

# Check for binary data
if file --mime "$DIFF_FILE" | grep -q -v "text/"; then
  echo "[ERROR] Diff contains binary/non-text data. Cannot process."
  exit 4
fi

if [[ ! -s $DIFF_FILE ]]; then
  echo "[INFO] Diff file is empty; nothing to document. Exiting."
  exit 0
fi

# --- Diff File Information ---
echo "[DEBUG] diff.txt size: $(stat -c%s "$DIFF_FILE" 2>/dev/null || wc -c < "$DIFF_FILE") bytes"
echo "[DEBUG] First 10 lines of diff.txt:"
head -n 10 "$DIFF_FILE" || true

# --- Create Prompt ---
# Properly sanitize the diff content for JSON - remove control characters
DIFF_CONTENT=$(cat "$DIFF_FILE" | tr -d '\000-\037')
PROMPT="You are a senior engineer. Please convert this git diff into clear Markdown release notes describing what changed and why it matters:\n\n$DIFF_CONTENT"

# --- Prepare Request JSON ---
TMP_JSON=$(mktemp)
trap 'rm -f "$TMP_JSON" response.json' EXIT

if [[ "$USE_AGENT" == "true" ]]; then
  # Start timing for metrics
  START_TIME=$(date +%s.%N)
  
  # Generate a unique session ID for the agent
  SESSION_ID="pr-$(date +%s)-$(head /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | head -c 8)"
  echo "[DEBUG] Using session ID: $SESSION_ID"
  
  # Create agent payload with optimized prompt for PR analysis
  PROMPT_PREFIX="You are a senior software engineer reviewing a GitHub Pull Request.\n\nPlease analyze this git diff and create a concise, well-formatted Markdown summary that:\n1. Describes what changed and why it matters\n2. Highlights any potential issues or improvements\n3. Organizes changes by component or feature\n\nGIT DIFF:\n"
  
  # Create a sanitized version of the diff content - more aggressive cleaning
  # Remove all control characters and escape quotes and backslashes
  SANITIZED_DIFF=$(echo "$DIFF_CONTENT" | tr -d '\000-\037')
  
  # Use a temporary file for the content first
  TEMP_CONTENT_FILE=$(mktemp)
  echo "${PROMPT_PREFIX}${SANITIZED_DIFF}" > "$TEMP_CONTENT_FILE"
  
  # Create JSON payload using python to properly escape the JSON
  python3 -c "
  import json
  import sys
  with open('$TEMP_CONTENT_FILE', 'r') as f:
      content = f.read()
  payload = {
      'inputText': content,
      'enableTrace': True
  }
  with open('$TMP_JSON', 'w') as f:
      json.dump(payload, f)
  "
  
  # Clean up temp file
  rm -f "$TEMP_CONTENT_FILE"
  
  echo "[DEBUG] Agent Request JSON (truncated):"
  head -n 30 "$TMP_JSON"
  
  # Force UTF-8 encoding
  iconv -f us-ascii -t utf-8 "$TMP_JSON" -o "$TMP_JSON.utf8" && mv "$TMP_JSON.utf8" "$TMP_JSON"
  
  # Validate JSON
  if ! jq . "$TMP_JSON" > /dev/null; then
    echo "[ERROR] Invalid JSON payload!"
    exit 3
  fi
  
  # Invoke Bedrock Agent
  echo "[INFO] Invoking Bedrock Agent..."
  if ! aws bedrock-agent-runtime invoke-agent \
    --agent-id "$AGENT_ID" \
    --agent-alias-id "$AGENT_ALIAS_ID" \
    --session-id "$SESSION_ID" \
    --body "file://$TMP_JSON" \
    response.json; then
    echo "[ERROR] Bedrock Agent invocation failed!"
    cat response.json || true
    exit 2
  fi
  
  # Calculate metrics for CloudWatch logging
  END_TIME=$(date +%s.%N)
  DURATION=$(echo "$END_TIME - $START_TIME" | bc)
  DIFF_SIZE=$(wc -c < "$DIFF_FILE")
  
  # Extract the completion from the agent response
  echo "[DEBUG] Agent response received. Processing..."
  DOC_TEXT=$(jq -r '.finalResponse.text // .completion // .observation[0].finalResponse.text // empty' response.json)
  
  # Log metrics for monitoring
  echo "[METRICS] Execution time: ${DURATION}s | Diff size: ${DIFF_SIZE} bytes | Agent: $AGENT_ID"
  
else
  # Start timing for metrics (fallback method)
  START_TIME=$(date +%s.%N)
  
  # Direct model invocation with Claude
  # Create an improved prompt for PR analysis
  PROMPT_PREFIX="You are a senior software engineer reviewing a GitHub Pull Request.\n\nPlease analyze this git diff and create a concise, well-formatted Markdown summary that:\n1. Describes what changed and why it matters\n2. Highlights any potential issues or improvements\n3. Organizes changes by component or feature\n\nGIT DIFF:\n"
  ENHANCED_PROMPT="${PROMPT_PREFIX}${DIFF_CONTENT}"
  
  jq -n \
    --arg prompt "$ENHANCED_PROMPT" \
    --argjson max_tokens "$MAX_TOKENS" \
    '{
       "anthropic_version": "bedrock-2023-05-31",
       "max_tokens": $max_tokens,
       "messages": [
         {
           "role": "user",
           "content": [ { "type": "text", "text": $prompt } ]
         }
       ]
     }' > "$TMP_JSON"
  
  echo "[DEBUG] Model Request JSON (truncated):"
  head -n 30 "$TMP_JSON"
  
  # Force UTF-8 encoding
  iconv -f us-ascii -t utf-8 "$TMP_JSON" -o "$TMP_JSON.utf8" && mv "$TMP_JSON.utf8" "$TMP_JSON"
  
  # Validate JSON
  if ! jq . "$TMP_JSON" > /dev/null; then
    echo "[ERROR] Invalid JSON payload!"
    exit 3
  fi
  
  # Invoke Bedrock Model
  echo "[INFO] Invoking Bedrock Claude model..."
  if ! aws bedrock-runtime invoke-model \
    --model-id "$MODEL_ID" \
    --content-type "application/json" \
    --accept "application/json" \
    --body "file://$TMP_JSON" \
    response.json; then
    echo "[ERROR] Bedrock model invocation failed!"
    cat response.json || true
    exit 2
  fi
  
  # Calculate metrics for CloudWatch logging
  END_TIME=$(date +%s.%N)
  DURATION=$(echo "$END_TIME - $START_TIME" | bc)
  DIFF_SIZE=$(wc -c < "$DIFF_FILE")
  
  # Extract the completion from the Claude model response
  echo "[DEBUG] Model response received. Processing..."
  DOC_TEXT=$(jq -r '.content[0].text // empty' response.json)
  
  # Log metrics for monitoring
  echo "[METRICS] Execution time: ${DURATION}s | Diff size: ${DIFF_SIZE} bytes | Model: $MODEL_ID"
fi

if [[ -z "$DOC_TEXT" ]]; then
  echo "[ERROR] No valid content in response!"
  echo "[DEBUG] Full response:"
  cat response.json
  exit 3
fi

# --- Save Output ---
echo "$DOC_TEXT" > "$OUTPUT_FILE"
echo "[SUCCESS] Documentation saved to $OUTPUT_FILE"

