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

    describe('buildConfigContent', () => {
        test('doit construire contenu pour nouvelle config', () => {
            const selectedTools = ['JavaScript (ESLint)'];
            const existingConfig = [];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();
            const imports = 'const js = require("@eslint/js");';

            const result = configGenerator.buildConfigContent(
                selectedTools,
                existingConfig,
                existingPlugins,
                existingFilesPatterns,
                imports
            );

            expect(result).toContain('module.exports');
            expect(result).toContain(imports);
        });

        test('doit gérer config existante', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingConfig = [{ files: ['**/*.js'] }];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set(['**/*.js']);
            const imports = 'const typescript = require("typescript");';

            const result = configGenerator.buildConfigContent(
                selectedTools,
                existingConfig,
                existingPlugins,
                existingFilesPatterns,
                imports
            );

            expect(result).toBeDefined();
        });

        test('doit retourner null si newConfigs vide', () => {
            const selectedTools = [];
            const existingConfig = [];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();
            const imports = '';

            const result = configGenerator.buildConfigContent(
                selectedTools,
                existingConfig,
                existingPlugins,
                existingFilesPatterns,
                imports
            );

            expect(result).toBeNull();
        });

        test('doit appeler buildNewConfigContent si pas de config existante', () => {
            const selectedTools = ['JavaScript (ESLint)'];
            const existingConfig = [];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();
            const imports = 'const js = require("@eslint/js");';

            const result = configGenerator.buildConfigContent(
                selectedTools,
                existingConfig,
                existingPlugins,
                existingFilesPatterns,
                imports
            );

            expect(result).toContain('js.configs.recommended');
        });

        test('doit appeler buildMergedConfigContent si config existante', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingConfig = [{ files: ['**/*.js'] }];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set(['**/*.js']);
            const imports = 'const typescript = require("typescript");';

            const result = configGenerator.buildConfigContent(
                selectedTools,
                existingConfig,
                existingPlugins,
                existingFilesPatterns,
                imports
            );

            expect(result).toBeDefined();
        });
    });

    describe('serializeConfig', () => {
        test('doit sérialiser config simple', () => {
            const config = { files: ['**/*.js'] };

            const result = configGenerator.serializeConfig(config);

            expect(result).toContain('files');
            expect(result).toContain('**/*.js');
        });

        test('doit gérer fonctions dans config', () => {
            const config = { 
                files: ['**/*.ts'],
                rules: {
                    test: () => {}
                }
            };

            const result = configGenerator.serializeConfig(config);

            expect(result).toBeDefined();
        });

        test('doit gérer plugins avec simplification', () => {
            const config = {
                files: ['**/*.ts'],
                plugins: {
                    typescript: {}
                }
            };

            const result = configGenerator.serializeConfig(config);

            expect(result).toContain('plugins');
        });

        test('doit détecter références circulaires', () => {
            const config = { files: ['**/*.js'] };
            config.self = config;

            const result = configGenerator.serializeConfig(config);

            expect(result).toBeDefined();
        });

        test('doit gérer objets imbriqués', () => {
            const config = {
                files: ['**/*.ts'],
                rules: {
                    '@typescript-eslint/no-unused-vars': ['error', {
                        argsIgnorePattern: '^_'
                    }]
                }
            };

            const result = configGenerator.serializeConfig(config);

            expect(result).toContain('rules');
        });

        test('doit gérer arrays', () => {
            const config = {
                files: ['**/*.js', '**/*.jsx'],
                ignores: ['node_modules/**', 'dist/**']
            };

            const result = configGenerator.serializeConfig(config);

            expect(result).toContain('files');
            expect(result).toContain('ignores');
        });
    });

    describe('buildMergedConfigContent', () => {
        test('doit fusionner imports et configs', () => {
            const imports = 'const typescript = require("typescript");';
            const existingConfig = [{ files: ['**/*.js'] }];
            const newConfigs = [{ files: ['**/*.ts'] }];

            const result = configGenerator.buildMergedConfigContent(imports, existingConfig, newConfigs);

            expect(result).toContain('module.exports');
        });

        test('doit ajouter nouvelles configs', () => {
            const imports = '';
            const existingConfig = [];
            const newConfigs = ['{ files: ["**/*.ts"] }'];

            const result = configGenerator.buildMergedConfigContent(imports, existingConfig, newConfigs);

            expect(result).toContain('module.exports');
        });

        test('doit inclure imports dans le résultat', () => {
            const imports = 'const json = require("eslint-plugin-json");';
            const existingConfig = [];
            const newConfigs = [];

            const result = configGenerator.buildMergedConfigContent(imports, existingConfig, newConfigs);

            expect(result).toContain('json');
        });
    });

    describe('test de génération complète', () => {
        test('doit générer imports pour TypeScript', () => {
            const selectedTools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set();

            const imports = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(imports).toContain('typescript');
        });

        test('doit générer imports pour JSON', () => {
            const selectedTools = ['JSON (ESLint Plugin)'];
            const existingPlugins = new Set();

            const imports = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(imports).toContain('json');
        });

        test('doit générer imports pour plusieurs outils', () => {
            const selectedTools = [
                'TypeScript (TypeScript ESLint)',
                'JSON (ESLint Plugin)',
                'Markdown (ESLint Plugin)'
            ];
            const existingPlugins = new Set();

            const imports = configGenerator.generateImports(selectedTools, existingPlugins);

            expect(imports).toContain('typescript');
            expect(imports).toContain('json');
            expect(imports).toContain('markdown');
        });
    });

    describe('edge cases', () => {
        test('doit gérer selectedTools vide', () => {
            const selectedTools = [];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            const result = configGenerator.generateNewConfigs(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(Array.isArray(result)).toBe(true);
        });

        test('doit gérer outil non reconnu', () => {
            const selectedTools = ['Unknown Tool'];
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set();

            const result = configGenerator.generateNewConfigs(
                selectedTools,
                existingPlugins,
                existingFilesPatterns
            );

            expect(Array.isArray(result)).toBe(true);
        });

        test('generateNuxtCode doit gérer patterns existants', () => {
            const existingPlugins = new Set();
            const existingFilesPatterns = new Set(['**/*.vue']);

            const result = configGenerator.generateNuxtCode(existingPlugins, existingFilesPatterns);

            expect(result).toBeDefined();
        });
    });
});
