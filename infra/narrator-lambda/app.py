import json
import os
import boto3
import http.client
from botocore.exceptions import ClientError

# Ensure all dependencies are imported and available

s3 = boto3.client("s3")
bedrock = boto3.client("bedrock-runtime")

def lambda_handler(event, context):
    # 1) Parse event for PR number / repo info, or fetch from param store
    pr_number = event.get("pr_number", 1)
    repo_owner = os.getenv("REPO_OWNER", "my-org")
    repo_name = os.getenv("REPO_NAME", "genai-demo-app")
    github_token = os.getenv("GITHUB_TOKEN", "<store-in-secrets>")

    # 2) Collect Q Developer summary (simulated) or read from GitHub checks
    #    Real code might do a GitHub request to /repos/{owner}/{repo}/check-runs
    q_summary = "Amazon Q found 1 potential issue: SQL injection."

    # 3) Collect doc from auto-doc commits or read doc.md from the PR branch
    doc_md = get_file_from_github("doc.md", repo_owner, repo_name, pr_number, github_token)
    if not doc_md:
        doc_md = "No additional docs generated."

    # 4) Summarize both Q summary + doc content into ~75 words
    combined = f"Q Developer found:\n{q_summary}\n---\nAuto-doc:\n{doc_md}"
    prompt = f"Summarize this in 75 words or less:\n\n{combined}"

    # 5) Call hypothetical 'Nova Sonic' voice model (Bedrock)
    # We'll do a two-step approach: first text summary, then text-to-speech
    text_summary = invoke_bedrock_text_summarize(prompt)
    mp3_bytes = invoke_bedrock_nova_sonic(text_summary)

    # 6) Upload MP3 to S3
    bucket_name = os.getenv("S3_BUCKET")
    object_key = f"pr-audio-summary-{pr_number}.mp3"
    s3.put_object(Bucket=bucket_name, Key=object_key, Body=mp3_bytes, ContentType="audio/mpeg")

    # 7) Generate a presigned URL, valid for ~1 day
    presigned_url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket_name, "Key": object_key},
        ExpiresIn=86400
    )

    # 8) Post a comment on PR
    comment_on_github_pr(pr_number, repo_owner, repo_name, github_token, presigned_url)

    return {"statusCode": 200, "body": "Audio summary generated."}


def get_file_from_github(filename, owner, repo, pr_number, token):
    # Example of GET /repos/{owner}/{repo}/pulls/{pr_number}/files
    # Then find 'filename' if changed or retrieve raw from branch
    # For brevity, we’ll just return None or mock content
    return "Sample auto-generated doc content..."

def invoke_bedrock_text_summarize(prompt):
    # Call a hypothetical large language model. In practice:
    # bedrock.invoke_model(...foundationModelId=“anthropic.claude-x”, body=...)
    # For now, we just pretend:
    summarized_text = "This PR updates code with new features. 1 potential issue is flagged. Docs are auto-generated."
    return summarized_text.encode("utf-8")

def invoke_bedrock_nova_sonic(text_summary):
    # Hypothetical TTS step using the new Nova Sonic voice model
    # In reality, you’d do something like:
    #
    #  resp = bedrock.invoke_model(
    #    modelId="amazon.nova-sonic",
    #    contentType="application/json",
    #    body=json.dumps({"prompt": text_summary, "voice":"ModernMale"})
    #  )
    #  mp3_data = resp["audio"]  # hypothetical key
    #
    # Return dummy MP3 bytes:
    return b"\x00\x01\x02FAKE_MP3_DATA\x03\x04"

def comment_on_github_pr(pr_number, owner, repo, token, presigned_url):
    comment_body = {
        "body": f":loud_sound: Here’s your audio summary: [Listen here]({presigned_url})"
    }
    conn = http.client.HTTPSConnection("api.github.com")
    path = f"/repos/{owner}/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "narrator-lambda",
        "Accept": "application/vnd.github+json"
    }
    try:
        conn.request("POST", path, json.dumps(comment_body), headers)
        resp = conn.getresponse()
        print("GitHub status", resp.status, resp.reason)
        print(resp.read().decode())
    except Exception as e:
        print(f"Failed to comment on GitHub PR: {e}")
    finally:
        conn.close()

