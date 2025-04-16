This git diff contains the following changes:

1. **GitHub Actions Workflow Updates**:
   - The `.github/workflows/pr-checks.yml` file has been updated with several changes:
     - Added environment variables `MODEL_ID` and `MAX_TOKENS` at the workflow level.
     - Removed the usage of role assumption and AWS region from environment variables, using secrets directly instead.
     - Updated the "Generate documentation via Bedrock" step to use a new Python script `bedrock-pr-docs.py` instead of the `invoke-bedrock-agent.sh` script.
     - Added AWS permissions for the Lambda function in the CloudFormation template.
     - Updated the "Invoke PR-Narrator Lambda" step to use the CloudFormation stack output for the Lambda function name and handle cases where the stack output is not found.
     - Updated the extraction of audio URL and summary from the Lambda response to use the newer GitHub Actions output syntax.

2. **Lambda Function Updates**:
   - The `lambda/pr-narrator/index.js` file has been updated with changes to migrate to AWS SDK v3, including updates to import statements, client initialization, and API call syntax for Bedrock, S3, and Polly services.
   - Added a helper function `streamToBuffer` to convert a readable stream to a buffer.
   - Updated the package version to 2.0.0.

3. **Infrastructure Updates**:
   - The `infra/template.yaml` file has been updated to add a new IAM policy for the Lambda function to allow invoking and getting other Lambda functions.

4. **Script Updates**:
   - A new Python script `scripts/bedrock-pr-docs.py` has been added to generate PR documentation using the Bedrock Claude model.
   - The `scripts/invoke-bedrock-agent.sh` script has been updated with better handling for binary data in the diff file, proper JSON escaping for the diff content, updated prompt formatting and model payload creation, improved error handling and fallback mechanisms for direct model invocation, and better logging and metrics collection.
   - A new script `scripts/invoke-bedrock-agent-simple.sh` has been added, which is a simplified version of the `invoke-bedrock-agent.sh` script that uses jq for JSON processing.

These changes aim to improve the PR documentation generation process by updating the infrastructure, Lambda function, and related scripts. The updates include migrating to AWS SDK v3, using a new Python script for Bedrock model invocation, updating GitHub Actions workflows, and improving error handling and logging.

Potential issues or improvements:

- The Python script `bedrock-pr-docs.py` relies on the Bedrock Claude model. It might be worth considering adding support for other models or making the model selection more flexible.
- The `invoke-bedrock-agent.sh` script has become quite complex with various fallback mechanisms and error handling. It might be worth considering splitting it into smaller, more modular scripts or exploring alternative approaches for invoking the Bedrock agent and models.
- The updates to the Lambda function and infrastructure components might require thorough testing to ensure compatibility and correct functionality.
- Logging and monitoring capabilities could be further enhanced, especially for the Lambda function and model invocations.