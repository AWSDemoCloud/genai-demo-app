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

## 🎭 Demo Scenarios

Here are three comprehensive demo scenarios to showcase during your AWS session:

### Demo 1: Code Quality Enhancement with Amazon Q Developer

This scenario demonstrates how Amazon Q Developer automatically identifies code issues and security vulnerabilities in your PR.

**Steps:**
1. Create a new feature branch: `git checkout -b demo/security-vulnerability`
2. Introduce a deliberate security vulnerability:
   ```bash
   echo 'const userQuery = `SELECT * FROM users WHERE id = ${req.params.id}`;' >> app/database.js
   echo 'const secrets = {"api_key": "sk_test_51M7qPQLgMc5TcEi8RWvVoHlxU"}' >> app/config.js
   ```
3. Commit and create a pull request:
   ```bash
   git add .
   git commit -m "Add user query functionality with direct parameters"
   git push origin HEAD
   gh pr create -t "Add user query feature" -b "This PR implements a user query feature."
   ```

**What to Observe:**
- Amazon Q Developer will identify the SQL injection vulnerability in the code
- It will also flag the hardcoded API key as a security risk
- The PR check will automatically fail with detailed security findings
- A comprehensive code review will appear in GitHub with suggested fixes

### Demo 2: Automated PR Documentation with Bedrock

This scenario showcases how Claude 3 Sonnet on Bedrock automatically generates comprehensive PR documentation.

**Steps:**
1. Create a new feature branch: `git checkout -b demo/feature-implementation`
2. Add a substantial feature with clear purpose:
   ```bash
   # Create a new feature file
   mkdir -p app/features
   cat > app/features/dataProcessor.js << 'EOF'
   /**
    * Data Processor Module
    * Handles transformation and validation of incoming data
    */
   
   // Configuration for data processing
   const CONFIG = {
     maxBatchSize: 1000,
     processingModes: ['sync', 'async', 'batch'],
     validationRules: {
       required: ['id', 'timestamp', 'source'],
       numeric: ['amount', 'quantity'],
       dateFormat: ['createdAt', 'updatedAt']
     }
   };
   
   /**
    * Validates incoming data against schema
    * @param {Object} data - The data object to validate
    * @returns {Object} Validation result with errors if any
    */
   function validateData(data) {
     const errors = [];
     const { required, numeric, dateFormat } = CONFIG.validationRules;
     
     // Check required fields
     for (const field of required) {
       if (!data[field]) {
         errors.push(`Missing required field: ${field}`);
       }
     }
     
     // Check numeric fields
     for (const field of numeric) {
       if (data[field] && isNaN(Number(data[field]))) {
         errors.push(`Field ${field} must be numeric`);
       }
     }
     
     // Check date format fields
     for (const field of dateFormat) {
       if (data[field] && isNaN(Date.parse(data[field]))) {
         errors.push(`Field ${field} must be a valid date`);
       }
     }
     
     return {
       valid: errors.length === 0,
       errors
     };
   }
   
   /**
    * Transforms data according to specified processing mode
    * @param {Object} data - The data to transform
    * @param {String} mode - Processing mode (sync|async|batch)
    * @returns {Object} Transformed data
    */
   function transformData(data, mode = 'sync') {
     if (!CONFIG.processingModes.includes(mode)) {
       throw new Error(`Invalid processing mode: ${mode}`);
     }
     
     const result = { ...data };
     
     // Add metadata based on processing mode
     result.metadata = {
       processedAt: new Date().toISOString(),
       mode,
       version: '1.0.0'
     };
     
     // Apply transformations based on mode
     if (mode === 'batch') {
       result.batchId = `batch_${Date.now()}`;
     } else if (mode === 'async') {
       result.callbackUrl = data.callbackUrl || 'https://api.example.com/callbacks';
     }
     
     return result;
   }
   
   /**
    * Process data in batches
    * @param {Array} dataArray - Array of data objects to process
    * @returns {Object} Processing results with stats
    */
   function processBatch(dataArray) {
     if (!Array.isArray(dataArray)) {
       throw new Error('Input must be an array');
     }
     
     if (dataArray.length > CONFIG.maxBatchSize) {
       throw new Error(`Batch size exceeds maximum (${CONFIG.maxBatchSize})`);
     }
     
     const results = {
       processed: 0,
       failed: 0,
       items: []
     };
     
     for (const item of dataArray) {
       const validation = validateData(item);
       
       if (validation.valid) {
         const transformed = transformData(item, 'batch');
         results.items.push({
           id: item.id,
           status: 'processed',
           result: transformed
         });
         results.processed++;
       } else {
         results.items.push({
           id: item.id || 'unknown',
           status: 'failed',
           errors: validation.errors
         });
         results.failed++;
       }
     }
     
     return results;
   }
   
   module.exports = {
     validateData,
     transformData,
     processBatch,
     CONFIG
   };
   EOF
   ```
3. Commit and create a pull request:
   ```bash
   git add .
   git commit -m "Add data processor module with validation and transformation"
   git push origin HEAD
   gh pr create -t "Data processor implementation" -b "This PR implements a comprehensive data processing module with validation and transformation capabilities."
   ```

**What to Observe:**
- The `bedrock-docs` job in the GitHub Action will process your PR
- Claude will analyze the code changes and automatically generate the `doc.md` file
- The generated documentation will include:
  - Overview of the new feature
  - Architecture and design decisions
  - Key functionality and code organization
  - Usage examples
- The docs will be committed back to your PR branch automatically

### Demo 3: PR Narrator Lambda with Audio Summary

This demo showcases how the AWS Lambda function generates an audio summary of your PR using Bedrock's text-to-speech capabilities.

**Steps:**
1. Ensure your previous PR was created successfully
2. The PR-Narrator Lambda will be triggered automatically
3. Check the PR comments section for the audio summary link

**What to Observe:**
- The Lambda function receives PR details and generates a text summary
- It then converts this summary to audio using Bedrock's Nova Sonic model
- The audio file is stored in the S3 bucket created during deployment
- A comment is posted to your PR with a link to the audio summary
- When clicked, users can listen to a concise, professionally narrated overview of your PR

## 🔄 Typical End-to-End Demo Flow

For a comprehensive demo during your AWS session, follow this sequence:

1. **Setup & Overview** (5 minutes)
   - Walk through the architecture diagram and explain the components
   - Show the GitHub Action workflow configuration
   - Highlight the integration points between GitHub, AWS Lambda, and Bedrock

2. **Live Demo** (15 minutes)
   - Execute Demo 1: Security vulnerability detection with Amazon Q Developer
   - Execute Demo 2: Automated documentation with Bedrock Claude
   - Execute Demo 3: Audio narration with PR-Narrator Lambda

3. **Behind the Scenes** (10 minutes)
   - Show the Lambda function code and explain how it works
   - Examine the Bedrock invocation scripts
   - Discuss the architecture decisions and potential extensions

4. **Q&A and Discussion** (5-10 minutes)

This structured approach ensures a compelling demonstration that showcases the power of AWS generative AI services in a real-world development workflow.

## 📄 License
This project is [MIT licensed](LICENSE).

---

Enjoy your advanced, end‑to‑end generative AI demo on AWS!
