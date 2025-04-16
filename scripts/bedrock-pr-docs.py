#!/usr/bin/env python3
"""
AWS Bedrock PR Documentation Generator
A simpler Python-based approach to generate documentation from git diffs
"""

import argparse
import json
import os
import sys


def create_payload(diff_content, max_tokens=1024):
    """Create the Claude payload for PR documentation"""
    prompt = """Analyze this git diff and create a concise Markdown summary that:
1. Describes what changed and why it matters
2. Highlights any potential issues or improvements
3. Organizes changes by component or feature

GIT DIFF:
"""
    
    # Create the Claude-compatible payload
    return {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"{prompt}{diff_content}"
                    }
                ]
            }
        ]
    }


def generate_documentation(diff_file, output_file, model_id):
    """Generate documentation using Bedrock Claude model"""
    import boto3
    
    print(f"[INFO] Processing diff file: {diff_file}")
    print(f"[INFO] Output will be written to: {output_file}")
    
    # Read and sanitize the diff content
    with open(diff_file, 'r', encoding='utf-8') as f:
        # Remove any non-printable characters that might cause JSON issues
        diff_content = ''.join(c for c in f.read() if c.isprintable() or c.isspace())
    
    # Create the payload
    payload = create_payload(diff_content)
    
    # Initialize Bedrock client
    bedrock_runtime = boto3.client('bedrock-runtime')
    
    print(f"[INFO] Invoking Bedrock model: {model_id}")
    
    try:
        # Invoke the model
        response = bedrock_runtime.invoke_model(
            modelId=model_id,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        # Parse the response
        response_body = json.loads(response['body'].read().decode())
        
        # Extract the content
        if 'content' in response_body and len(response_body['content']) > 0:
            generated_text = response_body['content'][0]['text']
            
            # Write the documentation to the output file
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(generated_text)
            
            print(f"[INFO] Successfully wrote documentation to {output_file}")
            return True
        else:
            print("[ERROR] Could not extract content from model response")
            print(f"[DEBUG] Response body: {response_body}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Bedrock invocation failed: {str(e)}")
        return False


def main():
    """Main entrypoint"""
    parser = argparse.ArgumentParser(description='Generate PR documentation using AWS Bedrock')
    parser.add_argument('diff_file', help='Path to the git diff file')
    parser.add_argument('output_file', help='Path to write the generated documentation')
    parser.add_argument('--model-id', default=os.environ.get('MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0'),
                        help='Bedrock model ID')
    parser.add_argument('--max-tokens', type=int, default=int(os.environ.get('MAX_TOKENS', '1024')),
                        help='Maximum tokens to generate')
    
    args = parser.parse_args()
    
    # Generate the documentation
    success = generate_documentation(args.diff_file, args.output_file, args.model_id)
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
