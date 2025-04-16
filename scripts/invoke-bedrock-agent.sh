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
trap 'rm -f "$TMP_JSON" response.json model-response.json 2>/dev/null' EXIT

if [[ "$USE_AGENT" == "true" ]]; then
  # Start timing for metrics
  START_TIME=$(date +%s.%N)
  
  # Generate a unique session ID for the agent
  SESSION_ID="pr-$(date +%s)-$(head /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | head -c 8)"
  echo "[DEBUG] Using session ID: $SESSION_ID"
  
  # Create agent payload with optimized prompt for PR analysis
  PROMPT_PREFIX="You are a senior software engineer reviewing a GitHub Pull Request.\n\nPlease analyze this git diff and create a concise, well-formatted Markdown summary that:\n1. Describes what changed and why it matters\n2. Highlights any potential issues or improvements\n3. Organizes changes by component or feature\n\nGIT DIFF:\n"
  
  # Use a temporary file for the content first
  TEMP_CONTENT_FILE=$(mktemp)
  echo "${PROMPT_PREFIX}${DIFF_CONTENT}" > "$TEMP_CONTENT_FILE"
  
  # Create JSON payload using python to properly escape the JSON
  python3 -c "import json; import sys; f = open('$TEMP_CONTENT_FILE', 'r'); content = f.read(); f.close(); payload = {'inputText': content, 'enableTrace': True}; f = open('$TMP_JSON', 'w'); json.dump(payload, f); f.close()"
  
  # Clean up temp file
  rm -f "$TEMP_CONTENT_FILE"
  
  echo "[DEBUG] Agent Request JSON (truncated):"
  head -n 30 "$TMP_JSON"
  
  # Force UTF-8 encoding
  iconv -f us-ascii -t utf-8 "$TMP_JSON" -o "$TMP_JSON.utf8" 2>/dev/null && mv "$TMP_JSON.utf8" "$TMP_JSON" || true
  
  # Validate JSON
  if ! jq . "$TMP_JSON" > /dev/null 2>&1; then
    echo "[ERROR] Invalid JSON payload!"
    USE_AGENT=false
  else
    # Invoke Bedrock Agent
    echo "[INFO] Invoking Bedrock Agent..."
    
    # First try with bedrock-agent-runtime (newer API)
    if aws bedrock-agent-runtime invoke-agent \
      --agent-id "$AGENT_ID" \
      --agent-alias-id "$AGENT_ALIAS_ID" \
      --session-id "$SESSION_ID" \
      --body "file://$TMP_JSON" \
      response.json 2>/dev/null; then
      
      echo "[INFO] Successfully invoked Bedrock Agent with bedrock-agent-runtime"
      AGENT_SUCCESS=true
    
    # If that fails, try with bedrock-agent (older API)
    elif aws bedrock-agent invoke-agent \
      --agent-id "$AGENT_ID" \
      --agent-alias-id "$AGENT_ALIAS_ID" \
      --session-id "$SESSION_ID" \
      --body "file://$TMP_JSON" \
      response.json 2>/dev/null; then
      
      echo "[INFO] Successfully invoked Bedrock Agent with bedrock-agent"
      AGENT_SUCCESS=true
    
    # If both fail, report error
    else
      echo "[ERROR] Bedrock Agent invocation failed! Falling back to direct model invocation."
      # Fall back to direct model invocation
      USE_AGENT=false
      AGENT_SUCCESS=false
    fi
    
    # If agent invocation was successful, process the response
    if [[ "$USE_AGENT" == "true" && -f response.json ]]; then
      # Calculate metrics for CloudWatch logging
      END_TIME=$(date +%s.%N)
      DURATION=$(echo "$END_TIME - $START_TIME" | bc 2>/dev/null || echo "unknown")
      DIFF_SIZE=$(wc -c < "$DIFF_FILE" 2>/dev/null || echo "unknown")
      
      # Extract the completion from the agent response
      echo "[DEBUG] Agent response received. Processing..."
      
      # Try different JSON paths that might contain the response
      COMPLETION=$(jq -r '.completion // .finalResponse.text // .observation[0].finalResponse.text // empty' response.json 2>/dev/null)
      
      if [[ -n "$COMPLETION" && "$COMPLETION" != "null" ]]; then
        # Write the completion to the output file
        echo "$COMPLETION" > "$OUTPUT_FILE"
        echo "[INFO] Successfully wrote documentation to $OUTPUT_FILE"
        
        # Log metrics for monitoring
        echo "[METRICS] Execution time: ${DURATION}s | Diff size: ${DIFF_SIZE} bytes | Agent: $AGENT_ID"
        exit 0
      else
        echo "[ERROR] No completion found in response"
        cat response.json 2>/dev/null || echo "[ERROR] Cannot display response.json"
        USE_AGENT=false  # Fall back to direct model invocation
      fi
    else
      if [[ "$USE_AGENT" == "true" ]]; then
        echo "[ERROR] Response file not found"
      fi
      USE_AGENT=false  # Fall back to direct model invocation
    fi
  fi
