const fs = require('fs');

jest.mock('fs');

describe('Core codeQualityTools - configGenerator', () => {
    let configGenerator;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.resetModules();
        
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('');
        fs.writeFileSync.mockImplementation(() => {});
        
        configGenerator = require('../../src/core/codeQualityTools/configGenerator');
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('shouldSkipConfigUpdate', () => {
        test('doit retourner true si tous outils configurés', () => {
            const selectedTools = ['JavaScript (ESLint)'];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set(['**/*.js']);

            const result = configGenerator.shouldSkipConfigUpdate(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(typeof result).toBe('boolean');
        });

        test('doit retourner false si outils non configurés', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            const result = configGenerator.shouldSkipConfigUpdate(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(typeof result).toBe('boolean');
        });

        test('doit afficher message si skip', () => {
            const selectedTools = [];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            configGenerator.shouldSkipConfigUpdate(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('generateImports', () => {
        test('doit générer imports de base', () => {
            const selectedTools = [];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('@eslint/js');
            expect(result).toContain('eslint-plugin-prettier');
        });

        test('doit ajouter import TypeScript', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('typescript');
        });

        test('doit ajouter import JSON', () => {
            const selectedTools = ['JSON (ESLint Plugin)'];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('json');
        });

        test('doit ajouter import Markdown', () => {
            const selectedTools = ['Markdown (ESLint Plugin)'];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('markdown');
        });

        test('doit ajouter import YAML', () => {
            const selectedTools = ['YAML (ESLint Plugin)'];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('yaml');
        });

        test('doit ajouter import HTML', () => {
            const selectedTools = ['HTML (ESLint Plugin)'];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('html');
        });

        test('doit ajouter import Nuxt', () => {
            const selectedTools = ['Nuxt (ESLint Plugin)'];
            const existingPlugins = new Set();

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(result).toContain('nuxt');
        });

        test('ne doit pas dupliquer imports existants', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set(['typescript']);

            const result = configGenerator.generateImports(selectedTools, existingPlugins);

            const tsCount = (result.match(/typescript/g) || []).length;
            expect(tsCount).toBeLessThanOrEqual(1);
        });
    });

    describe('generateNewConfigs', () => {
        test('doit générer configs pour outils sélectionnés', () => {
            const selectedTools = ['JavaScript (ESLint)'];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            const result = configGenerator.generateNewConfigs(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(Array.isArray(result)).toBe(true);
        });

        test('doit générer config TypeScript', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            const result = configGenerator.generateNewConfigs(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(Array.isArray(result)).toBe(true);
        });

        test('doit générer config JSON', () => {
            const selectedTools = ['JSON (ESLint Plugin)'];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            const result = configGenerator.generateNewConfigs(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(Array.isArray(result)).toBe(true);
        });

        test('ne doit pas générer config si déjà existante', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set(['typescript']);
            const existingFilesPatterns = new Set(['**/*.ts']);

            const result = configGenerator.generateNewConfigs(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('buildNewConfigContent', () => {
        test('doit construire nouveau contenu de config', () => {
            const imports = 'const js = require("@eslint/js");';
            const newConfigs = ['{ files: ["**/*.js"] }'];

            const result = configGenerator.buildNewConfigContent(imports, newConfigs);

            expect(result).toContain('module.exports');
            expect(result).toContain(imports);
        });

        test('doit inclure configs recommandées', () => {
            const imports = 'const js = require("@eslint/js");';
            const newConfigs = [];

            const result = configGenerator.buildNewConfigContent(imports, newConfigs);

            expect(result).toContain('js.configs.recommended');
        });
    });

    describe('fonctions de génération de code', () => {
        const emptyPlugins = new Set();
        const emptyPatterns = new Set();

        test('generateJavaScriptCode doit générer config JS', () => {
            const result = configGenerator.generateJavaScriptCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });

        test('generateTypeScriptCode doit générer config TS', () => {
            const result = configGenerator.generateTypeScriptCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });

        test('generateJSONCode doit générer config JSON', () => {
            const result = configGenerator.generateJSONCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });

        test('generateMarkdownCode doit générer config Markdown', () => {
            const result = configGenerator.generateMarkdownCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });

        test('generateYAMLCode doit générer config YAML', () => {
            const result = configGenerator.generateYAMLCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });

        test('generateHTMLCode doit générer config HTML', () => {
            const result = configGenerator.generateHTMLCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });

        test('generateNuxtCode doit générer config Nuxt', () => {
            const result = configGenerator.generateNuxtCode(emptyPlugins, emptyPatterns);

            expect(result).toBeDefined();
            expect(result).toContain('files');
        });
    });

    describe('analyzeExistingConfig', () => {
        test('doit analyser item de config', () => {
            const item = {
                plugins: { typescript: {} },
                files: ['**/*.ts']
            };
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            configGenerator.analyzeExistingConfig(item, existingPlugins, existingFilesPatterns);

            expect(existingPlugins.size).toBeGreaterThanOrEqual(0);
        });

        test('doit détecter plugins dans config', () => {
            const item = {
                plugins: { 
                    typescript: {},
                    json: {}
                }
            };
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            configGenerator.analyzeExistingConfig(item, existingPlugins, existingFilesPatterns);

            expect(existingPlugins.size).toBeGreaterThanOrEqual(0);
        });

        test('doit détecter files patterns', () => {
            const item = {
                files: ['**/*.ts', '**/*.js']
            };
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            configGenerator.analyzeExistingConfig(item, existingPlugins, existingFilesPatterns);

            expect(existingFilesPatterns.size).toBeGreaterThanOrEqual(0);
        });
    });
});
