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
        gray: (msg) => msg,
        cyan: (msg) => msg
    })
}));
jest.mock('../../src/core/interactiveMenu/interactiveMenu');

const { getEnv, saveEnv } = require('../../src/core/module/env-loader');
const mirroring = require('../../src/cli/install/mirroring');
const interactiveMenu = require('../../src/core/interactiveMenu/interactiveMenu');

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

        // Mock interactiveMenu
        interactiveMenu.mockResolvedValue([]);
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

        test('doit gérer config JSON invalide', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json {');

            mirroring.createMirroringConfig(['GitHub'], {}, {});

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            expect(configWrites.length).toBeGreaterThan(0);
        });

        test('doit inclure toutes les plateformes dans config', () => {
            mirroring.createMirroringConfig(['GitHub'], {}, {});

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            const savedConfig = JSON.parse(configWrites[0][1]);

            expect(savedConfig.mirroring.platforms.github).toBeDefined();
            expect(savedConfig.mirroring.platforms.gitlab).toBeDefined();
            expect(savedConfig.mirroring.platforms.bitbucket).toBeDefined();
            expect(savedConfig.mirroring.platforms.azure).toBeDefined();
        });

        test('doit activer uniquement plateformes sélectionnées', () => {
            mirroring.createMirroringConfig(['GitLab'], {}, {});

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            const savedConfig = JSON.parse(configWrites[0][1]);

            expect(savedConfig.mirroring.platforms.gitlab.enabled).toBe(true);
            expect(savedConfig.mirroring.platforms.github.enabled).toBe(false);
            expect(savedConfig.mirroring.platforms.bitbucket.enabled).toBe(false);
        });
    });

    describe('askCredentials', () => {
        let mockRl;

        beforeEach(() => {
            const readline = require('readline');
            mockRl = {
                question: jest.fn(),
                close: jest.fn()
            };
            readline.createInterface.mockReturnValue(mockRl);
        });

        test('doit demander token pour GitHub', async () => {
            mockRl.question.mockImplementation((question, callback) => {
                callback('test_github_token');
            });

            const promise = mirroring.askCredentials('github');
            const result = await promise;

            expect(result).toEqual({ token: 'test_github_token' });
            expect(mockRl.question).toHaveBeenCalledWith(
                expect.stringContaining('token GitHub'),
                expect.any(Function)
            );
            expect(mockRl.close).toHaveBeenCalled();
        });

        test('doit demander token pour GitLab', async () => {
            mockRl.question.mockImplementation((question, callback) => {
                callback('test_gitlab_token');
            });

            const result = await mirroring.askCredentials('gitlab');

            expect(result).toEqual({ token: 'test_gitlab_token' });
            expect(mockRl.question).toHaveBeenCalledWith(
                expect.stringContaining('token GitLab'),
                expect.any(Function)
            );
        });

        test('doit demander username et password pour BitBucket', async () => {
            let questionCount = 0;
            mockRl.question.mockImplementation((question, callback) => {
                questionCount++;
                if (questionCount === 1) {
                    callback('bitbucket_user');
                } else {
                    callback('bitbucket_pass');
                }
            });

            const result = await mirroring.askCredentials('bitbucket');

            expect(result).toEqual({
                username: 'bitbucket_user',
                password: 'bitbucket_pass'
            });
            expect(mockRl.question).toHaveBeenCalledTimes(2);
        });

        test('doit demander URL et token pour Azure DevOps', async () => {
            let questionCount = 0;
            mockRl.question.mockImplementation((question, callback) => {
                questionCount++;
                if (questionCount === 1) {
                    callback('https://dev.azure.com/org');
                } else {
                    callback('azure_token');
                }
            });

            const result = await mirroring.askCredentials('azure');

            expect(result).toEqual({
                url: 'https://dev.azure.com/org',
                token: 'azure_token'
            });
            expect(mockRl.question).toHaveBeenCalledTimes(2);
        });

        test('doit retourner objet vide pour plateforme inconnue', async () => {
            const result = await mirroring.askCredentials('unknown');

            expect(result).toEqual({});
            expect(mockRl.close).toHaveBeenCalled();
            expect(mockRl.question).not.toHaveBeenCalled();
        });

        test('doit gérer plateforme avec espaces', async () => {
            let questionCount = 0;
            mockRl.question.mockImplementation((question, callback) => {
                questionCount++;
                if (questionCount === 1) {
                    callback('https://dev.azure.com/test');
                } else {
                    callback('test_token');
                }
            });

            const result = await mirroring.askCredentials('azure');

            expect(result).toEqual({
                url: 'https://dev.azure.com/test',
                token: 'test_token'
            });
        });
    });

    describe('saveCredentialsToEnv - edge cases', () => {
        test('doit gérer credentials GitLab', () => {
            getEnv.mockReturnValue('');

            mirroring.saveCredentialsToEnv({
                gitlab: { token: 'gitlab_token_123' }
            });

            expect(saveEnv).toHaveBeenCalledWith('GITLAB_TOKEN', 'gitlab_token_123', '.env');
        });

        test('ne doit pas sauvegarder si pas de token', () => {
            getEnv.mockReturnValue('');

            mirroring.saveCredentialsToEnv({
                github: {}
            });

            expect(saveEnv).not.toHaveBeenCalledWith('GITHUB_TOKEN', expect.anything(), expect.anything());
        });

        test('ne doit pas écraser credentials BitBucket existants', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'BITBUCKET_USERNAME') return 'existing_user';
                return '';
            });

            mirroring.saveCredentialsToEnv({
                bitbucket: { username: 'new_user', password: 'new_pass' }
            });

            expect(saveEnv).not.toHaveBeenCalledWith('BITBUCKET_USERNAME', expect.anything(), expect.anything());
        });

        test('ne doit pas écraser credentials Azure existants', () => {
            getEnv.mockImplementation((key) => {
                if (key === 'AZURE_DEVOPS_URL') return 'https://existing.com';
                return '';
            });

            mirroring.saveCredentialsToEnv({
                azure: { url: 'https://new.com', token: 'new_token' }
            });

            expect(saveEnv).not.toHaveBeenCalledWith('AZURE_DEVOPS_URL', expect.anything(), expect.anything());
        });

        test('doit afficher message de log pour chaque plateforme', () => {
            getEnv.mockReturnValue('');

            mirroring.saveCredentialsToEnv({
                github: { token: 'gh_token' },
                gitlab: { token: 'gl_token' }
            });

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Sauvegarde des credentials pour github'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Sauvegarde des credentials pour gitlab'));
        });
    });

    describe('installMirroringTools', () => {
        let mockRl;

        beforeEach(() => {
            const readline = require('readline');
            mockRl = {
                question: jest.fn(),
                close: jest.fn()
            };
            readline.createInterface.mockReturnValue(mockRl);
        });

        test('doit afficher message si déjà installé', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                install: { mirroring: true }
            }));

            await mirroring.installMirroringTools();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Le système de mirroring est déjà installé')
            );
        });

        test('doit afficher message si aucune plateforme sélectionnée', async () => {
            interactiveMenu.mockResolvedValue([]);

            await mirroring.installMirroringTools();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Aucune plateforme sélectionnée')
            );
        });

        test('doit configurer une seule plateforme', async () => {
            interactiveMenu.mockResolvedValue(['GitHub']);
            getEnv.mockReturnValue('test_token');
            
            // Mock askForDefaults pour répondre avec plateformes valides puis réponses vides
            let questionCount = 0;
            mockRl.question.mockImplementation((question, callback) => {
                questionCount++;
                if (questionCount === 1) callback('github'); // source platform
                else if (questionCount === 2) callback('gitlab'); // target platform
                else callback(''); // réponses vides pour les questions optionnelles
            });

            await mirroring.installMirroringTools();

            expect(interactiveMenu).toHaveBeenCalled();
            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            expect(configWrites.length).toBeGreaterThan(0);
        });

        test('doit configurer plusieurs plateformes', async () => {
            interactiveMenu.mockResolvedValue(['GitHub', 'GitLab']);
            getEnv.mockImplementation((key) => {
                if (key === 'GITHUB_TOKEN') return 'github_token';
                if (key === 'GITLAB_TOKEN') return 'gitlab_token';
                return '';
            });
            
            // Mock askForDefaults pour répondre avec plateformes valides puis réponses vides
            let questionCount = 0;
            mockRl.question.mockImplementation((question, callback) => {
                questionCount++;
                if (questionCount === 1) callback('github');
                else if (questionCount === 2) callback('gitlab');
                else callback('');
            });

            await mirroring.installMirroringTools();

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === 'pushguardian.config.json'
            );
            expect(configWrites.length).toBeGreaterThan(0);
        });

        test('doit appeler interactiveMenu avec bonnes options', async () => {
            // Mock askForDefaults
            let questionCount = 0;
            mockRl.question.mockImplementation((question, callback) => {
                questionCount++;
                if (questionCount === 1) callback('github');
                else if (questionCount === 2) callback('gitlab');
                else callback('');
            });

            await mirroring.installMirroringTools();

            expect(interactiveMenu).toHaveBeenCalledWith(
                'Choisissez les plateformes à activer pour le mirroring:',
                ['GitHub', 'GitLab', 'BitBucket', 'Azure DevOps']
            );
        });
    });
});
