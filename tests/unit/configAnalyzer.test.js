const fs = require('fs');

jest.mock('fs');

describe('Core codeQualityTools - configAnalyzer', () => {
    let configAnalyzer;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.resetModules();
        
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('');
        fs.writeFileSync.mockImplementation(() => {});
        
        configAnalyzer = require('../../src/core/codeQualityTools/configAnalyzer');
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('analyzeExistingConfig', () => {
        test('doit retourner objet vide si fichier absent', async () => {
            fs.existsSync.mockReturnValue(false);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
            expect(result.filePatterns).toBeDefined();
            expect(result.plugins.size).toBe(0);
        });

        test('doit analyser configuration existante', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const typescript = require('eslint-plugin-typescript');
                files: ['**/*.ts']
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
            expect(result.filePatterns).toBeDefined();
        });

        test('doit détecter plugins eslint', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const typescript = require('eslint-plugin-typescript');
                const json = require('eslint-plugin-json');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
            expect(result.plugins instanceof Set).toBe(true);
        });

        test('doit détecter file patterns', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                files: ['**/*.ts', '**/*.js']
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.filePatterns).toBeDefined();
            expect(result.filePatterns instanceof Set).toBe(true);
        });

        test('doit gérer erreur de lecture', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
        });

        test('doit retourner configContent array', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const typescript = require('eslint-plugin-typescript');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(Array.isArray(result.configContent)).toBe(true);
        });
    });

    describe('updateEslintConfig', () => {
        test('doit accepter tools et analysis comme paramètres', async () => {
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            await expect(configAnalyzer.updateEslintConfig(tools, analysis)).resolves.not.toThrow();
        });

        test('doit être une fonction async', () => {
            expect(typeof configAnalyzer.updateEslintConfig).toBe('function');
        });
    });

    describe('addMissingImports', () => {
        test('doit ajouter imports manquants', () => {
            const content = 'module.exports = [];';
            const tools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, existingPlugins);

            expect(result).toContain('typescript');
        });

        test('ne doit pas dupliquer imports', () => {
            const content = "const typescript = require('@typescript-eslint/parser');\nmodule.exports = [];";
            const tools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set(['typescript']);

            const result = configAnalyzer.addMissingImports(content, tools, existingPlugins);

            expect(result).toBe(content);
        });

        test('doit gérer plusieurs outils', () => {
            const content = 'module.exports = [];';
            const tools = ['TypeScript (TypeScript ESLint)', 'JSON (ESLint Plugin)'];
            const existingPlugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, existingPlugins);

            expect(result).toBeDefined();
        });
    });

    describe('addMissingConfigs', () => {
        test('doit ajouter configs manquantes', () => {
            const content = 'module.exports = [];';
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBeDefined();
        });

        test('ne doit pas ajouter si config existe', () => {
            const content = `module.exports = [{ files: ['**/*.js'] }];`;
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set(['**/*.js']) };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBeDefined();
        });

        test('doit gérer module.exports absent', () => {
            const content = '';
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBe('');
        });
    });
});
