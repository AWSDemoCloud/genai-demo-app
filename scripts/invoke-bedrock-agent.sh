#!/usr/bin/env bash
set -euxo pipefail

# --- DEBUG: Print environment and versions ---
echo "[DEBUG] Running on: $(uname -a)"
echo "[DEBUG] Bash version: $BASH_VERSION"

MODEL_ID="anthropic.claude-3-5-sonnet-20240620-v1:0"
MAX_TOKENS=1024
echo "[DEBUG] AWS CLI version: $(aws --version 2>&1 || echo 'not found')"
echo "[DEBUG] jq version: $(jq --version 2>&1 || echo 'not found')"
echo "[DEBUG] MODEL_ID: $MODEL_ID"
echo "[DEBUG] MAX_TOKENS: $MAX_TOKENS"

echo "[DEBUG] Args: DIFF_FILE=$1 OUTPUT_FILE=$2"
DIFF_FILE=$1
OUTPUT_FILE=$2

# --- Validate input file ---
if [[ ! -f $DIFF_FILE ]]; then
  echo "[ERROR] Diff file $DIFF_FILE not found"; exit 1
fi

# --- Check for binary/non-text data ---
if file --mime-encoding "$DIFF_FILE" | grep -qv 'us-ascii\|utf-8'; then
  echo "[ERROR] Diff contains binary/non-text data. Cannot process."
  exit 4
fi

if [[ ! -s $DIFF_FILE ]]; then
  echo "[INFO] Diff file is empty; nothing to document. Exiting."
  exit 0
fi

# --- Sanitize and prepare diff content ---
SANITIZED_DIFF=$(jq -Rs . "$DIFF_FILE")
PROMPT="You are a senior engineer. Convert this git diff into Markdown release notes describing changes and their impact:

$SANITIZED_DIFF"

# --- Create JSON payload ---
TMP_JSON=$(mktemp)
trap 'rm -f "$TMP_JSON" response.json' EXIT

jq -n \
  --arg prompt "$PROMPT" \
  --argjson max_tokens "$MAX_TOKENS" \
  '{
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": $max_tokens,
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": $prompt
          }
        ]
      }
    ]
  }' > "$TMP_JSON"

echo "[DEBUG] Input JSON:"
cat "$TMP_JSON"

# --- Validate JSON before invocation ---
if ! jq -e . "$TMP_JSON" >/dev/null; then
  echo "[ERROR] Invalid JSON payload!"
  jq . "$TMP_JSON"
  exit 3
fi

# --- Invoke Bedrock model ---
if ! aws bedrock-runtime invoke-model \
  --model-id "$MODEL_ID" \
  --content-type "application/json" \
  --accept "application/json" \
  --body "file://$TMP_JSON" \
  response.json; then
  echo "[ERROR] Model invocation failed!"
  [[ -f response.json ]] && cat response.json || true
  exit 2
fi

# --- Process response ---
DOC_TEXT=$(jq -r '.content[0].text // empty' response.json)
if [[ -z "$DOC_TEXT" ]]; then
  echo "[ERROR] Empty response from Bedrock!"
  exit 3
fi

echo "$DOC_TEXT" > "$OUTPUT_FILE"
echo "[SUCCESS] Documentation saved to $OUTPUT_FILE"
