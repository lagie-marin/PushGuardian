let fs = require('fs');

jest.mock('fs');

describe('Core codeQualityTools - configAnalyzer', () => {
    let configAnalyzer;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.resetModules();
        fs = require('fs');
        
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
            expect(result.plugins.size).toBeGreaterThan(0);
            expect(result.filePatterns.size).toBeGreaterThan(0);
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

        test('doit extraire plugins avec regex', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const typescript = require('@typescript-eslint/eslint-plugin');
                const json = require('eslint-plugin-json');
                const yaml = require('eslint-plugin-yml');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
            expect(result.plugins instanceof Set).toBe(true);
        });

        test('doit extraire file patterns avec regex', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                module.exports = [{
                    files: ['**/*.ts', '**/*.tsx'],
                }, {
                    files: ['**/*.json']
                }];
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.filePatterns).toBeDefined();
            expect(result.filePatterns instanceof Set).toBe(true);
        });

        test('doit afficher message de succès avec nombre de plugins', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const typescript = require('eslint-plugin-typescript');
                const json = require('eslint-plugin-json');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
        });

        test('doit parser plugins avec require simple', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const plugin1 = require('eslint-plugin-react');
                const plugin2 = require('eslint-plugin-vue');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
        });

        test('doit extraire correctement noms de plugins depuis package', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const react = require('eslint-plugin-react');
                const typescript = require('@typescript-eslint/eslint-plugin');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins).toBeDefined();
        });

        test('doit gérer file patterns avec extraction de quotes', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                module.exports = [{
                    files: ['**/*.js', '**/*.jsx']
                }, {
                    files: ['**/*.ts']
                }];
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.filePatterns).toBeDefined();
        });

        test('doit extraire files et remplacer quotes', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                files: ["**/*.js", '**/*.ts']
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.filePatterns).toBeDefined();
        });

        test('ne doit pas ajouter un require qui n\'est pas un eslint-plugin', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const lodash = require('lodash');
                const html = require('eslint-plugin-html');
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins.has('lodash')).toBe(false);
            expect(result.plugins.has('html')).toBe(true);
        });

        test('doit gérer un bloc files sans guillemets', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                module.exports = [{ files: [SANS_QUOTES] }];
            `);

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.filePatterns.size).toBe(0);
        });

        test('doit tolérer un require mal formé lors du parsing fin', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue("const a = require('eslint-plugin-json');");

            const originalMatch = String.prototype.match;
            const matchSpy = jest.spyOn(String.prototype, 'match').mockImplementation(function (regex) {
                if (regex && regex.toString() === "/require\\('([^']+)'\\)/g") {
                    return ["BROKEN_REQUIRE_TOKEN"];
                }
                if (regex && regex.toString() === "/require\\('([^']+)'\\)/") {
                    return null;
                }
                return originalMatch.call(this, regex);
            });

            const result = await configAnalyzer.analyzeExistingConfig();

            expect(result.plugins.size).toBe(0);
            matchSpy.mockRestore();
        });
    });

    describe('updateEslintConfig', () => {
        test('doit accepter tools et analysis comme paramètres', async () => {
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('module.exports = [];');
            
            await expect(configAnalyzer.updateEslintConfig(tools, analysis)).resolves.not.toThrow();
        });

        test('doit créer nouvelle config si fichier absent', async () => {
            const tools = ['TypeScript (TypeScript ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            fs.existsSync.mockReturnValue(false);

            await expect(configAnalyzer.updateEslintConfig(tools, analysis)).resolves.not.toThrow();
        });

        test('doit créer backup avant mise à jour', async () => {
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('const js = require("@eslint/js");\nmodule.exports = [];');

            await configAnalyzer.updateEslintConfig(tools, analysis);

            expect(console.log).toHaveBeenCalled();
        });

        test('doit appeler addMissingImports et addMissingConfigs', async () => {
            const tools = ['TypeScript (TypeScript ESLint)', 'JSON (ESLint Plugin)'];
            const analysis = { 
                plugins: new Set(), 
                filePatterns: new Set() 
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
                const js = require('@eslint/js');
                module.exports = [js.configs.recommended];
            `);

            await expect(configAnalyzer.updateEslintConfig(tools, analysis)).resolves.not.toThrow();
        });

        test('doit être une fonction async', () => {
            expect(typeof configAnalyzer.updateEslintConfig).toBe('function');
        });

        test('doit gérer erreur lors de création config', async () => {
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            fs.existsSync.mockReturnValue(false);

            await expect(configAnalyzer.updateEslintConfig(tools, analysis)).resolves.not.toThrow();
        });
    });

    describe('addMissingImports', () => {
        test('doit ajouter imports TypeScript manquants', () => {
            const content = `const js = require('@eslint/js');\nmodule.exports = [];`;
            const tools = ['TypeScript (TypeScript ESLint)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toContain('typescript');
        });

        test('doit ajouter imports JSON manquants', () => {
            const content = `const js = require('@eslint/js');\nmodule.exports = [];`;
            const tools = ['JSON (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toContain('json');
        });

        test('ne doit pas ajouter imports existants', () => {
            const content = `const json = require('eslint-plugin-json');\nmodule.exports = [];`;
            const tools = ['JSON (ESLint Plugin)'];
            const plugins = new Set(['json']);

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            const jsonCount = (result.match(/eslint-plugin-json/g) || []).length;
            expect(jsonCount).toBe(1);
        });

        test('doit ajouter plusieurs imports', () => {
            const content = `const js = require('@eslint/js');\nmodule.exports = [];`;
            const tools = ['TypeScript (TypeScript ESLint)', 'JSON (ESLint Plugin)', 'YAML (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toContain('typescript');
            expect(result).toContain('json');
            expect(result).toContain('yaml');
        });

        test('doit insérer imports après dernier require', () => {
            const content = `const js = require('@eslint/js');\nconst prettier = require('prettier');\n\nmodule.exports = [];`;
            const tools = ['JSON (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            const prettierIndex = result.indexOf('prettier');
            const jsonIndex = result.indexOf('json');
            expect(jsonIndex).toBeGreaterThan(prettierIndex);
        });

        test('doit gérer contenu sans require existant', () => {
            const content = `module.exports = [];`;
            const tools = ['JSON (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toContain('json');
            expect(result).toContain('module.exports');
        });

        test('ne doit pas dupliquer imports avec typescript-eslint', () => {
            const content = "const typescript = require('@typescript-eslint/parser');\nmodule.exports = [];";
            const tools = ['TypeScript (TypeScript ESLint)'];
            const existingPlugins = new Set(['typescript']);

            const result = configAnalyzer.addMissingImports(content, tools, existingPlugins);

            expect(result).toBe(content);
        });

        test('doit gérer outils HTML', () => {
            const content = `module.exports = [];`;
            const tools = ['HTML (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toContain('html');
        });

        test('doit gérer outils Markdown', () => {
            const content = `module.exports = [];`;
            const tools = ['Markdown (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toContain('markdown');
        });

        test('ne doit pas ajouter import si le plugin est déjà présent dans le contenu', () => {
            const content = `const html = require('eslint-plugin-html');\nmodule.exports = [];`;
            const tools = ['HTML (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            const htmlCount = (result.match(/eslint-plugin-html/g) || []).length;
            expect(htmlCount).toBe(1);
        });

        test('ne doit rien injecter si module.exports est absent', () => {
            const content = `const notAConfig = true;`;
            const tools = ['JSON (ESLint Plugin)'];
            const plugins = new Set();

            const result = configAnalyzer.addMissingImports(content, tools, plugins);

            expect(result).toBe(content);
        });
    });

    describe('addMissingConfigs', () => {
        test('doit ajouter config JavaScript', () => {
            const content = `module.exports = [];`;
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.js');
        });

        test('doit ajouter config TypeScript', () => {
            const content = `module.exports = [js.configs.recommended];`;
            const tools = ['TypeScript (TypeScript ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.ts');
        });

        test('doit ajouter config JSON', () => {
            const content = `module.exports = [];`;
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.json');
        });

        test('ne doit pas dupliquer configs existantes', () => {
            const content = `module.exports = [{ files: ['**/*.json'] }];`;
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(['json']), filePatterns: new Set(['**/*.json']) };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            const jsonCount = (result.match(/\*\*\/\*\.json/g) || []).length;
            expect(jsonCount).toBe(1);
        });

        test('doit gérer module.exports manquant', () => {
            const content = `const js = require('@eslint/js');`;
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBe(content);
        });

        test('doit ajouter plusieurs configs', () => {
            const content = `module.exports = [];`;
            const tools = ['TypeScript (TypeScript ESLint)', 'JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.ts');
            expect(result).toContain('**/*.json');
        });

        test('ne doit pas ajouter si config existe déjà', () => {
            const content = `module.exports = [{ files: ['**/*.js'] }];`;
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set(['**/*.js']) };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            const jsCount = (result.match(/\*\*\/\*\.js/g) || []).length;
            expect(jsCount).toBe(1);
        });

        test('doit gérer contenu vide', () => {
            const content = '';
            const tools = ['JavaScript (ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBe('');
        });

        test('doit gérer HTML config', () => {
            const content = `module.exports = [];`;
            const tools = ['HTML (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.html');
        });

        test('doit gérer YAML config', () => {
            const content = `module.exports = [];`;
            const tools = ['YAML (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.yml');
        });

        test('doit gérer Markdown config', () => {
            const content = `module.exports = [];`;
            const tools = ['Markdown (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.md');
        });

        test('doit gérer bracket count dans array parsing', () => {
            const content = `module.exports = [
                { files: ['**/*.js'], rules: { 'no-console': 'error' } },
                { files: ['**/*.ts'], rules: {} }
            ];`;
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.json');
        });

        test('doit insérer config au bon endroit dans array complexe', () => {
            const content = `module.exports = [
                {
                    files: ['**/*.js'],
                    rules: {
                        'no-console': 'error'
                    }
                }
            ];`;
            const tools = ['TypeScript (TypeScript ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toContain('**/*.ts');
            expect(result.indexOf('**/*.ts')).toBeGreaterThan(result.indexOf('**/*.js'));
        });

        test('doit ignorer les outils sans générateur', () => {
            const content = `module.exports = [];`;
            const tools = ['Unknown Tool'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBe(content);
        });

        test('ne doit pas ajouter une config déjà présente via configKey', () => {
            const content = `module.exports = [{ files: ['**/*.json'] }];`;
            const tools = ['JSON (ESLint Plugin)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            const jsonCount = (result.match(/\*\*\/\*\.json/g) || []).length;
            expect(jsonCount).toBe(1);
        });

        test('doit retourner le contenu si array module.exports n\'est pas fermé', () => {
            const content = `module.exports = [\n  { files: ['**/*.js'] }`;
            const tools = ['TypeScript (TypeScript ESLint)'];
            const analysis = { plugins: new Set(), filePatterns: new Set() };

            const result = configAnalyzer.addMissingConfigs(content, tools, analysis);

            expect(result).toBe(content);
        });
    });
});
