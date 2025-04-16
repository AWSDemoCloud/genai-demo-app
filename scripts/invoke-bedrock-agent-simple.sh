#!/usr/bin/env bash
set -euo pipefail

# Simple Bedrock Agent Invoker for PR Documentation
# This script avoids complex Python escaping and uses a more direct approach

# --- Configuration ---
AGENT_ID=${AGENT_ID:-""}
AGENT_ALIAS_ID=${AGENT_ALIAS_ID:-""}
MODEL_ID=${MODEL_ID:-"anthropic.claude-3-5-sonnet-20240620-v1:0"}
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

# Check for binary data
if file --mime "$DIFF_FILE" | grep -q -v "text/"; then
  echo "[ERROR] Diff contains binary/non-text data. Cannot process."
  exit 4
fi

# Create a temporary directory for working files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# --- Direct Model Invocation ---
echo "[INFO] Using direct model invocation with $MODEL_ID"

# Create a simplified prompt
PROMPT_FILE="$TEMP_DIR/prompt.txt"
cat > "$PROMPT_FILE" << EOF
You are a senior software engineer reviewing a GitHub Pull Request.

Please analyze this git diff and create a concise, well-formatted Markdown summary that:
1. Describes what changed and why it matters
2. Highlights any potential issues or improvements
3. Organizes changes by component or feature

GIT DIFF:
$(cat "$DIFF_FILE")
EOF

# Create a simplified JSON payload
PAYLOAD_FILE="$TEMP_DIR/payload.json"
cat > "$PAYLOAD_FILE" << EOF
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": $MAX_TOKENS,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "$(sed 's/"/\\"/g' "$PROMPT_FILE" | tr '\n' ' ')"
        }
      ]
    }
  ]
}
EOF

# Invoke the model
echo "[INFO] Invoking Bedrock model directly: $MODEL_ID"
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
    MODEL_RESPONSE=$(cat "$RESPONSE_FILE" | jq -r '.body' 2>/dev/null | jq -r '.content[0].text' 2>/dev/null)
    
    if [[ -n "$MODEL_RESPONSE" && "$MODEL_RESPONSE" != "null" ]]; then
      echo "$MODEL_RESPONSE" > "$OUTPUT_FILE"
      echo "[INFO] Successfully wrote documentation to $OUTPUT_FILE"
      exit 0
    else
      echo "[ERROR] Could not extract response from model output"
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
