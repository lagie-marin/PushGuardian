jest.mock('../../src/core/configManager');
jest.mock('../../src/core/mirroring/syncManager');
jest.mock('../../src/core/mirroring/generate');
jest.mock('../../src/core/errorCMD');
jest.mock('../../src/core/module/env-loader');
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
jest.mock('../../src/utils/chalk-wrapper', () => ({
    getChalk: () => ({
        red: (msg) => msg,
        green: (msg) => msg,
        blue: (msg) => msg,
        cyan: (msg) => msg
    })
}));

const mirrorCommand = require('../../src/cli/command/mirror');
const { loadConfig } = require('../../src/core/configManager');
const { SyncManager } = require('../../src/core/mirroring/syncManager');
const { generateWorkflow } = require('../../src/core/mirroring/generate');
const { getEnv, loadEnv } = require('../../src/core/module/env-loader');
const errorCMD = require('../../src/core/errorCMD');

describe('CLI Command - mirror', () => {
    let mockSyncManager;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {});

        loadEnv.mockImplementation(() => {});
        loadConfig.mockReturnValue({
            mirroring: {
                platforms: {
                    github: { enabled: true },
                    gitlab: { enabled: true }
                }
            }
        });

        mockSyncManager = {
            mirror: jest.fn().mockResolvedValue()
        };
        SyncManager.mockImplementation(() => mockSyncManager);

        getEnv.mockReturnValue('');
        generateWorkflow.mockImplementation(() => {});
        errorCMD.mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('doit avoir les bonnes métadonnées', () => {
        expect(mirrorCommand.name).toBe('mirror');
        expect(mirrorCommand.description).toContain('Référentiels miroirs');
        expect(mirrorCommand.options).toHaveLength(10);
    });

    test('doit générer workflow avec --generate', async () => {
        await mirrorCommand.action({ generate: true });

        expect(generateWorkflow).toHaveBeenCalled();
        expect(SyncManager).not.toHaveBeenCalled();
    });

    test('doit quitter si config mirroring manquante', async () => {
        loadConfig.mockReturnValue({});

        await mirrorCommand.action({ source: 'github' });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Configuration de mise en miroir manquante')
        );
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('doit quitter si paramètres manquants', async () => {
        await mirrorCommand.action({ source: 'github' });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Plateformes, repos et propriétaires source/cible requis')
        );
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('doit exécuter mirror avec options complètes', async () => {
        await mirrorCommand.action({
            source: 'github',
            target: 'gitlab',
            sourceRepo: 'my-repo',
            targetRepo: 'my-mirror',
            sourceOwner: 'user1',
            targetOwner: 'user2',
            syncBranches: true,
            publicRepo: true
        });

        expect(SyncManager).toHaveBeenCalledWith({
            github: { enabled: true },
            gitlab: { enabled: true }
        });
        expect(mockSyncManager.mirror).toHaveBeenCalledWith(
            'github',
            'gitlab',
            'my-repo',
            'my-mirror',
            'user1',
            'user2',
            true,
            true
        );
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Mise en miroir terminée avec succès')
        );
    });

    test('doit charger valeurs depuis env si non spécifiées', async () => {
        getEnv.mockImplementation((key) => {
            const envVars = {
                'SOURCE_PLATFORM': 'github',
                'TARGET_PLATFORM': 'gitlab',
                'SOURCE_REPO': 'env-repo',
                'TARGET_REPO': 'env-mirror',
                'SOURCE_OWNER': 'env-user1',
                'TARGET_OWNER': 'env-user2'
            };
            return envVars[key] || '';
        });

        await mirrorCommand.action({});

        expect(mockSyncManager.mirror).toHaveBeenCalledWith(
            'github',
            'gitlab',
            'env-repo',
            'env-mirror',
            'env-user1',
            'env-user2',
            undefined,
            undefined
        );
    });

    test('doit appeler errorCMD en cas d\'erreur', async () => {
        const testError = new Error('Mirror failed');
        mockSyncManager.mirror.mockRejectedValue(testError);

        await mirrorCommand.action({
            source: 'github',
            target: 'gitlab',
            sourceRepo: 'repo',
            targetRepo: 'mirror',
            sourceOwner: 'user1',
            targetOwner: 'user2'
        });

        expect(errorCMD).toHaveBeenCalledWith(testError);
    });

    test('doit appeler loadEnv au démarrage', async () => {
        await mirrorCommand.action({ generate: true });

        expect(loadEnv).toHaveBeenCalled();
    });
});
