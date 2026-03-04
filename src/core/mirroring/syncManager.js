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

    getGithubToken() {
        const legacyToken = getEnv('GIT_TOKEN');
        if (legacyToken) return legacyToken;
        return process.env.GITHUB_TOKEN || '';
    }

    initClients() {
        const clients = {};

        if (this.config.github && this.config.github.enabled) {
            try {
                const token = this.getGithubToken();
                if (!token) {
                    console.warn(
                        '⚠️  GITHUB_TOKEN (ou GIT_TOKEN) manquant: utilisation de GitHub en accès anonyme (lecture publique uniquement)'
                    );
                    clients.github = new Octokit();
                } else {
                    clients.github = new Octokit({ auth: token });
                }
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
                const token = getEnv('BIT_BUCKET');
                clients.bitbucket = new Bitbucket({
                    auth: { token: token }
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
        const isGithubToGithub = sourcePlatform === 'github' && targetPlatform === 'github';
        const isGithubToGitlab = sourcePlatform === 'github' && targetPlatform === 'gitlab';

        if (!isGithubToGithub && !isGithubToGitlab) {
            console.log(
                "⚠️ Le push du code n'est actuellement supporté que pour GitHub vers GitHub ou GitHub vers GitLab"
            );
            return;
        }

        const sourceToken = this.getGithubToken();
        const targetToken = targetPlatform === 'gitlab' ? getEnv('GITLAB_TOKEN') : this.getGithubToken();

        if (!targetToken) {
            console.log('⚠️ Tokens manquants pour pousser le code');
            return;
        }

        const tempDir = path.join(process.cwd(), 'temp-mirror-' + Date.now());

        try {
            fs.mkdirSync(tempDir, { recursive: true });

            const git = simpleGit(tempDir);

            const sourceUrl = sourceToken
                ? `https://${sourceToken}@github.com/${sourceOwner}/${sourceRepo}.git`
                : `https://github.com/${sourceOwner}/${sourceRepo}.git`;
            console.log('📥 Clonage du dépôt source...');
            await git.clone(sourceUrl, '.');

            const targetUrl =
                targetPlatform === 'gitlab'
                    ? `https://oauth2:${targetToken}@gitlab.com/${targetOwner}/${targetRepo}.git`
                    : `https://${targetToken}@github.com/${targetOwner}/${targetRepo}.git`;
            console.log('📤 Configuration du remote cible...');
            await git.removeRemote('origin');
            await git.addRemote('origin', targetUrl);

            console.log('🚀 Push du code vers le dépôt cible...');

            // Pousser toutes les branches et les tags en mode mirror
            try {
                await git.push('origin', ['--all', '--force']);
            } catch (error) {
                console.warn(`⚠️ Impossible de pousser toutes les branches: ${error.message}`);
            }

            try {
                await git.pushTags('origin', ['--force']);
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