fi

# If we get here, either agent invocation failed or was not requested
# Fall back to direct model invocation
if [[ "$USE_AGENT" == "false" ]]; then
  echo "[INFO] Using direct model invocation with $MODEL_ID"
  
  # Start timing for metrics (fallback method)
  START_TIME=$(date +%s.%N)
  
  # Create an improved prompt for PR analysis
  PROMPT_PREFIX="You are a senior software engineer reviewing a GitHub Pull Request.\n\nPlease analyze this git diff and create a concise, well-formatted Markdown summary that:\n1. Describes what changed and why it matters\n2. Highlights any potential issues or improvements\n3. Organizes changes by component or feature\n\nGIT DIFF:\n"
  
  # Create a temporary file for the model payload
  MODEL_PAYLOAD_FILE=$(mktemp)
  trap 'rm -f "$MODEL_PAYLOAD_FILE" 2>/dev/null' EXIT
  
  # Create the payload for Anthropic Claude
  # Escape the content properly for JSON
  ESCAPED_CONTENT=$(python3 -c "import json; import sys; print(json.dumps('${PROMPT_PREFIX}${DIFF_CONTENT}')[1:-1])")
  
  # Create the payload with proper JSON structure
  cat > "$MODEL_PAYLOAD_FILE" << EOF
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": $MAX_TOKENS,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "$ESCAPED_CONTENT"
        }
      ]
    }
  ]
}
EOF
  
  # Validate the JSON payload
  if ! jq . "$MODEL_PAYLOAD_FILE" > /dev/null 2>&1; then
    echo "[ERROR] Invalid JSON payload for model invocation!"
    cat "$MODEL_PAYLOAD_FILE"
    exit 3
  fi
  
  # Log the payload for debugging
  echo "[DEBUG] Model payload (first 100 chars):"
  head -c 100 "$MODEL_PAYLOAD_FILE"
  echo "..."
  
  # Invoke the Bedrock model directly
  echo "[INFO] Invoking Bedrock model directly: $MODEL_ID"
  if aws bedrock-runtime invoke-model \
    --model-id "$MODEL_ID" \
    --content-type "application/json" \
    --accept "application/json" \
    --body "file://$MODEL_PAYLOAD_FILE" \
    model-response.json; then
    
    # Calculate metrics
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc 2>/dev/null || echo "unknown")
    DIFF_SIZE=$(wc -c < "$DIFF_FILE" 2>/dev/null || echo "unknown")
    
    # Extract the completion from the model response
    if [[ -f model-response.json ]]; then
      # For Claude models, the response format is different
      if [[ "$MODEL_ID" == *"claude"* ]]; then
        MODEL_RESPONSE=$(cat model-response.json | jq -r '.body' 2>/dev/null | jq -r '.content[0].text' 2>/dev/null)
      else
        # For other models, try a more generic approach
        MODEL_RESPONSE=$(cat model-response.json | jq -r '.body' 2>/dev/null)
      fi
      
      if [[ -n "$MODEL_RESPONSE" && "$MODEL_RESPONSE" != "null" ]]; then
        echo "$MODEL_RESPONSE" > "$OUTPUT_FILE"
        echo "[INFO] Successfully wrote documentation to $OUTPUT_FILE using direct model invocation"
        echo "[METRICS] Execution time: ${DURATION}s | Diff size: ${DIFF_SIZE} bytes | Model: $MODEL_ID"
        exit 0
      else
        echo "[ERROR] Could not extract response from model output"
        cat model-response.json 2>/dev/null || echo "[ERROR] Cannot display model-response.json"
        exit 3
      fi
    else
      echo "[ERROR] Model response file not found"
      exit 3
    fi
  else
    echo "[ERROR] Direct model invocation failed"
    exit 3
  fi
fi

# If we get here, both agent and direct model invocation failed
echo "[ERROR] All invocation methods failed"
exit 5
