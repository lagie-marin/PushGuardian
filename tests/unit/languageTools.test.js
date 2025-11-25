const fs = require('fs');

jest.mock('fs');

const languageTools = require('../../src/core/codeQualityTools/languageTools');

describe('Core codeQualityTools - languageTools', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});

        fs.existsSync.mockReturnValue(false);
        fs.writeFileSync.mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('module exports', () => {
        test('doit exporter LANGUAGE_TOOLS', () => {
            expect(languageTools.LANGUAGE_TOOLS).toBeDefined();
            expect(typeof languageTools.LANGUAGE_TOOLS).toBe('object');
        });

        test('doit exporter toutes les fonctions setup', () => {
            expect(typeof languageTools.setupESLint).toBe('function');
            expect(typeof languageTools.setupTypeScript).toBe('function');
            expect(typeof languageTools.setupJSON).toBe('function');
            expect(typeof languageTools.setupMarkdown).toBe('function');
            expect(typeof languageTools.setupCSS).toBe('function');
            expect(typeof languageTools.setupYAML).toBe('function');
            expect(typeof languageTools.setupHTML).toBe('function');
            expect(typeof languageTools.setupNuxt).toBe('function');
        });
    });

    describe('LANGUAGE_TOOLS configuration', () => {
        test('doit contenir JavaScript (ESLint)', () => {
            const jsConfig = languageTools.LANGUAGE_TOOLS['JavaScript (ESLint)'];
            expect(jsConfig).toBeDefined();
            expect(jsConfig.packages).toEqual(['eslint', 'eslint-plugin-prettier']);
            expect(jsConfig.setup).toBe(languageTools.setupESLint);
        });

        test('doit contenir TypeScript (TypeScript ESLint)', () => {
            const tsConfig = languageTools.LANGUAGE_TOOLS['TypeScript (TypeScript ESLint)'];
            expect(tsConfig).toBeDefined();
            expect(tsConfig.packages).toContain('@typescript-eslint/parser');
            expect(tsConfig.packages).toContain('@typescript-eslint/eslint-plugin');
            expect(tsConfig.packages).toContain('typescript');
            expect(tsConfig.setup).toBe(languageTools.setupTypeScript);
        });

        test('doit contenir JSON (ESLint Plugin)', () => {
            const jsonConfig = languageTools.LANGUAGE_TOOLS['JSON (ESLint Plugin)'];
            expect(jsonConfig).toBeDefined();
            expect(jsonConfig.packages).toEqual(['eslint', 'eslint-plugin-json']);
        });

        test('doit contenir Markdown (ESLint Plugin)', () => {
            const mdConfig = languageTools.LANGUAGE_TOOLS['Markdown (ESLint Plugin)'];
            expect(mdConfig).toBeDefined();
            expect(mdConfig.packages).toEqual(['eslint', '@eslint/markdown']);
        });

        test('doit contenir CSS/SCSS (Stylelint)', () => {
            const cssConfig = languageTools.LANGUAGE_TOOLS['CSS/SCSS (Stylelint)'];
            expect(cssConfig).toBeDefined();
            expect(cssConfig.packages).toEqual(['stylelint', 'stylelint-config-standard']);
        });

        test('doit contenir YAML (ESLint Plugin)', () => {
            const yamlConfig = languageTools.LANGUAGE_TOOLS['YAML (ESLint Plugin)'];
            expect(yamlConfig).toBeDefined();
            expect(yamlConfig.packages).toEqual(['eslint-plugin-yaml']);
        });

        test('doit contenir HTML (ESLint Plugin)', () => {
            const htmlConfig = languageTools.LANGUAGE_TOOLS['HTML (ESLint Plugin)'];
            expect(htmlConfig).toBeDefined();
            expect(htmlConfig.packages).toEqual(['eslint-plugin-html']);
        });

        test('doit contenir Nuxt (ESLint Plugin)', () => {
            const nuxtConfig = languageTools.LANGUAGE_TOOLS['Nuxt (ESLint Plugin)'];
            expect(nuxtConfig).toBeDefined();
            expect(nuxtConfig.packages).toEqual(['eslint-plugin-nuxt']);
        });
    });

    describe('setupESLint', () => {
        test('doit être une fonction async', () => {
            const result = languageTools.setupESLint();
            expect(result).toBeInstanceOf(Promise);
        });

        test('doit afficher message de succès', async () => {
            await languageTools.setupESLint();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Configuration JavaScript'));
        });
    });

    describe('setupTypeScript', () => {
        test('doit être une fonction async', () => {
            const result = languageTools.setupTypeScript();
            expect(result).toBeInstanceOf(Promise);
        });

        test('doit créer tsconfig.json si absent', async () => {
            fs.existsSync.mockReturnValue(false);

            await languageTools.setupTypeScript();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                'tsconfig.json',
                expect.stringContaining('"target"')
            );
        });

        test('ne doit pas écraser tsconfig.json existant', async () => {
            fs.existsSync.mockReturnValue(true);

            await languageTools.setupTypeScript();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('doit créer config avec bonnes options', async () => {
            fs.existsSync.mockReturnValue(false);

            await languageTools.setupTypeScript();

            expect(fs.writeFileSync).toHaveBeenCalled();
            const writtenContent = fs.writeFileSync.mock.calls[0][1];
            const config = JSON.parse(writtenContent);

            expect(config.compilerOptions.target).toBe('ES2020');
            expect(config.compilerOptions.module).toBe('commonjs');
            expect(config.compilerOptions.strict).toBe(true);
        });

        test('doit afficher message de confirmation', async () => {
            fs.existsSync.mockReturnValue(false);

            await languageTools.setupTypeScript();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('tsconfig.json créé'));
        });
    });

    describe('setupJSON', () => {
        test('doit afficher message de confirmation', async () => {
            await languageTools.setupJSON();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Plugin JSON'));
        });
    });

    describe('setupMarkdown', () => {
        test('doit afficher message de confirmation', async () => {
            await languageTools.setupMarkdown();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Plugin Markdown'));
        });
    });

    describe('setupCSS', () => {
        test('doit créer .stylelintrc.json si absent', async () => {
            fs.existsSync.mockReturnValue(false);

            await languageTools.setupCSS();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '.stylelintrc.json',
                expect.stringContaining('stylelint-config-standard')
            );
        });

        test('ne doit pas écraser config existante', async () => {
            fs.existsSync.mockReturnValue(true);

            await languageTools.setupCSS();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('doit créer config avec règles', async () => {
            fs.existsSync.mockReturnValue(false);

            await languageTools.setupCSS();

            expect(fs.writeFileSync).toHaveBeenCalled();
            const writtenContent = fs.writeFileSync.mock.calls[0][1];
            const config = JSON.parse(writtenContent);

            expect(config.extends).toBe('stylelint-config-standard');
            expect(config.rules['color-hex-case']).toBe('lower');
        });

        test('doit afficher message de confirmation', async () => {
            fs.existsSync.mockReturnValue(false);

            await languageTools.setupCSS();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Stylelint créée'));
        });
    });

    describe('setupYAML', () => {
        test('doit afficher message de confirmation', async () => {
            await languageTools.setupYAML();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Plugin YAML'));
        });
    });

    describe('setupHTML', () => {
        test('doit afficher message de confirmation', async () => {
            await languageTools.setupHTML();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Plugin HTML'));
        });
    });

    describe('setupNuxt', () => {
        test('doit afficher message de confirmation', async () => {
            await languageTools.setupNuxt();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Plugin Nuxt'));
        });
    });

    describe('tous les outils ont setup function', () => {
        test('chaque outil doit avoir une fonction setup', () => {
            Object.entries(languageTools.LANGUAGE_TOOLS).forEach(([name, config]) => {
                expect(config.setup).toBeDefined();
                expect(typeof config.setup).toBe('function');
            });
        });

        test('chaque outil doit avoir des packages', () => {
            Object.entries(languageTools.LANGUAGE_TOOLS).forEach(([name, config]) => {
                expect(Array.isArray(config.packages)).toBe(true);
                expect(config.packages.length).toBeGreaterThan(0);
            });
        });
    });
});
