const fs = require('fs');
const path = require('path');
const { default: chalk } = require('chalk');

function generateWorkflow() {
    try {
        const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
        if (!fs.existsSync(workflowsDir)) {
            fs.mkdirSync(workflowsDir, { recursive: true });
            console.log(chalk.green('✅ Dossier .github/workflows créé'));
        }
        const workflowContent = `name: Mirror Repository

on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'  # Every day at 2 AM UTC
  push:
    branches: [ main, master ]

jobs:
  mirror:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout PushGuardian
      uses: actions/checkout@v4
      with:
        repository: lagie-marin/PushGuardian
        path: pushguardian

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: pushguardian/package-lock.json

    - name: Install dependencies
      run: |
        cd pushguardian
        npm ci

    - name: Link PushGuardian globally
      run: |
        cd pushguardian
        npm link

    - name: Execute mirror command
      run: |
        mirror_cmd="npx pushguardian mirror"
        mirror_cmd="$mirror_cmd --source \${{ vars.SOURCE_PLATFORM }}"
        mirror_cmd="$mirror_cmd --target \${{ vars.TARGET_PLATFORM }}"
        mirror_cmd="$mirror_cmd --repo \${{ vars.REPO_NAME }}"
        mirror_cmd="$mirror_cmd --source-owner \${{ vars.SOURCE_OWNER }}"
        mirror_cmd="$mirror_cmd --target-owner \${{ vars.TARGET_OWNER }}"

        if [ "\${{ vars.SYNC_BRANCHES }}" = "true" ]; then
          mirror_cmd="$mirror_cmd --sync-branches"
        fi

        if [ "\${{ vars.PUBLIC_REPO }}" = "true" ]; then
          mirror_cmd="$mirror_cmd --public-repo"
        fi

        echo "Executing: $mirror_cmd"
        eval $mirror_cmd
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        GITLAB_TOKEN: \${{ secrets.GITLAB_TOKEN }}
        BITBUCKET_USERNAME: \${{ secrets.BITBUCKET_USERNAME }}
        BITBUCKET_PASSWORD: \${{ secrets.BITBUCKET_PASSWORD }}
        AZURE_DEVOPS_URL: \${{ secrets.AZURE_DEVOPS_URL }}
        AZURE_DEVOPS_TOKEN: \${{ secrets.AZURE_DEVOPS_TOKEN }}
`;

        const workflowPath = path.join(workflowsDir, 'mirror.yml');
        fs.writeFileSync(workflowPath, workflowContent, 'utf8');

        console.log(chalk.green('✅ Workflow GitHub Actions généré : .github/workflows/mirror.yml'));
        console.log(chalk.blue('ℹ️  Pensez à configurer les variables et secrets dans GitHub Actions'));
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de la génération du workflow : ${error.message}`));
        throw error;
    }
}

module.exports = {
    generateWorkflow
};
