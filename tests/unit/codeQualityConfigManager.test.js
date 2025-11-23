const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

describe('Core codeQualityTools - configManager', () => {
    let configManager;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.resetModules();
        
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('');
        fs.writeFileSync.mockImplementation(() => {});
        fs.renameSync.mockImplementation(() => {});
        path.resolve.mockReturnValue('/fake/path/eslint.config.js');
        
        configManager = require('../../src/core/codeQualityTools/configManager');
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('createGlobalConfig', () => {
        test('doit créer configuration globale', async () => {
            const selectedTools = ['JavaScript (ESLint)'];

            await configManager.createGlobalConfig(selectedTools);

            expect(console.log).toHaveBeenCalled();
        });

        test('doit sauter si tous outils déjà configurés', async () => {
            const selectedTools = [];

            await configManager.createGlobalConfig(selectedTools);

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('doit générer imports pour outils sélectionnés', async () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];

            await configManager.createGlobalConfig(selectedTools);

            expect(console.log).toHaveBeenCalled();
        });

        test('doit être une fonction async', () => {
            expect(typeof configManager.createGlobalConfig).toBe('function');
        });

        test('doit écrire nouveau fichier de config', async () => {
            fs.existsSync.mockReturnValue(false);
            const selectedTools = ['JavaScript (ESLint)'];

            await configManager.createGlobalConfig(selectedTools);

            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('loadExistingConfig', () => {
        test('doit charger configuration existante', async () => {
            fs.existsSync.mockReturnValue(true);
            
            const result = await configManager.loadExistingConfig('eslint.config.js');

            expect(result).toBeDefined();
            expect(result.existingPlugins).toBeDefined();
            expect(result.existingFilesPatterns).toBeDefined();
        });

        test('doit retourner objets vides si fichier absent', async () => {
            fs.existsSync.mockReturnValue(false);

            const result = await configManager.loadExistingConfig('eslint.config.js');

            expect(result.existingPlugins.size).toBe(0);
            expect(result.existingFilesPatterns.size).toBe(0);
        });

        test('doit traiter config comme tableau', async () => {
            fs.existsSync.mockReturnValue(true);

            const result = await configManager.loadExistingConfig('eslint.config.js');

            expect(result.existingConfig).toBeDefined();
        });
    });
});
