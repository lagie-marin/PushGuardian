const { Octokit } = require('@octokit/rest');
const { WebApi } = require('azure-devops-node-api');
const { Bitbucket } = require('bitbucket');
const { Gitlab } = require('gitlab');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { RepoManager } = require('./repoManager');
const { BranchSynchronizer } = require('./branchSynchronizer');
const { getEnv } = require('../module/env-loader');

class SyncManager {
    constructor(config) {
        this.config = config;
        this.clients = this.initClients();
        this.repoManager = new RepoManager(this.clients);
        this.branchSynchronizer = new BranchSynchronizer(this.clients);
    }

    initClients() {
        const clients = {};

        if (this.config.github && this.config.github.enabled) {
            try {
                const token = getEnv('GIT_TOKEN');
                clients.github = new Octokit({ auth: token });
            } catch (error) {
                console.warn(`⚠️  Impossible d'initialiser le client GitHub: ${error.message}`);
            }
        }

        if (this.config.gitlab && this.config.gitlab.enabled) {
            try {
                const token = getEnv('GITLAB_TOKEN');
                clients.gitlab = new Gitlab({ token: token });
            } catch (error) {
                console.warn(`⚠️  Impossible d'initialiser le client GitLab: ${error.message}`);
            }
        }

        if (this.config.bitbucket && this.config.bitbucket.enabled) {
            try {
                const username = getEnv('BITBUCKET_USERNAME');
                const password = getEnv('BITBUCKET_PASSWORD');
                clients.bitbucket = new Bitbucket({
                    auth: { username: username, password: password }
                });
            } catch (error) {
                console.warn(`⚠️  Impossible d'initialiser le client BitBucket: ${error.message}`);
            }
        }

        if (this.config.azure && this.config.azure.enabled) {
            try {
                const url = getEnv('AZURE_DEVOPS_URL');
                const token = getEnv('AZURE_DEVOPS_TOKEN');
                clients.azure = new WebApi(url, token);
            } catch (error) {
                console.warn(`⚠️  Impossible d'initialiser le client Azure DevOps: ${error.message}`);
            }
        }

        return clients;
    }

    async mirror(
        sourcePlatform,
        targetPlatform,
        sourceRepo,
        targetRepo,
        sourceOwner,
        targetOwner,
        syncBranches = false,
        public_repo = false
    ) {
        try {
            await this.repoManager.createOrUpdateRepo(
                sourcePlatform,
                targetPlatform,
                sourceRepo,
                targetRepo,
                sourceOwner,
                targetOwner,
                public_repo
            );

            await this.pushCodeToTarget(
                sourcePlatform,
                targetPlatform,
                sourceRepo,
                targetRepo,
                sourceOwner,
                targetOwner
            );

            if (syncBranches) {
                await this.branchSynchronizer.syncBranches(
                    sourcePlatform,
                    targetPlatform,
                    sourceRepo,
                    targetRepo,
                    sourceOwner,
                    targetOwner
                );
            }
        } catch (error) {
            console.error(`❌ Échec de la mise en miroir: ${error.message}`);
            throw error;
        }
    }

    async pushCodeToTarget(sourcePlatform, targetPlatform, sourceRepo, targetRepo, sourceOwner, targetOwner) {
        if (sourcePlatform !== 'github' || targetPlatform !== 'github') {
            console.log("⚠️ Le push du code n'est actuellement supporté que pour GitHub vers GitHub");
            return;
        }

        const sourceToken = getEnv('GIT_TOKEN');
        const targetToken = sourceToken;

        if (!sourceToken || !targetToken) {
            console.log('⚠️ Tokens manquants pour pousser le code');
            return;
        }

        const tempDir = path.join(process.cwd(), 'temp-mirror-' + Date.now());

        try {
            fs.mkdirSync(tempDir, { recursive: true });

            const git = simpleGit(tempDir);

            const sourceUrl = `https://${sourceToken}@github.com/${sourceOwner}/${sourceRepo}.git`;
            console.log('📥 Clonage du dépôt source...');
            await git.clone(sourceUrl, '.');

            const targetUrl = `https://${targetToken}@github.com/${targetOwner}/${targetRepo}.git`;
            console.log('📤 Configuration du remote cible...');
            await git.removeRemote('origin');
            await git.addRemote('origin', targetUrl);

            console.log('🚀 Push du code vers le dépôt cible...');
            await git.push('origin', 'main', ['--force']);

            const branches = await git.branch();
            for (const branch of branches.all) {
                if (branch !== 'main' && branch !== 'master') {
                    try {
                        await git.push('origin', branch, ['--force']);
                    } catch (error) {
                        console.warn(`⚠️ Impossible de pousser la branche ${branch}: ${error.message}`);
                    }
                }
            }

            try {
                await git.pushTags('origin');
            } catch (error) {
                console.warn(`⚠️ Impossible de pousser les tags: ${error.message}`);
            }

            console.log('✅ Code poussé avec succès vers le dépôt cible');
        } catch (error) {
            console.error(`❌ Échec du push du code: ${error.message}`);
            throw error;
        } finally {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.warn(`⚠️ Impossible de nettoyer le dossier temporaire: ${cleanupError.message}`);
            }
        }
    }
}

module.exports = { SyncManager };
