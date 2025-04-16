#!/usr/bin/env bash
set -euxo pipefail

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# --- DEBUG: Print environment and versions ---
echo "[DEBUG] Running on: $(uname -a)"
echo "[DEBUG] Bash version: $BASH_VERSION"
echo "[DEBUG] AWS CLI version: $(aws --version 2>&1 || echo 'not found')"
echo "[DEBUG] jq version: $(jq --version 2>&1 || echo 'not found')"
echo "[DEBUG] MODEL_ID: ${MODEL_ID:-unset}"
echo "[DEBUG] MAX_TOKENS: ${MAX_TOKENS:-unset}"

echo "[DEBUG] Args: DIFF_FILE=$1 OUTPUT_FILE=$2"
DIFF_FILE=$1
OUTPUT_FILE=$2
MODEL_ID="anthropic.claude-3-5-sonnet-20240620-v1:0"
MAX_TOKENS=1024

if [[ ! -f $DIFF_FILE ]]; then
  echo "[ERROR] Diff file $DIFF_FILE not found"; exit 1
fi
if [[ ! -s $DIFF_FILE ]]; then
  echo "[INFO] Diff file $DIFF_FILE is empty; nothing to document. Exiting successfully."
  exit 0
fi

echo "[DEBUG] diff.txt size: $(stat -c%s "$DIFF_FILE" 2>/dev/null || wc -c < "$DIFF_FILE") bytes"
echo "[DEBUG] First 10 lines of diff.txt:"
head -n 10 "$DIFF_FILE" || true

# Force a minimal prompt for troubleshooting
PROMPT="Hello, Claude! Summarize this diff."
# To restore diff-based prompt, comment out above and uncomment below:
# PROMPT="$(cat <<EOF
# You are a senior engineer. Please convert this git diff into clear Markdown release notes describing what changed and why it matters.
#
# $(cat "$DIFF_FILE")
# EOF
# )"

# --- Bedrock Claude Model Invocation ---
MODEL_ID="anthropic.claude-3-5-sonnet-20240620-v1:0"
MAX_TOKENS=1024
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
         "content": [ { "type": "text", "text": $prompt } ]
       }
     ]
   }' > "$TMP_JSON"

# Force UTF-8 encoding in-place (fixes macOS us-ascii issue)
# cat "$TMP_JSON" | iconv -f us-ascii -t utf-8 > "$TMP_JSON.utf8" && mv "$TMP_JSON.utf8" "$TMP_JSON"

echo "[DEBUG] Input JSON for Bedrock Claude model:"
cat "$TMP_JSON"
echo "[DEBUG] JSON file encoding:"
file -I "$TMP_JSON"
echo "[DEBUG] JSON file content (cat -v):"
cat -v "$TMP_JSON"

# Optionally, test with a minimal prompt to isolate issues
# Uncomment the following lines to test:
# PROMPT="Hello, Claude! Summarize this diff."
# jq -n --arg prompt "$PROMPT" --argjson max_tokens "$MAX_TOKENS" '{"anthropic_version": "bedrock-2023-05-31", "max_tokens": $max_tokens, "messages": [{"role": "user", "content": [{"type": "text", "text": $prompt}]}]}' > "$TMP_JSON"

# Validate JSON before sending
if ! jq . "$TMP_JSON" > /dev/null; then
  echo "[ERROR] Invalid JSON payload!"
  exit 3
fi

# Call the Bedrock Claude model
if ! aws bedrock-runtime invoke-model \
  --model-id "$MODEL_ID" \
  --content-type "application/json" \
  --accept "application/json" \
  --body "$(base64 "$TMP_JSON")" \
  response.json; then
  echo "[ERROR] Bedrock model invocation failed!"
  cat response.json || true
  exit 2
fi

echo "[DEBUG] Bedrock Claude response:"
cat response.json

# Extract documentation text from the Claude response
DOC_TEXT=$(jq -r '.content[0].text // .content // empty' response.json || echo "")

if [[ -z "$DOC_TEXT" ]]; then
  echo "[ERROR] No content returned from Bedrock Claude (empty DOC_TEXT)."
  exit 3
fi

echo "$DOC_TEXT" > "$OUTPUT_FILE"
echo "[DEBUG] Documentation saved to $OUTPUT_FILE"
