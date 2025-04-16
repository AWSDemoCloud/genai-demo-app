#!/usr/bin/env bash
set -e

DIFF_FILE=$1
OUTPUT_FILE=$2
MODEL_ID="anthropic.claude-3-5-sonnet-20240620-v1:0"  # <-- NEW

PROMPT=$(cat <<EOF
You are a senior engineer documenting code changes. Convert this diff into clear Markdown docs.

Diff:
$(cat "$DIFF_FILE")
EOF
)

REQUEST=$(jq -n --arg p "$PROMPT" '{prompt:$p, max_tokens:1024}')

aws bedrock-runtime invoke-model \
  --model-id "$MODEL_ID" \
  --content-type "application/json" \
  --body "$REQUEST" \
  response.json

DOC_TEXT=$(jq -r '.completion // .generated_text // empty' response.json)
echo "$DOC_TEXT" > "$OUTPUT_FILE"
