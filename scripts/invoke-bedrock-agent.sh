#!/usr/bin/env bash
set -e

DIFF_FILE=$1
OUTPUT_FILE=$2

if [ -z "$DIFF_FILE" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 <diff-file> <output-file>"
  exit 1
fi

# 1) Prepare JSON input for Bedrock
PROMPT="You are a senior engineer documenting code changes. Convert this diff into useful developer docs.\nDiff:\n$(cat $DIFF_FILE)"

INPUT_JSON=$(cat <<EOF
{
  "prompt": "$PROMPT",
  "maxTokens": 1024
}
EOF
)

# 2) Invoke a hypothetical doc-agent in Bedrock
# Replace agent or model IDs with your real references
aws bedrock-runtime invoke-model \
  --modelId "anthropic.claude-3" \
  --contentType "application/json" \
  --body "$INPUT_JSON" \
  response.json

# 3) Parse the JSON output
# Typically you'd parse "completion" or "generated_text" from the JSON
DOC_TEXT=$(jq -r '.completion' response.json || echo "")
if [ -z "$DOC_TEXT" ]; then
  echo "No doc generated. Possibly an error."
  exit 0
fi

echo "$DOC_TEXT" > $OUTPUT_FILE
echo "Documentation saved to $OUTPUT_FILE"
