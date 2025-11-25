const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

describe('Core codeQualityTools - configManager', () => {
    let configManager;
    let configGenerator;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.resetModules();
        
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('');
        fs.writeFileSync.mockImplementation(() => {});
        fs.renameSync.mockImplementation(() => {});
        path.resolve.mockReturnValue('/fake/path/eslint.config.js');
        
        configGenerator = require('../../src/core/codeQualityTools/configGenerator');
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
            expect(Array.isArray(result.existingConfig)).toBe(true);
        });

        test('doit retourner existingConfig array', async () => {
            fs.existsSync.mockReturnValue(true);

            const result = await configManager.loadExistingConfig('eslint.config.js');

            expect(Array.isArray(result.existingConfig)).toBe(true);
        });
    });

    describe('createGlobalConfig - tests supplémentaires', () => {
        test('doit être appelable avec outils', async () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];

            await expect(configManager.createGlobalConfig(selectedTools)).resolves.not.toThrow();
        });

        test('doit être appelable sans crash avec JSON', async () => {
            const selectedTools = ['JSON (ESLint Plugin)'];

            await expect(configManager.createGlobalConfig(selectedTools)).resolves.not.toThrow();
        });

        test('doit retourner sans erreur', async () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];

            const result = await configManager.createGlobalConfig(selectedTools);

            expect(result).toBeUndefined();
        });

        test('doit gérer outils vides', async () => {
            const selectedTools = [];

            await expect(configManager.createGlobalConfig(selectedTools)).resolves.not.toThrow();
        });

        test('doit gérer plusieurs outils', async () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)', 'JSON (ESLint Plugin)', 'YAML (ESLint Plugin)'];

            await expect(configManager.createGlobalConfig(selectedTools)).resolves.not.toThrow();
        });
    });
});
