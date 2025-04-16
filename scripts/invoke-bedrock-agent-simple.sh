#!/usr/bin/env bash
set -euo pipefail

# Simple Bedrock Agent Invoker for PR Documentation
# This script uses jq for proper JSON escaping

# --- Configuration ---
MODEL_ID=${MODEL_ID:-"anthropic.claude-3-sonnet-20240229-v1:0"}
MAX_TOKENS=${MAX_TOKENS:-1024}

# --- Argument Validation ---
if [[ $# -lt 2 ]]; then
  echo "[ERROR] Missing required arguments"
  echo "Usage: $0 diff_file output_file"
  exit 1
fi

DIFF_FILE=$1
OUTPUT_FILE=$2

echo "[INFO] Processing diff file: $DIFF_FILE"
echo "[INFO] Output will be written to: $OUTPUT_FILE"

# Check if diff file exists
if [[ ! -f $DIFF_FILE ]]; then
  echo "[ERROR] Diff file $DIFF_FILE not found"; exit 1
fi

# Create a temporary directory for working files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Create a sanitized version of the diff (ASCII only)
SANITIZED_DIFF="$TEMP_DIR/sanitized.txt"
cat "$DIFF_FILE" | tr -cd '[:print:][:space:]' > "$SANITIZED_DIFF"

# Create a simple prompt
PROMPT="Analyze this git diff and create a concise Markdown summary that describes what changed and why it matters."

# Create the JSON payload with jq (proper JSON escaping)
PAYLOAD_FILE="$TEMP_DIR/payload.json"
jq -n \
  --arg prompt "$PROMPT" \
  --arg diff "$(cat "$SANITIZED_DIFF")" \
  '{
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": ($prompt + "\n\nGIT DIFF:\n" + $diff)
          }
        ]
      }
    ]
  }' > "$PAYLOAD_FILE"

# Validate the JSON
if ! jq . "$PAYLOAD_FILE" > /dev/null 2>&1; then
  echo "[ERROR] Invalid JSON payload"
  exit 3
fi

# Invoke the model
echo "[INFO] Invoking Bedrock model: $MODEL_ID"
RESPONSE_FILE="$TEMP_DIR/response.json"

if aws bedrock-runtime invoke-model \
  --model-id "$MODEL_ID" \
  --content-type "application/json" \
  --accept "application/json" \
  --body "file://$PAYLOAD_FILE" \
  "$RESPONSE_FILE"; then
  
  # Extract the response
  if [[ -f "$RESPONSE_FILE" ]]; then
    # For Claude models
    MODEL_RESPONSE=$(jq -r '.body | fromjson | .content[0].text' "$RESPONSE_FILE" 2>/dev/null)
    
    if [[ -n "$MODEL_RESPONSE" && "$MODEL_RESPONSE" != "null" ]]; then
      echo "$MODEL_RESPONSE" > "$OUTPUT_FILE"
      echo "[INFO] Successfully wrote documentation to $OUTPUT_FILE"
      exit 0
    else
      echo "[ERROR] Could not extract response from model output"
      cat "$RESPONSE_FILE"
      exit 3
    fi
  else
    echo "[ERROR] Response file not found"
    exit 3
  fi
else
  echo "[ERROR] Model invocation failed"
  exit 3
fi