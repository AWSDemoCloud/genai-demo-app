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

PROMPT="Hello, Claude! Please summarize this diff."

# --- Bedrock Agent Invocation ---
# TODO: Replace <YOUR_AGENT_ID> with your actual Bedrock Agent ID
AGENT_ID="J1EYXCJDID"
AGENT_ALIAS_ID="DEMOAWS"
SESSION_ID="$(uuidgen)"

# Use PROMPT as input text for agent
INPUT_TEXT="$PROMPT"

# Call the Bedrock Agent
if ! aws bedrock-agent-runtime invoke-agent \
  --agent-id "$AGENT_ID" \
  --agent-alias-id "$AGENT_ALIAS_ID" \
  --session-id "$SESSION_ID" \
  --input-text "$INPUT_TEXT" \
  response.json; then
  echo "[ERROR] Bedrock agent invocation failed!"
  cat response.json || true
  exit 2
fi

echo "[DEBUG] Bedrock Agent response:"
cat response.json

# Extract documentation text (adjust this jq filter as needed based on your agent's response schema)
DOC_TEXT=$(jq -r '.completion // .output // .content // empty' response.json || echo "")

if [[ -z "$DOC_TEXT" ]]; then
  echo "[ERROR] No content returned from Bedrock Agent (empty DOC_TEXT)."
  exit 3
fi

echo "$DOC_TEXT" > "$OUTPUT_FILE"
echo "[DEBUG] Documentation saved to $OUTPUT_FILE"
