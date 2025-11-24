const fs = require('fs');
const path = require('path');

jest.mock('fs');

const configManager = require('../../src/core/configManager');

describe('Core - configManager', () => {
    const mockConfigPath = path.resolve(process.cwd(), 'pushguardian.config.json');
    const originalConsoleError = console.error;
    const originalProcessExit = process.exit;

    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
        console.log = jest.fn();
        process.exit = jest.fn();
        
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockImplementation(() => {});
    });

    afterEach(() => {
        console.error = originalConsoleError;
        process.exit = originalProcessExit;
    });

    describe('loadConfig', () => {
        test('doit créer fichier config si inexistant', () => {
            fs.existsSync.mockReturnValue(false);

            const config = configManager.loadConfig();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify({}, null, 4)
            );
            expect(config).toEqual({});
        });

        test('doit charger config existante', () => {
            const mockConfig = { hooks: { 'commit-msg': {} } };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = configManager.loadConfig();

            expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
            expect(config).toEqual(mockConfig);
        });

        test('doit gérer erreur création fichier', () => {
            fs.existsSync.mockReturnValue(false);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            configManager.loadConfig();

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la création du fichier de configuration:'),
                'Permission denied'
            );
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit gérer erreur lecture fichier', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Cannot read file');
            });

            configManager.loadConfig();

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors du chargement de la configuration:'),
                'Cannot read file'
            );
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit gérer JSON invalide', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{ invalid json }');

            configManager.loadConfig();

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors du chargement de la configuration:'),
                expect.anything()
            );
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit accepter chemin personnalisé', () => {
            const customPath = '/custom/path/config.json';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"custom": true}');

            const config = configManager.loadConfig(customPath);

            expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf-8');
            expect(config).toEqual({ custom: true });
        });
    });

    describe('saveConfig', () => {
        test('doit sauvegarder nouvelle config', () => {
            const newConfig = { hooks: { 'pre-push': {} } };

            configManager.saveConfig(newConfig);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify(newConfig, null, 2)
            );
            expect(console.log).toHaveBeenCalledWith('✅ Configuration mise à jour avec succès.');
        });

        test('doit gérer erreur sauvegarde', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });

            configManager.saveConfig({ test: true });

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la sauvegarde de la configuration:'),
                'Disk full'
            );
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit formater JSON avec indentation', () => {
            const complexConfig = {
                hooks: {
                    'commit-msg': { type: ['ADD', 'FIX'] }
                },
                validate: {
                    directories: ['src/']
                }
            };

            configManager.saveConfig(complexConfig);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify(complexConfig, null, 2)
            );
        });

        test('doit gérer config vide', () => {
            configManager.saveConfig({});

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                mockConfigPath,
                '{}'
            );
            expect(console.log).toHaveBeenCalledWith('✅ Configuration mise à jour avec succès.');
        });
    });
});
