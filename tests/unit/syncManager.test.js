jest.mock('simple-git');
jest.mock('fs');
jest.mock('../../src/core/mirroring/repoManager');
jest.mock('../../src/core/mirroring/branchSynchronizer');
jest.mock('../../src/core/module/env-loader', () => ({
    getEnv: jest.fn()
}));

// Mock les modules externes avant de les importer
jest.mock('@octokit/rest', () => ({
    Octokit: jest.fn()
}));
jest.mock('gitlab', () => ({
    Gitlab: jest.fn()
}));
jest.mock('bitbucket', () => ({
    Bitbucket: jest.fn()
}));
jest.mock('azure-devops-node-api', () => ({
    WebApi: jest.fn()
}));

const { SyncManager } = require('../../src/core/mirroring/syncManager');
const { RepoManager } = require('../../src/core/mirroring/repoManager');
const { BranchSynchronizer } = require('../../src/core/mirroring/branchSynchronizer');
const { Octokit } = require('@octokit/rest');
const { Gitlab } = require('gitlab');
const { Bitbucket } = require('bitbucket');
const { WebApi } = require('azure-devops-node-api');
const simpleGit = require('simple-git');
const fs = require('fs');
const { getEnv } = require('../../src/core/module/env-loader');

describe('Core Mirroring - SyncManager', () => {
    let syncManager;
    let mockConfig;
    let mockGit;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock environment variables - must return valid values
        getEnv.mockImplementation((key) => {
            const envVars = {
                'GITHUB_TOKEN': 'github-token-123',
                'GITLAB_TOKEN': 'gitlab-token-456',
                'BITBUCKET_USERNAME': 'bb-user',
                'BITBUCKET_PASSWORD': 'bb-pass',
                'AZURE_DEVOPS_URL': 'https://dev.azure.com/org',
                'AZURE_DEVOPS_TOKEN': 'azure-token-789'
            };
            return envVars[key] || '';
        });

        // Mock git operations
        mockGit = {
            clone: jest.fn().mockResolvedValue(undefined),
            removeRemote: jest.fn().mockResolvedValue(undefined),
            addRemote: jest.fn().mockResolvedValue(undefined),
            push: jest.fn().mockResolvedValue(undefined),
            branch: jest.fn().mockResolvedValue({ all: ['main', 'develop', 'feature/test'] }),
            pushTags: jest.fn().mockResolvedValue(undefined)
        };
        simpleGit.mockReturnValue(mockGit);

        // Mock fs operations
        fs.mkdirSync = jest.fn();
        fs.rmSync = jest.fn();

        mockConfig = {
            github: { enabled: true },
            gitlab: { enabled: true },
            bitbucket: { enabled: true },
            azure: { enabled: true }
        };

        // Mock constructors
        Octokit.mockImplementation(() => ({ auth: 'github-token-123' }));
        Gitlab.mockImplementation(() => ({ token: 'gitlab-token-456' }));
        Bitbucket.mockImplementation(() => ({ auth: { username: 'bb-user', password: 'bb-pass' } }));
        WebApi.mockImplementation(() => ({ url: 'https://dev.azure.com/org' }));

        // Mock RepoManager and BranchSynchronizer
        RepoManager.mockImplementation(() => ({
            createOrUpdateRepo: jest.fn().mockResolvedValue(undefined)
        }));
        BranchSynchronizer.mockImplementation(() => ({
            syncBranches: jest.fn().mockResolvedValue(undefined)
        }));

        syncManager = new SyncManager(mockConfig);
    });

    afterEach(() => {
        console.log.mockRestore();
        console.warn.mockRestore();
        console.error.mockRestore();
    });

    describe('constructor', () => {
        test('doit stocker la configuration', () => {
            expect(syncManager.config).toBe(mockConfig);
        });

        test('doit initialiser les clients', () => {
            expect(syncManager.clients).toBeDefined();
        });

        test('doit créer RepoManager', () => {
            expect(RepoManager).toHaveBeenCalledWith(syncManager.clients);
            expect(syncManager.repoManager).toBeDefined();
        });

        test('doit créer BranchSynchronizer', () => {
            expect(BranchSynchronizer).toHaveBeenCalledWith(syncManager.clients);
            expect(syncManager.branchSynchronizer).toBeDefined();
        });
    });

    describe('initClients', () => {
        test('doit initialiser client GitHub si activé', () => {
            expect(Octokit).toHaveBeenCalledWith({ auth: 'github-token-123' });
            expect(syncManager.clients.github).toBeDefined();
        });

        test('doit initialiser client GitLab si activé', () => {
            expect(Gitlab).toHaveBeenCalledWith({ token: 'gitlab-token-456' });
            expect(syncManager.clients.gitlab).toBeDefined();
        });

        test('doit initialiser client Bitbucket si activé', () => {
            expect(Bitbucket).toHaveBeenCalledWith({
                auth: { username: 'bb-user', password: 'bb-pass' }
            });
            expect(syncManager.clients.bitbucket).toBeDefined();
        });

        test('doit initialiser client Azure DevOps si activé', () => {
            expect(WebApi).toHaveBeenCalledWith('https://dev.azure.com/org', 'azure-token-789');
            expect(syncManager.clients.azure).toBeDefined();
        });

        test('ne doit pas initialiser GitHub si désactivé', () => {
            Octokit.mockClear();
            const config = { github: { enabled: false } };
            const manager = new SyncManager(config);

            expect(Octokit).not.toHaveBeenCalled();
            expect(manager.clients.github).toBeUndefined();
        });

        test('ne doit pas initialiser GitLab si désactivé', () => {
            Gitlab.mockClear();
            const config = { gitlab: { enabled: false } };
            const manager = new SyncManager(config);

            expect(Gitlab).not.toHaveBeenCalled();
            expect(manager.clients.gitlab).toBeUndefined();
        });

        test('ne doit pas initialiser Bitbucket si désactivé', () => {
            Bitbucket.mockClear();
            const config = { bitbucket: { enabled: false } };
            const manager = new SyncManager(config);

            expect(Bitbucket).not.toHaveBeenCalled();
            expect(manager.clients.bitbucket).toBeUndefined();
        });

        test('ne doit pas initialiser Azure si désactivé', () => {
            WebApi.mockClear();
            const config = { azure: { enabled: false } };
            const manager = new SyncManager(config);

            expect(WebApi).not.toHaveBeenCalled();
            expect(manager.clients.azure).toBeUndefined();
        });

        test('doit afficher warning si init GitHub échoue', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'GITHUB_TOKEN') throw new Error('Token not found');
                return 'token';
            });
            Octokit.mockClear();
            console.warn.mockClear();

            new SyncManager(mockConfig);

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Impossible d'initialiser le client GitHub")
            );
        });

        test('doit afficher warning si init GitLab échoue', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'GITLAB_TOKEN') throw new Error('Token not found');
                return 'token';
            });
            Gitlab.mockClear();
            console.warn.mockClear();

            new SyncManager(mockConfig);

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Impossible d'initialiser le client GitLab")
            );
        });

        test('doit afficher warning si init Bitbucket échoue', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'BITBUCKET_USERNAME') throw new Error('Username not found');
                return 'token';
            });
            Bitbucket.mockClear();
            console.warn.mockClear();

            new SyncManager(mockConfig);

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Impossible d'initialiser le client BitBucket")
            );
        });

        test('doit afficher warning si init Azure échoue', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'AZURE_DEVOPS_URL') throw new Error('URL not found');
                return 'token';
            });
            WebApi.mockClear();
            console.warn.mockClear();

            new SyncManager(mockConfig);

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Impossible d'initialiser le client Azure DevOps")
            );
        });
    });

    describe('mirror', () => {
        test('doit appeler createOrUpdateRepo avec bons paramètres', async () => {
            await syncManager.mirror(
                'github',
                'gitlab',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner',
                false,
                false
            );

            expect(syncManager.repoManager.createOrUpdateRepo).toHaveBeenCalledWith(
                'github',
                'gitlab',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner',
                false
            );
        });

        test('doit appeler pushCodeToTarget', async () => {
            jest.spyOn(syncManager, 'pushCodeToTarget').mockResolvedValue(undefined);

            await syncManager.mirror(
                'github',
                'github',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner'
            );

            expect(syncManager.pushCodeToTarget).toHaveBeenCalledWith(
                'github',
                'github',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner'
            );
        });

        test('doit appeler syncBranches si syncBranches=true', async () => {
            await syncManager.mirror(
                'github',
                'gitlab',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner',
                true,
                false
            );

            expect(syncManager.branchSynchronizer.syncBranches).toHaveBeenCalledWith(
                'github',
                'gitlab',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner'
            );
        });

        test('ne doit pas appeler syncBranches si syncBranches=false', async () => {
            await syncManager.mirror(
                'github',
                'gitlab',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner',
                false,
                false
            );

            expect(syncManager.branchSynchronizer.syncBranches).not.toHaveBeenCalled();
        });

        test('doit gérer les erreurs et les propager', async () => {
            syncManager.repoManager.createOrUpdateRepo.mockRejectedValue(new Error('Mirror failed'));

            await expect(
                syncManager.mirror('github', 'gitlab', 'repo', 'repo', 'owner', 'owner')
            ).rejects.toThrow('Mirror failed');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Échec de la mise en miroir: Mirror failed')
            );
        });
    });

    describe('pushCodeToTarget', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(123456789);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        test('doit afficher warning si non GitHub vers GitHub', async () => {
            await syncManager.pushCodeToTarget('gitlab', 'github', 'repo', 'repo', 'owner', 'owner');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Le push du code n'est actuellement supporté que pour GitHub vers GitHub")
            );
            expect(simpleGit).not.toHaveBeenCalled();
        });

        test('doit afficher warning si tokens manquants', async () => {
            getEnv.mockReturnValue(''); // Return empty string for missing tokens

            await syncManager.pushCodeToTarget('github', 'github', 'repo', 'repo', 'owner', 'owner');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Tokens manquants pour pousser le code')
            );
        });

        test('doit créer dossier temporaire', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('temp-mirror-123456789'),
                { recursive: true }
            );
        });

        test('doit cloner le dépôt source', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(mockGit.clone).toHaveBeenCalledWith(
                'https://github-token-123@github.com/src-owner/source.git',
                '.'
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Clonage du dépôt source'));
        });

        test('doit configurer remote cible', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(mockGit.removeRemote).toHaveBeenCalledWith('origin');
            expect(mockGit.addRemote).toHaveBeenCalledWith(
                'origin',
                'https://github-token-123@github.com/tgt-owner/target.git'
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Configuration du remote cible'));
        });

        test('doit pousser branche main', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(mockGit.push).toHaveBeenCalledWith('origin', 'main', ['--force']);
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Push du code vers le dépôt cible'));
        });

        test('doit pousser toutes les branches sauf main et master', async () => {
            mockGit.branch.mockResolvedValue({
                all: ['main', 'master', 'develop', 'feature/test']
            });

            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(mockGit.push).toHaveBeenCalledWith('origin', 'develop', ['--force']);
            expect(mockGit.push).toHaveBeenCalledWith('origin', 'feature/test', ['--force']);
            expect(mockGit.push).toHaveBeenCalledTimes(3); // main + develop + feature/test
        });

        test('doit pousser les tags', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(mockGit.pushTags).toHaveBeenCalledWith('origin');
        });

        test('doit afficher warning si push branche échoue', async () => {
            mockGit.push.mockImplementation((remote, branch) => {
                if (branch === 'develop') {
                    return Promise.reject(new Error('Branch push failed'));
                }
                return Promise.resolve();
            });

            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Impossible de pousser la branche develop: Branch push failed')
            );
        });

        test('doit afficher warning si push tags échoue', async () => {
            mockGit.pushTags.mockRejectedValue(new Error('Tags push failed'));

            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Impossible de pousser les tags: Tags push failed')
            );
        });

        test('doit nettoyer dossier temporaire après succès', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(fs.rmSync).toHaveBeenCalledWith(
                expect.stringContaining('temp-mirror-123456789'),
                { recursive: true, force: true }
            );
        });

        test('doit nettoyer dossier temporaire après erreur', async () => {
            mockGit.clone.mockRejectedValue(new Error('Clone failed'));

            await expect(
                syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner')
            ).rejects.toThrow('Clone failed');

            expect(fs.rmSync).toHaveBeenCalledWith(
                expect.stringContaining('temp-mirror-123456789'),
                { recursive: true, force: true }
            );
        });

        test('doit afficher warning si cleanup échoue', async () => {
            fs.rmSync.mockImplementation(() => {
                throw new Error('Cleanup failed');
            });

            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Impossible de nettoyer le dossier temporaire: Cleanup failed')
            );
        });

        test('doit afficher message de succès', async () => {
            await syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Code poussé avec succès vers le dépôt cible')
            );
        });

        test('doit propager erreurs de push', async () => {
            mockGit.push.mockRejectedValue(new Error('Push failed'));

            await expect(
                syncManager.pushCodeToTarget('github', 'github', 'source', 'target', 'src-owner', 'tgt-owner')
            ).rejects.toThrow('Push failed');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Échec du push du code: Push failed')
            );
        });
    });
});
