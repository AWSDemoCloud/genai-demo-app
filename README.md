# GenAI PR Enhancement Pipeline

[![AWS](https://img.shields.io/badge/built%20with-AWS-orange?logo=amazon-aws)](https://aws.amazon.com/) [![Node.js](https://img.shields.io/badge/node.js-18.x-brightgreen?logo=node.js)](https://nodejs.org/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Welcome to the **GenAI PR Enhancement Pipeline**! This project showcases the power of AWS Generative AI services to revolutionize the developer experience by automating and enhancing the Pull Request workflow.

> **Demo Author & Maintainer:**
> - **Rahul Ladumor**  
>   [🌐 Portfolio](https://www.rahulladumor.in) | [LinkedIn](https://www.linkedin.com/in/rahulladumor/)

---

## 💡 Purpose & Overview

### What This Demo Solves

Developers and teams face several challenges with pull requests:

1. **Documentation Burden**: Writing comprehensive PR documentation is time-consuming
2. **Quality Assurance**: Manual code reviews often miss security issues and best practices
3. **Accessibility**: Understanding complex code changes through text alone can be difficult
4. **Collaboration**: Explaining changes to non-technical stakeholders is challenging

### How This Demo Solves These Challenges

The GenAI PR Enhancement Pipeline addresses these challenges by creating an intelligent, fully automated workflow that:

1. **Auto-generates Documentation**: Produces comprehensive, contextual documentation for each PR
2. **Ensures Code Quality**: Automatically finds security vulnerabilities and suggests improvements
3. **Creates Audio Summaries**: Transforms technical changes into accessible spoken narratives
4. **Streamlines Collaboration**: Makes PR content understandable for all team members

## 🖼 System Architecture 

### High-Level Architecture Diagram

```
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│                   │       │                   │       │                   │
│   GitHub          │       │   AWS Services    │       │   Outputs         │
│                   │       │                   │       │                   │
└───────┬───────────┘       └────────┬──────────┘       └───────────────────┘
        │                            │
        ▼                            │
┌───────────────────┐                │
│                   │                │
│   Pull Request    │                │
│   Created/Updated │                │
│                   │                │
└───────┬───────────┘                │
        │                            │
        ▼                            ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│                   │       │                   │       │                   │
│   GitHub Action   │──────▶│   Amazon Q       │──────▶│   PR Check        │
│   Workflow        │       │   Developer      │       │   Results         │
│                   │       │                   │       │                   │
└───────┬───────────┘       └───────────────────┘       └───────────────────┘
        │                            ▲
        │                            │
        ▼                            │
┌───────────────────┐                │
│                   │                │
│   Bedrock Claude  │────────────────┘       ┌───────────────────┐
│   Invocation      │                        │                   │
│                   │─────────────────────▶ │   Auto-Generated  │
└───────┬───────────┘                        │   Documentation   │
        │                                    │                   │
        │                                    └───────────────────┘
        ▼                                              ▲
┌───────────────────┐       ┌───────────────────┐      │
│                   │       │                   │      │
│   Lambda          │──────▶│   Bedrock        │──────┘
│   PR Narrator     │       │   Text-to-Speech │
│                   │       │                   │
└───────┬───────────┘       └───────┬───────────┘
        │                            │
        │                            ▼
        │                   ┌───────────────────┐
        │                   │                   │
        │                   │   S3 Bucket       │
        │                   │                   │
        │                   └───────┬───────────┘
        │                            │
        ▼                            ▼
┌───────────────────┐       ┌───────────────────┐
│                   │       │                   │
│   PR Comment      │◀──────│   Audio Summary   │
│   with Link       │       │   URL             │
│                   │       │                   │
└───────────────────┘       └───────────────────┘
```

### Flow Explanation

1. **Pull Request Trigger**:
   - Developer creates or updates a PR in GitHub
   - GitHub Actions workflow is automatically triggered

2. **Parallel Processing**:
   - **Path A**: Amazon Q Developer analyzes code for quality and security issues
   - **Path B**: Bedrock Claude analyzes PR diff to generate documentation
   - **Path C**: Lambda PR-Narrator orchestrates the audio summary creation

3. **Documentation Generation**:
   - Claude 3 Sonnet processes the PR diff
   - Generates detailed Markdown documentation
   - Documentation is committed back to the PR branch

4. **Audio Summary Creation**:
   - PR-Narrator Lambda fetches PR details
   - Generates a concise summary
   - Sends the summary to Bedrock Nova Sonic for TTS conversion
   - Stores the audio file in S3
   - Creates a pre-signed URL for access

5. **Results Delivery**:
   - PR check results from Amazon Q are displayed in GitHub
   - Auto-generated documentation appears as a commit in the PR
   - Audio summary link is posted as a comment on the PR

This architecture leverages serverless components for maximum scalability and cost efficiency, with clear separation of concerns between services.

## 💻 AWS Services Showcase

This demo specifically highlights the following AWS services and their unique capabilities:

### 1. Amazon Bedrock

**What It Does**: Amazon Bedrock is a fully managed service that provides foundation models from leading AI companies through a unified API.

**How We Use It**:
- **Claude 3 Sonnet Model**: Analyzes PR diffs to generate high-quality documentation
- **Nova Sonic TTS**: Converts PR summaries into natural-sounding audio narratives

**Advantages for Your Projects**:
- No ML expertise required to implement advanced GenAI capabilities
- Pay-per-use pricing with no upfront commitments
- Enterprise-grade security with your data and prompts kept private
- Access to state-of-the-art models without infrastructure management

### 2. Amazon Q Developer

**What It Does**: Amazon Q Developer is an AI-powered assistant that helps developers build, enhance, and operate applications.

**How We Use It**:
- **Automated PR Reviews**: Scans code for security vulnerabilities, code quality issues, and best practices
- **Suggested Fixes**: Provides actionable recommendations to improve code

**Advantages for Your Projects**:
- Embeds security best practices directly into your development workflow
- Reduces time spent on manual code reviews
- Helps developers learn better coding practices
- Integrates seamlessly with existing GitHub workflows

### 3. AWS Lambda

**What It Does**: Lambda is a serverless compute service that lets you run code without provisioning or managing servers.

**How We Use It**:
- **PR Narrator Function**: Orchestrates the entire workflow from PR creation to audio generation
- **GitHub Integration**: Processes webhook events and commits changes back to repositories

**Advantages for Your Projects**:
- Serverless architecture eliminates infrastructure management
- Automatic scaling to handle any number of PRs
- Cost-effective with pay-for-what-you-use pricing
- High availability and fault tolerance built-in

### 4. Amazon S3

**What It Does**: S3 provides object storage for file storage and hosting.

**How We Use It**:
- **Audio Storage**: Stores the generated audio summaries
- **Content Delivery**: Provides access to audio files via pre-signed URLs

**Advantages for Your Projects**:
- Highly durable and available storage
- Cost-effective for varying storage needs
- Built-in versioning and lifecycle management
- Integrates with AWS security services

### 5. AWS CloudFormation (via SAM)

**What It Does**: CloudFormation lets you model and provision AWS resources using infrastructure as code.

**How We Use It**:
- **Infrastructure Definition**: Defines all required resources in a template
- **Automated Deployment**: Ensures consistent and repeatable deployments

**Advantages for Your Projects**:
- Infrastructure as code for version control and repeatability
- Automated deployments reduce human error
- Simplified resource management across environments
- Comprehensive dependency management

---

**📝 NOTE:**
This demo is designed for AWS Community Day sessions and provides a full, copy-paste-friendly runbook for setup and deployment. See the [Full Setup & Deployment Guide](#-full-setup--deployment-guide) for a detailed walkthrough!

---

## 👀 What This Demo Does

This repository demonstrates an intelligent GitHub Pull Request workflow using AWS GenAI services:

1. **Auto Documentation**: Uses Amazon Bedrock's Claude 3 Sonnet to analyze PR changes and automatically generate comprehensive documentation
2. **Code Quality**: Leverages Amazon Q Developer to detect security vulnerabilities and code issues
3. **Audio Narration**: Creates spoken summaries of PRs using Bedrock's Nova Sonic voice AI
4. **Seamless GitHub Integration**: Automates the entire workflow through GitHub Actions

---

## 🚀 Quick Setup (15 minutes)

### Prerequisites

- AWS Account with appropriate IAM permissions
- GitHub repository where you want to implement this workflow
- AWS CLI v2 installed and configured locally
- AWS SAM CLI installed for deploying serverless resources
- Basic understanding of GitHub Actions

### Step 1: Set Up AWS Services

1. **Enable Required AWS Services**:
   ```bash
   # Check if Bedrock is available in your region
   aws bedrock list-foundation-models --region us-east-1
   
   # If not available, use a supported region like us-east-1 or us-west-2
   aws configure set region us-east-1
   ```

2. **Create IAM Permissions**:
   ```bash
   # Create a policy for GitHub Actions
   aws iam create-policy --policy-name GitHubActionsBedrockPolicy --policy-document file://aws-policy.json
   ```

   Save this as `aws-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "s3:PutObject",
           "s3:GetObject",
           "lambda:InvokeFunction"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### Step 2: Deploy the PR Narrator Lambda

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/genai-demo-app.git
   cd genai-demo-app
   ```

2. **Deploy Lambda Using SAM**:
   ```bash
   cd infra
   sam build
   sam deploy --guided
   ```

3. **Note the Outputs**:
   After successful deployment, note these outputs:
   - `NarratorLambdaArn` - The Lambda function ARN
   - `S3BucketName` - The S3 bucket for audio files
   - `ApiEndpoint` - The API Gateway endpoint URL

---

### Step 3: Configure GitHub Integration

1. **Set Up GitHub Secrets**:
   - Go to your repository settings → Secrets and variables → Actions
   - Add the following secrets:
     - `AWS_ROLE_ARN`: IAM role ARN with permissions to invoke Bedrock and Lambda
     - `AWS_REGION`: Region where you deployed your resources (e.g., `us-east-1`)
     - `GITHUB_TOKEN`: Your GitHub personal access token with repo permissions

2. **Add GitHub Actions Workflow**:
   - Create a directory: `.github/workflows/`
   - Copy the `pr-checks.yml` from this repository to your own

3. **Update Workflow Configuration**:
   - Modify the Lambda function name in the workflow file:
     ```yaml
     # Find this section in pr-checks.yml
     env:
       LAMBDA_FUNCTION: "your-lambda-function-name-from-sam-outputs"
       MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0"
     ```

### Step 4: Test the Integration

1. **Create a Test Pull Request**:
   ```bash
   # Create a new branch
   git checkout -b test/demo-feature
   
   # Make some changes
   echo "// Test feature for demo" >> app/index.js
   
   # Commit and push
   git add .
   git commit -m "Add test feature for demo"
   git push origin test/demo-feature
   
   # Create PR
   gh pr create --title "Test PR for GenAI workflow" --body "This is a test PR to demonstrate the GenAI PR Enhancement workflow."
   ```

2. **Monitor Workflow Execution**:
   - Go to your repository's Actions tab
   - You should see the workflow running for your new PR
   - Check the progress of each step: Amazon Q review, Bedrock documentation, and PR Narrator

3. **View Results**:
   - When complete, check your PR for:
     - Automatically generated documentation in a new commit
     - Code quality feedback from Amazon Q
     - A comment with an audio summary link (click to listen!)

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

## 📄 License
This project is [MIT licensed](LICENSE).

---

## 🛠️ How It Works: Detailed System Explanation

This section provides a comprehensive explanation of how each component in the GenAI PR Enhancement Pipeline works and interacts with other parts of the system.

### 1. System Components Overview

The pipeline consists of these key components:

| Component | Type | Purpose |
|-----------|------|---------|
| GitHub Actions Workflow | Orchestration | Coordinates the entire process when PRs are created/updated |
| Amazon Q Developer | Code Analysis | Automatically reviews code for quality and security issues |
| Bedrock Claude 3 Sonnet | AI Model | Generates PR documentation by analyzing code changes |
| PR-Narrator Lambda | Serverless Function | Creates and posts audio summaries of PRs |
| Bedrock Nova Sonic | Text-to-Speech | Converts PR summaries to natural-sounding audio |
| S3 Bucket | Storage | Stores generated audio files |

### 2. Workflow Sequence

Here's the exact sequence of events that occurs when a PR is created or updated:

#### 2.1 PR Creation Triggers

When a developer creates or updates a PR in GitHub, three parallel processes are initiated:

1. **GitHub Actions Workflow** is triggered by the PR event
2. **Amazon Q Developer** receives a webhook notification
3. **PR-Narrator Lambda** can optionally be triggered directly via webhook

#### 2.2 Amazon Q Developer Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  GitHub         │────▶│  Amazon Q       │────▶│  Code Analysis  │
│  PR Event       │     │  Developer      │     │  & Review       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │                 │
                                                │  GitHub PR      │
                                                │  Check Results  │
                                                │                 │
                                                └─────────────────┘
```

**How Amazon Q Developer Works:**

1. **Setup**: Amazon Q Developer is connected to your GitHub repository through the AWS Console
2. **Triggering**: When a PR is created/updated, GitHub sends a webhook to Amazon Q
3. **Analysis**: Amazon Q Developer:
   - Pulls the code changes from the PR
   - Analyzes code for security vulnerabilities, quality issues, and best practices
   - Uses AI to identify potential problems
4. **Results**: Amazon Q Developer posts its findings:
   - As a "check" in the GitHub PR's "Checks" tab
   - As inline comments on specific lines of code with issues
   - With severity levels and suggested fixes

**Key Point**: Amazon Q Developer operates independently from your GitHub Actions workflow. It's a separate service that integrates directly with GitHub.

#### 2.3 Documentation Generation Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  GitHub         │────▶│  GitHub Actions │────▶│  Checkout Code  │
│  PR Event       │     │  Workflow       │     │  & Generate Diff│
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Commit Doc     │◀────│  Process        │◀────│  Invoke Bedrock │
│  to PR Branch   │     │  Response       │     │  Claude Model   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**How Documentation Generation Works:**

1. **Diff Creation**: The GitHub Actions workflow:
   - Checks out the PR code
   - Generates a diff of the changes using Git commands
   - Sanitizes the diff for processing

2. **Bedrock Invocation**: The workflow calls Bedrock Claude using `invoke-bedrock-agent-simple.sh`:
   - Creates a JSON payload with the diff and a documentation prompt
   - Invokes the Claude 3 Sonnet model via AWS CLI
   - Processes the response to extract the generated documentation

3. **Documentation Commit**: The workflow:
   - Saves the generated documentation as `doc.md`
   - Commits this file back to the PR branch
   - This appears as a new commit in the PR

**Technical Details:**
- The Bedrock invocation uses the model ID: `anthropic.claude-3-sonnet-20240229-v1:0`
- The script uses `jq` for proper JSON escaping
- The prompt specifically asks for Markdown-formatted documentation

#### 2.4 Audio Summary Generation Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  GitHub Actions │────▶│  Invoke Lambda  │────▶│  PR-Narrator    │
│  Workflow       │     │  Function       │     │  Lambda         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Post Comment   │◀────│  Process        │◀────│  Generate Audio │
│  with Audio Link│     │  Lambda Response│     │  with Bedrock   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │                 │
                                                │  Store Audio    │
                                                │  in S3 Bucket   │
                                                │                 │
                                                └─────────────────┘
```

**How Audio Summary Generation Works:**

1. **Lambda Invocation**: The GitHub Actions workflow:
   - Creates a JSON payload with PR details (PR number, repository, commit SHA)
   - Invokes the PR-Narrator Lambda function using AWS CLI
   - Waits for the Lambda response

2. **PR-Narrator Lambda Processing**:
   - Receives the PR details from the workflow
   - Fetches additional PR information from GitHub API if needed
   - Generates a concise summary of the PR changes
   - Formats the summary with SSML tags for better speech quality
   - Invokes Bedrock Nova Sonic for text-to-speech conversion
   - Stores the audio file in an S3 bucket
   - Creates a pre-signed URL for the audio file
   - Returns the summary text and audio URL to the workflow

3. **Comment Creation**: The GitHub Actions workflow:
   - Receives the Lambda response with summary and audio URL
   - Creates a comment on the PR with:
     - The text summary
     - A link to the audio file
     - Formatting and emojis for better presentation

**Technical Details:**
- The Lambda function uses Node.js with AWS SDK v3
- SSML formatting enhances audio quality with:
  - Dynamic speech rates and pitch for different content types
  - Appropriate pauses between sections
  - Proper pronunciation of technical terms
- The audio is generated with high-quality settings:
  - 24kHz sample rate
  - 320kbps bit rate for studio-quality output

### 3. Key Files and Their Functions

| File | Purpose | Key Functionality |
|------|---------|-------------------|
| `.github/workflows/pr-checks.yml` | Main workflow definition | Orchestrates the entire process |
| `scripts/invoke-bedrock-agent-simple.sh` | Bedrock invocation | Calls Claude 3 Sonnet for documentation |
| `lambda/pr-narrator/index.js` | Lambda function code | Generates and posts audio summaries |
| `infra/template.yaml` | SAM template | Defines AWS resources (Lambda, S3, etc.) |

#### 3.1 GitHub Actions Workflow File

The workflow file (`.github/workflows/pr-checks.yml`) defines three main jobs:

1. **amazon-q-review**: Performs comprehensive code review using Amazon Q Developer, analyzing code for security vulnerabilities, best practices, and optimization opportunities
2. **bedrock-docs**: Generates documentation using Bedrock Claude
3. **pr-narrator**: Invokes Lambda for audio summary generation

#### 3.1.1 Amazon Q Developer Code Review

The Amazon Q Developer code review process implements advanced security analysis and best practice enforcement:

**Security Analysis:**
- **SAST (Static Application Security Testing)**: Scans code for common vulnerabilities including:
  - SQL injection vectors
  - Cross-site scripting (XSS) vulnerabilities
  - Authentication weaknesses
  - Insecure cryptographic implementations
  - Hardcoded credentials and secrets
- **Dependency Scanning**: Identifies vulnerable dependencies and outdated packages
- **IAM Policy Analysis**: Validates IAM permissions follow least privilege principles
- **Secrets Detection**: Uses pattern matching to identify potential leaked credentials

**Compliance Checks:**
- **Regulatory Compliance**: Validates code against standards like PCI-DSS, HIPAA, and GDPR
- **AWS Best Practices**: Ensures adherence to AWS Well-Architected Framework principles
- **Custom Security Policies**: Enforces organization-specific security requirements

**Performance Optimization:**
- **Resource Efficiency**: Identifies potential memory leaks and CPU-intensive operations
- **Cost Optimization**: Suggests more cost-effective AWS service configurations
- **Scalability Analysis**: Highlights potential bottlenecks in high-load scenarios

**Implementation Details:**
- Review results are posted as PR comments with severity levels
- Critical security issues automatically block PR merging
- Remediation suggestions include code examples and documentation links
- Security metrics are tracked across PRs to identify recurring patterns

#### 3.2 Bedrock Invocation Script

The `invoke-bedrock-agent-simple.sh` script:
- Takes a diff file as input
- Sanitizes the content for processing
- Creates a properly formatted JSON payload
- Invokes Bedrock Claude via AWS CLI
- Extracts and returns the generated documentation

#### 3.3 PR-Narrator Lambda

The Lambda function (`lambda/pr-narrator/index.js`):
- Handles the PR details from GitHub Actions
- Generates a summary using structured formatting
- Applies SSML enhancements for better speech quality
- Calls Bedrock Nova Sonic for text-to-speech
- Manages S3 storage and URL generation
- Includes fallback mechanisms for reliability

### 4. Authentication and Permissions

The system implements a comprehensive security architecture with defense-in-depth principles:

#### 4.1 Authentication Mechanisms

1. **GitHub to AWS Integration**:
   - **OIDC (OpenID Connect)** federation for secure, token-based authentication
   - Short-lived credentials with automatic rotation
   - No long-term access keys stored in GitHub secrets
   - JWT token validation with audience and subject constraints

2. **AWS Service Authentication**:
   - **IAM Role-based Access Control** with fine-grained permissions
   - **Temporary Security Credentials** with limited session duration
   - **Resource-based policies** on S3 buckets and Lambda functions
   - **VPC endpoint policies** for private network communication

3. **GitHub API Security**:
   - **GitHub App installation tokens** with repository-specific scopes
   - **Rate limiting** to prevent abuse and denial of service
   - **IP allowlisting** for production deployments
   - **Webhook payload validation** with secret tokens

#### 4.2 Permission Management

1. **Least Privilege Principle**:
   - Each component has minimal permissions required for its function
   - IAM permissions boundaries prevent privilege escalation
   - Regular permission auditing and right-sizing

2. **Service-specific Permissions**:
   - **Bedrock**: Limited to specific model invocations with quota enforcement
   - **Lambda**: Function-specific execution role with scoped permissions
   - **S3**: Bucket policies with object-level permissions and encryption requirements
   - **CloudWatch**: Write-only access for logging with retention policies

3. **Security Controls**:
   - **AWS CloudTrail** logging for all API actions
   - **AWS Config** rules for continuous compliance monitoring
   - **IAM Access Analyzer** for external access identification
   - **Service Control Policies (SCPs)** for organization-wide guardrails

### 5. Error Handling and Reliability

The pipeline implements enterprise-grade resilience and security measures:

#### 5.1 Fault Tolerance

1. **Multi-level Fallback Mechanisms**:
   - Lambda implements graceful degradation with service fallbacks:
     - Primary: Bedrock Nova Sonic for high-quality TTS
     - Secondary: Amazon Polly with neural voices
     - Tertiary: Standard Polly voices with SSML
   - Documentation generation uses exponential backoff retry logic
   - Circuit breaker patterns prevent cascading failures

2. **Comprehensive Error Handling**:
   - Structured error responses with detailed error codes
   - Contextual error messages with troubleshooting guidance
   - Error categorization (transient vs. permanent)
   - Dead-letter queues for failed operations

#### 5.2 Data Security

1. **Data Protection**:
   - All data encrypted in transit (TLS 1.3)
   - S3 objects encrypted at rest (SSE-KMS)
   - Sensitive data redaction in logs and error messages
   - Automatic PII detection and handling

2. **Secure Data Processing**:
   - Input validation and sanitization
   - Output encoding to prevent injection attacks
   - Temporary file security with proper permissions
   - Secure deletion of sensitive temporary data

#### 5.3 Observability

1. **Comprehensive Logging**:
   - Structured logging with correlation IDs
   - Log level management for different environments
   - Sensitive data masking in logs
   - Log retention and archival policies

2. **Monitoring and Alerting**:
   - Real-time metrics for system health
   - Custom CloudWatch dashboards
   - Anomaly detection for unusual patterns
   - Automated alerting for critical failures

3. **Audit Trail**:
   - Complete audit logs for all security-relevant events
   - Immutable audit records
   - Compliance reporting capabilities
   - Properly handles special characters and formatting

3. **Logging and Monitoring**:
   - Comprehensive logging in Lambda function
   - GitHub Actions workflow logs for troubleshooting

### 6. Cost Optimization

The system is designed to be cost-effective:

1. **Serverless Architecture**:
   - Lambda only runs when needed
   - No ongoing infrastructure costs

2. **Efficient Resource Usage**:
   - Controls token usage in Bedrock calls
   - Optimizes audio generation parameters

3. **S3 Lifecycle Management**:
   - Can be configured to expire old audio files
   - Minimizes storage costs

This detailed explanation should help newcomers understand exactly how the GenAI PR Enhancement Pipeline works, from the initial PR creation to the final audio summary generation.

## 📄 License
This project is [MIT licensed](LICENSE).

---

Enjoy your advanced, end‑to‑end generative AI demo on AWS!
