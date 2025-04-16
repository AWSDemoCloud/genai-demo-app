#!/usr/bin/env bash
set -euxo pipefail

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

PROMPT="$(cat <<EOF
You are a senior engineer. Convert this git diff into clear Markdown release notes.

\`\`\`diff
$(cat "$DIFF_FILE")
\`\`\`
EOF
)"

# Build JSON and write to a temp file
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

echo "[DEBUG] Input JSON for Bedrock:"
cat "$TMP_JSON"

echo "[DEBUG] Invoking Claude 3.5 Sonnet via Bedrock…"
if ! aws bedrock-runtime invoke-model \
  --model-id "$MODEL_ID" \
  --content-type "application/json" \
  --accept "application/json" \
  --body file://"$TMP_JSON" \
  response.json; then
  echo "[ERROR] Bedrock model invocation failed!"
  cat response.json || true
  exit 2
fi

echo "[DEBUG] Bedrock response:"
cat response.json

DOC_TEXT=$(jq -r '.content[0].text // .content // empty' response.json || echo "")

if [[ -z "$DOC_TEXT" ]]; then
  echo "[ERROR] No content returned from Bedrock (empty DOC_TEXT)."
  exit 3
fi

echo "$DOC_TEXT" > "$OUTPUT_FILE"
echo "[DEBUG] Documentation saved to $OUTPUT_FILE"
