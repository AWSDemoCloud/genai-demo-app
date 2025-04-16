# GenAI Demo App (All-In-One)

[![AWS](https://img.shields.io/badge/built%20with-AWS-orange?logo=amazon-aws)](https://aws.amazon.com/) [![Node.js](https://img.shields.io/badge/node.js-18.x-brightgreen?logo=node.js)](https://nodejs.org/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Welcome to the **GenAI Demo App**! This project is designed for AWS User Group sessions and workshops, providing a hands-on, end-to-end demonstration of generative AI and automation on AWS. 

> **Demo Author & Maintainer:**
> - **Rahul Ladumor**  
>   [🌐 Portfolio](https://www.rahulladumor.in) | [LinkedIn](https://www.linkedin.com/in/rahulladumor/)

---

**📝 NOTE:**
A full, copy-paste-friendly runbook for setup and deployment is included below for AWS User Group participants. See the [Full Setup & Deployment Guide](#-full-setup--deployment-guide) for a detailed walkthrough!

---

## ✨ What’s Inside?
This repository demonstrates an end-to-end workflow using:
- **Amazon Q Developer** for build/test/vulnerability scanning on PRs
- **Bedrock Agents** for auto-documentation
- **Nova Sonic** TTS to produce an audio summary (via a Lambda function)
- **GitHub Actions** to wire it all together

---

## 🚀 Quick Start

1. **Provision AWS Resources**
   - Ensure you have an AWS account with access to Amazon Q Developer, Bedrock, and a region that supports them.
   - Configure your CLI: `aws configure` or `aws configure sso`.

2. **Deploy the Narrator Lambda**
   ```bash
   cd infra
   sam build
   sam deploy --guided
   ```

---

## 📝 Full Setup & Deployment Guide

Below is a **clear, copy‑paste‑friendly run‑book** that will take you from an empty AWS + GitHub environment to a fully working, end‑to‑end demo.

> **Time‑budget:** ~ 60 min hands‑on (first run)  
> **Live‑demo runtime:** < 10 min  
> **Cost cap:** US $25 (guard‑railed)

---

### 0 — Local prerequisites (5 min)

| Tool | Version (or newer) | Install |
|------|--------------------|---------|
|AWS CLI v2|`aws --version` → `2.16+`|<https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html>|
|AWS SAM CLI|`sam --version` → `1.113+`|<https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html>|
|Node.js LTS|`node -v` → `20.x`|<https://nodejs.org/>|
|GitHub CLI|`gh --version`|<https://cli.github.com>|
|jq (JSON CLI)|`jq --version`|<https://stedolan.github.io/jq/>|

---

### 1 — AWS sandbox & guard‑rails (10 min)

1. **Create a fresh account** in AWS Organizations  
   *Name*: `genai-demo-2025`  
   *Email*: alias such as `aws-demos+2025@your‑domain.com`.

2. **Budget cap**  
   ```bash
   aws budgets create-budget --account-id <sandboxId> --budget file://budget.json
   ```
   `budget.json`
   ```json
   { "BudgetName":"GenAI-Demo","BudgetLimit":{"Amount":"25","Unit":"USD"},
     "TimeUnit":"MONTHLY","BudgetType":"COST" }
   ```

3. **IAM role for SAM deployments**  
   ```bash
   aws iam create-role --role-name GenAIDemoDeployer \
     --assume-role-policy-document file://trust.json
   aws iam attach-role-policy --role-name GenAIDemoDeployer \
     --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
   ```

4. **Enable services (once‑per‑region)**  
   *Bedrock* → Console → “Enable”.  
   *Amazon Q Developer* → Console → “Enable & Link IDE”.

---

### 2 — Clone & push the repo (5 min)

```bash
gh repo create genai-demo-app --public --clone
cd genai-demo-app
# paste all the files you received earlier into this folder
git add .
git commit -m "initial demo skeleton"
git push -u origin main
```

---

### 3 — Deploy the **PR Narrator** stack (SAM) (8 min)

```bash
cd infra
sam build
sam deploy --guided          # accept defaults
```

*Write down* the two outputs:
- `NarratorLambdaArn`  
- `BucketName`

---

### 4 — Connect GitHub ↔ AWS (5 min)

#### 4‑A OIDC for GitHub Actions  
1. In the AWS console → **IAM ▶ Identity providers ▶ Add provider** → “GitHub”.  
2. Create an IAM role `GitHubActionsRole` with OIDC trust and **policy**:

```json
{
  "Version":"2012-10-17",
  "Statement":[
    { "Effect":"Allow",
      "Action":[
        "bedrock:InvokeModel",
        "bedrock:InvokeAgent",
        "ssm:GetParameter",
        "logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"
      ],
      "Resource":"*"}
  ]
}
```

3. Copy the role ARN.

#### 4‑B GitHub repo secrets  
```
Settings ▶ Secrets & variables ▶ Actions
  AWS_ROLE_ARN      = <GitHubActionsRole ARN>
  AWS_REGION        = us-east-1   # or your chosen Bedrock region
```

---

### 5 — Create the **Bedrock doc‑agent** (5 min)

```bash
AGENT_ID=$(aws bedrock-agent create-agent \
  --agent-name doc-agent \
  --foundation-model-id anthropic.claude-3-opus \
  --instruction "Generate concise Markdown docs from code diffs." \
  --guardrail-config '{"guardrailIdentifiers":["gr-default"]}' \
  --output text --query 'agent.agentId')
echo "Agent = $AGENT_ID"
aws ssm put-parameter \
  --name "/genai-demo/doc-agent-id" --type String --value "$AGENT_ID"
```

*(You reference this SSM parameter in the GitHub Action script so the ID never lands in logs.)*

---

### 6 — Enable **Amazon Q Developer** on the repo (3 min)

Console → **Amazon Q Developer ▶ Repositories ▶ Add** → choose `genai-demo-app`.  
Toggle **“Run build & tests”** (Jan 31 2025 feature).

---

### 7 — Wire the Narrator Lambda to PR events (3 min)

1. In GitHub → *Settings ▶ Webhooks* → “Add webhook”.  
2. **Payload URL** = `https://<API‑Gateway‑URL>/narrate` (SAM created this).  
3. **Content type** = `application/json`; **Events** = “Pull request”.  
4. Add secret token if you want signature verification (optional).

*(SAM template already maps `/narrate` to the Lambda; it expects the GitHub PR JSON.)*

---

### 8 — First live test (10 min)

```bash
# create a feature branch with a deliberate bug
git checkout -b feature/bug
echo "const vulnerable = \"SELECT * FROM users WHERE id=\"+userId;" >> app/index.js
git add app/index.js
git commit -m "introduce sql bug"
git push -u origin HEAD
gh pr create -f -t "Buggy PR" -b "Testing demo flow"
```

#### What you should see

| Minutes | Event |
|---------|-------|
|~1 min|**Amazon Q** check starts; CodeBuild runs tests; PR status turns **❌** with SQL‑injection warning.|
|~2 min|GitHub Action step calls **doc‑agent** → `doc.md` commit appears.|
|~3 min|Webhook triggers **Narrator Lambda** → PR comment with 🎧 link; click to hear Nova Sonic summary.|

*(If Bedrock TTS isn’t yet GA in your region, replace `invoke_bedrock_nova_sonic()` with Amazon Polly’s `SynthesizeSpeech` for the same flow.)*

---

### 9 — Troubleshooting quick‑hits

| Symptom | Fix |
|---------|-----|
|`AccessDenied` when GitHub Action calls Bedrock|Role lacks `bedrock:InvokeModel` or `bedrock:InvokeAgent`.|
|Lambda timeout|Raise `Timeout` in `Globals` to 30 s; Nova Sonic may take 2–3 s.|
|No MP3 link|Check CloudWatch logs → did Bedrock return bytes? If not GA, swap to Polly.|

---

### 10 — Cleanup (2 min)

```bash
aws cloudformation delete-stack --stack-name pr-narrator
aws bedrock-agent delete-agent --agent-id $AGENT_ID
aws budgets delete-budget --account-id <sandboxId> --budget-name GenAI-Demo
```

---

#### You’re ready 🎉

With the steps above you can **clone → deploy → PR** and watch:

1. **Amazon Q Developer** catch bugs & run tests.  
2. **Bedrock Agent** write docs automatically.  
3. **Nova Sonic** narrate the whole thing.

---
🛠️ How to Run the End-to-End Demo

1. **Clone this repo** into your AWS/GitHub environment.
2. **Set up services & permissions:**
   - Enable Q Developer (in preview or GA in some regions)
   - Ensure your AWS account has `bedrock:InvokeModel` permissions
   - S3 bucket is auto‑created by the SAM template
   - Provide your GitHub token to Lambda (via environment variable or AWS Secrets Manager)
3. **Push** these files to your main branch
4. **Open a new PR:**
   - "pr-checks" GitHub Action runs → calls `invoke-bedrock-agent.sh` → commits `doc.md`
   - Q Developer or CodeBuild runs your tests, scanning for vulnerabilities
   - Once everything merges, you can manually (or automatically) trigger the **PR Narrator**
   - On success, you’ll see a “listen to summary” link in the PR

---

## 🙌 For AWS User Group Attendees
- This project merges advanced AWS and GenAI features into a single, cohesive demonstration.
- Feel free to fork, adapt, or extend for your own learning or presentations.
- For questions, reach out to [Rahul Ladumor](https://www.linkedin.com/in/rahulladumor/).

---

## 💡 Final Tips
- **Guardrails:** Enable PII detection, content moderation, or custom blocklists for your Bedrock doc-agent.
- **Cost Controls:** Add a monthly budget in AWS Budgets, or set up Cost Anomaly Detection for your `genai-demo-app` resources.
- **Security:** Don’t store real secrets in plain text. Use AWS Secrets Manager or GitHub encrypted secrets.
- **Fallback:** Always have a recorded run (screenshots, or a short Loom video) in case the live environment fails during your talk.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues) or submit a pull request.

## 📄 License
This project is [MIT licensed](LICENSE).

---

Enjoy your advanced, end‑to‑end generative AI demo on AWS!
