#!/usr/bin/env bash
set -euo pipefail

DIFF_FILE=$1
OUTPUT_FILE=$2
MODEL_ID="anthropic.claude-3-5-sonnet-20240620-v1:0"
MAX_TOKENS=1024

if [[ ! -f $DIFF_FILE ]]; then
  echo "Diff file $DIFF_FILE not found"; exit 1
fi

read -r -d '' PROMPT <<EOF
You are a senior engineer. Convert this git diff into clear Markdown release notes.

\`\`\`diff
$(cat "$DIFF_FILE")
\`\`\`
EOF

# Build JSON and write to a temp file
TMP_JSON=$(mktemp)
jq -n \
  --arg content "$PROMPT" \
  --argjson max_tokens "$MAX_TOKENS" \
  '{
     "anthropic_version": "bedrock-2023-05-31",
     "max_tokens": $max_tokens,
     "messages": [ { "role": "user", "content": $content } ]
   }' > "$TMP_JSON"

echo "Invoking Claude 3.5 Sonnet…"
aws bedrock-runtime invoke-model \
  --model-id "$MODEL_ID" \
  --content-type "application/json" \
  --accept "application/json" \
  --body file://"$TMP_JSON" \
  response.json

DOC_TEXT=$(jq -r '.content[0].text // .content // empty' response.json)
rm "$TMP_JSON"

if [[ -z "$DOC_TEXT" ]]; then
  echo "No content returned from Bedrock"; exit 0
fi

echo "$DOC_TEXT" > "$OUTPUT_FILE"
echo "Documentation saved to $OUTPUT_FILE"
