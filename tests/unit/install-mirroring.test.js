const fs = require('fs');

jest.mock('fs');
jest.mock('readline', () => ({
    createInterface: jest.fn(() => ({
        question: jest.fn(),
        close: jest.fn()
    }))
}));
jest.mock('../../src/core/module/env-loader');
jest.mock('../../src/utils/chalk-wrapper', () => ({
    getChalk: () => ({
        red: (msg) => msg,
        green: (msg) => msg,
        blue: (msg) => msg,
        yellow: (msg) => msg,
        gray: (msg) => msg
    })
}));

const { getEnv, saveEnv } = require('../../src/core/module/env-loader');
const mirroring = require('../../src/cli/install/mirroring');

describe('CLI Install - mirroring', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(() => {});

        // Mock env-loader
        getEnv.mockReturnValue('');
        saveEnv.mockImplementation(() => {});

        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockImplementation(() => {});
    });

    afterEach(() => {
        // Nettoyer les timers et promesses pendantes
        jest.clearAllTimers();
        jest.restoreAllMocks();
    });

    describe('getCredentialsFromEnv', () => {
        test('doit charger token GitHub depuis env', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'GITHUB_TOKEN') return 'env_github_token';
                return '';
            });

            const result = mirroring.getCredentialsFromEnv('github');

            expect(getEnv).toHaveBeenCalledWith('GITHUB_TOKEN', null, true);
            expect(result).toEqual({ token: 'env_github_token' });
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Token GitHub chargé'));
        });

        test('doit charger token GitLab depuis env', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'GITLAB_TOKEN') return 'env_gitlab_token';
                return '';
            });

            const result = mirroring.getCredentialsFromEnv('gitlab');

            expect(getEnv).toHaveBeenCalledWith('GITLAB_TOKEN', null, true);
            expect(result).toEqual({ token: 'env_gitlab_token' });
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Token GitLab chargé'));
        });

        test('doit charger credentials BitBucket depuis env', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'BITBUCKET_USERNAME') return 'env_user';
                if (key === 'BITBUCKET_PASSWORD') return 'env_pass';
                return '';
            });

            const result = mirroring.getCredentialsFromEnv('bitbucket');

            expect(getEnv).toHaveBeenCalledWith('BITBUCKET_USERNAME', null, true);
            expect(getEnv).toHaveBeenCalledWith('BITBUCKET_PASSWORD', null, true);
            expect(result).toEqual({
                username: 'env_user',
                password: 'env_pass'
            });
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Credentials BitBucket chargés'));
        });

        test('doit charger credentials Azure depuis env', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'AZURE_DEVOPS_URL') return 'https://dev.azure.com/org';
                if (key === 'AZURE_DEVOPS_TOKEN') return 'azure_token';
                return '';
            });

            const result = mirroring.getCredentialsFromEnv('azure');

            expect(result).toEqual({
                url: 'https://dev.azure.com/org',
                token: 'azure_token'
            });
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Credentials Azure DevOps chargés'));
        });

        test('doit afficher message aide si variable env manquante', () => {
            getEnv.mockImplementation(() => {
                throw new Error('Variable not found');
            });

            // Capturer la Promise retournée sans l'attendre
            try {
                mirroring.getCredentialsFromEnv('github');
            } catch (e) {
                // Ignorer l'erreur
            }

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Variable d\'environnement manquante pour github')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Vous pouvez créer un fichier .env')
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Exemple de fichier .env:'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GITHUB_TOKEN=votre_token_ici'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GITLAB_TOKEN=votre_token_ici'));
        });
    });

    describe('saveCredentialsToEnv', () => {
        test('doit sauvegarder token GitHub dans .env', () => {
            getEnv.mockReturnValue(''); // Pas de token existant

            mirroring.saveCredentialsToEnv({
                github: { token: 'new_github_token' }
            });

            expect(saveEnv).toHaveBeenCalledWith('GITHUB_TOKEN', 'new_github_token', '.env');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Credentials sauvegardés'));
        });

        test('ne doit pas écraser token GitHub existant', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'GITHUB_TOKEN') return 'existing_token';
                return '';
            });

            mirroring.saveCredentialsToEnv({
                github: { token: 'new_token' }
            });

            expect(saveEnv).not.toHaveBeenCalledWith('GITHUB_TOKEN', expect.anything(), expect.anything());
        });

        test('doit sauvegarder credentials BitBucket', () => {
            getEnv.mockReturnValue('');

            mirroring.saveCredentialsToEnv({
                bitbucket: {
                    username: 'bitbucket_user',
                    password: 'bitbucket_pass'
                }
            });

            expect(saveEnv).toHaveBeenCalledWith('BITBUCKET_USERNAME', 'bitbucket_user', '.env');
            expect(saveEnv).toHaveBeenCalledWith('BITBUCKET_PASSWORD', 'bitbucket_pass', '.env');
        });

        test('doit sauvegarder credentials Azure', () => {
            getEnv.mockReturnValue('');

            mirroring.saveCredentialsToEnv({
                azure: {
                    url: 'https://dev.azure.com/org',
                    token: 'azure_token'
                }
            });

            expect(saveEnv).toHaveBeenCalledWith('AZURE_DEVOPS_URL', 'https://dev.azure.com/org', '.env');
            expect(saveEnv).toHaveBeenCalledWith('AZURE_DEVOPS_TOKEN', 'azure_token', '.env');
        });

        test('doit gérer plusieurs plateformes', () => {
            getEnv.mockReturnValue('');

            mirroring.saveCredentialsToEnv({
                github: { token: 'gh_token' },
                gitlab: { token: 'gl_token' }
            });

            expect(saveEnv).toHaveBeenCalledWith('GITHUB_TOKEN', 'gh_token', '.env');
            expect(saveEnv).toHaveBeenCalledWith('GITLAB_TOKEN', 'gl_token', '.env');
        });
    });

    describe('createMirroringConfig', () => {
        test('doit créer config avec plateformes sélectionnées', () => {
            mirroring.createMirroringConfig(
                ['GitHub', 'GitLab'],
                {},
                { autoSync: true, syncInterval: 12 }
            );

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            const savedConfig = JSON.parse(configWrites[0][1]);

            expect(savedConfig.mirroring.enabled).toBe(true);
            expect(savedConfig.mirroring.platforms.github.enabled).toBe(true);
            expect(savedConfig.mirroring.platforms.gitlab.enabled).toBe(true);
            expect(savedConfig.mirroring.platforms.bitbucket.enabled).toBe(false);
            expect(savedConfig.mirroring.defaultSettings.autoSync).toBe(true);
            expect(savedConfig.mirroring.defaultSettings.syncInterval).toBe(12);
        });

        test('doit utiliser paramètres par défaut', () => {
            mirroring.createMirroringConfig(['GitHub'], {}, {});

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            const savedConfig = JSON.parse(configWrites[0][1]);

            expect(savedConfig.mirroring.defaultSettings.autoSync).toBe(false);
            expect(savedConfig.mirroring.defaultSettings.syncInterval).toBe(24);
            expect(savedConfig.mirroring.defaultSettings.includeBranches).toBe(true);
            expect(savedConfig.mirroring.defaultSettings.includeTags).toBe(true);
        });

        test('doit fusionner avec config existante', () => {
            const existingConfig = {
                hooks: { 'commit-msg': {} },
                install: { hooks: true }
            };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

            mirroring.createMirroringConfig(['GitHub'], {}, {});

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            const savedConfig = JSON.parse(configWrites[0][1]);

            expect(savedConfig.hooks).toEqual({ 'commit-msg': {} });
            expect(savedConfig.install.hooks).toBe(true);
            expect(savedConfig.install.mirroring).toBe(true);
        });

        test('doit gérer erreur écriture fichier', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            mirroring.createMirroringConfig(['GitHub'], {}, {});

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la création de la configuration du mirroring:'),
                'Permission denied'
            );
        });

        test('doit afficher message succès', () => {
            mirroring.createMirroringConfig(['GitHub'], {}, {});

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Configuration du système de mirroring mise à jour')
            );
        });
    });
});
