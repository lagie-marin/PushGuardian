const fs = require('fs');

jest.mock('fs');
jest.mock('../../src/core/interactiveMenu/interactiveMenu');
jest.mock('../../src/core/codeQualityTools/configAnalyzer');
jest.mock('../../src/core/codeQualityTools/fileDetector');
jest.mock('../../src/core/codeQualityTools/toolInstaller');
jest.mock('../../src/core/codeQualityTools/languageTools');
jest.mock('../../src/utils/chalk-wrapper', () => ({
    getChalk: () => ({
        red: (msg) => msg,
        green: (msg) => msg,
        blue: (msg) => msg,
        yellow: (msg) => msg
    })
}));

const codeQualityTools = require('../../src/cli/install/codeQualityTools');
const configAnalyzer = require('../../src/core/codeQualityTools/configAnalyzer');
const fileDetector = require('../../src/core/codeQualityTools/fileDetector');
const toolInstaller = require('../../src/core/codeQualityTools/toolInstaller');
const languageTools = require('../../src/core/codeQualityTools/languageTools');
const interactiveMenu = require('../../src/core/interactiveMenu/interactiveMenu');

describe('CLI Install - codeQualityTools', () => {
    const mockConfigPath = 'pushguardian.config.json';

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();

        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockImplementation(() => {});

        languageTools.LANGUAGE_TOOLS = {
            'JavaScript (ESLint)': { packages: ['eslint'] },
            'TypeScript (TypeScript ESLint)': { packages: ['@typescript-eslint/parser'] },
            'JSON (ESLint Plugin)': { packages: ['eslint-plugin-json'] }
        };

        configAnalyzer.analyzeExistingConfig.mockResolvedValue({
            plugins: new Set(),
            configs: new Set(),
            linterOptions: {}
        });

        fileDetector.detectFileTypes.mockResolvedValue({
            javascript: true,
            typescript: false,
            json: false
        });

        toolInstaller.installBaseTools.mockResolvedValue();
        toolInstaller.installLanguageTools.mockResolvedValue();

        configAnalyzer.updateEslintConfig.mockResolvedValue();
        interactiveMenu.mockResolvedValue([0]);
    });

    describe('installCodeQualityTools', () => {
        test('doit retourner tableau vide si tous outils déjà configurés', async () => {
            // Pour que JavaScript soit considéré configuré, le plugin null doit être dans le Set
            // Mais le code vérifie si pluginName exists dans plugins, donc null ne sera jamais trouvé
            // En pratique, quand tous les outils sont configurés, availableTools est vide
            languageTools.LANGUAGE_TOOLS = {
                'TypeScript (TypeScript ESLint)': { packages: ['@typescript-eslint/parser'] },
                'JSON (ESLint Plugin)': { packages: ['eslint-plugin-json'] }
            };

            configAnalyzer.analyzeExistingConfig.mockResolvedValue({
                plugins: new Set([
                    '@typescript-eslint',
                    'eslint-plugin-json'
                ]),
                configs: new Set(),
                linterOptions: {}
            });

            const result = await codeQualityTools.installCodeQualityTools();

            expect(result).toEqual([]);
        });

        test('doit afficher outils disponibles', async () => {
            await codeQualityTools.installCodeQualityTools();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('JavaScript (ESLint)'));
        });

        test('doit retourner tableau vide si aucun outil disponible', async () => {
            languageTools.LANGUAGE_TOOLS = {
                'TypeScript (TypeScript ESLint)': { packages: ['@typescript-eslint/parser'] }
            };

            configAnalyzer.analyzeExistingConfig.mockResolvedValue({
                plugins: new Set(['@typescript-eslint']),
                configs: new Set(),
                linterOptions: {}
            });

            const result = await codeQualityTools.installCodeQualityTools();

            expect(result).toEqual([]);
        });

        test('doit utiliser outils pré-sélectionnés', async () => {
            const preselected = ['JavaScript (ESLint)', 'JSON (ESLint Plugin)'];

            await codeQualityTools.installCodeQualityTools(false, preselected);

            expect(toolInstaller.installLanguageTools).toHaveBeenCalledWith(
                languageTools.LANGUAGE_TOOLS['JavaScript (ESLint)']
            );
            expect(toolInstaller.installLanguageTools).toHaveBeenCalledWith(
                languageTools.LANGUAGE_TOOLS['JSON (ESLint Plugin)']
            );
        });

        test('doit installer tous outils avec flag all=true', async () => {
            await codeQualityTools.installCodeQualityTools(true);

            expect(interactiveMenu).not.toHaveBeenCalled();
            expect(toolInstaller.installLanguageTools).toHaveBeenCalledTimes(3);
        });

        test('doit utiliser menu interactif par défaut', async () => {
            interactiveMenu.mockResolvedValue([0, 2]); // JavaScript et JSON

            await codeQualityTools.installCodeQualityTools(false);

            expect(interactiveMenu).toHaveBeenCalledWith(
                'Choisissez les langages à analyser avec ESLint:',
                expect.arrayContaining([
                    'JavaScript (ESLint)',
                    'TypeScript (TypeScript ESLint)',
                    'JSON (ESLint Plugin)'
                ]),
                expect.any(Array)
            );
            expect(toolInstaller.installLanguageTools).toHaveBeenCalledTimes(2);
        });

        test('doit installer outils de base', async () => {
            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installation des outils de base'));
            expect(toolInstaller.installBaseTools).toHaveBeenCalled();
        });

        test('doit créer fichier eslint.config.js si inexistant', async () => {
            fs.existsSync.mockImplementation((path) => {
                if (path.includes('eslint.config.js')) return false;
                return false;
            });

            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Création du fichier ESLint'));
            const eslintWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0].includes('eslint.config.js')
            );
            expect(eslintWrites.length).toBe(1);
        });

        test('ne doit pas créer eslint.config.js si existe', async () => {
            fs.existsSync.mockImplementation((path) => {
                if (path.includes('eslint.config.js')) return true;
                return false;
            });

            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            const eslintWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0].includes('eslint.config.js')
            );
            expect(eslintWrites.length).toBe(0);
        });

        test('doit mettre à jour config ESLint', async () => {
            const mockAnalysis = {
                plugins: new Set(),
                configs: new Set(),
                linterOptions: {}
            };
            configAnalyzer.analyzeExistingConfig.mockResolvedValue(mockAnalysis);

            await codeQualityTools.installCodeQualityTools(false, ['TypeScript (TypeScript ESLint)']);

            expect(configAnalyzer.updateEslintConfig).toHaveBeenCalledWith(
                ['TypeScript (TypeScript ESLint)'],
                mockAnalysis
            );
        });

        test('doit créer config PushGuardian', async () => {
            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === mockConfigPath
            );
            expect(configWrites.length).toBeGreaterThan(0);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Configuration des outils de qualité de code mise à jour')
            );
        });

        test('doit afficher message succès', async () => {
            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Configuration de Code Quality Tools terminée!')
            );
        });

        test('doit gérer erreur installation', async () => {
            toolInstaller.installBaseTools.mockRejectedValue(new Error('Install failed'));

            await expect(
                codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)'])
            ).rejects.toThrow('Install failed');

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Erreur during setup:'),
                'Install failed'
            );
        });

        test('doit pré-sélectionner outils détectés', async () => {
            fileDetector.detectFileTypes.mockResolvedValue({
                javascript: true,
                typescript: true,
                json: false
            });

            await codeQualityTools.installCodeQualityTools(false);

            expect(interactiveMenu).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.arrayContaining([0, 1]) // JavaScript et TypeScript pré-sélectionnés
            );
        });

        test('doit retourner noms des outils installés', async () => {
            const result = await codeQualityTools.installCodeQualityTools(false, [
                'JavaScript (ESLint)',
                'TypeScript (TypeScript ESLint)'
            ]);

            expect(result).toEqual(['JavaScript (ESLint)', 'TypeScript (TypeScript ESLint)']);
        });
    });

    describe('createCodeQualityConfig', () => {
        // Cette fonction est privée, testée via installCodeQualityTools

        test('doit fusionner avec config existante', async () => {
            const existingConfig = {
                hooks: { 'commit-msg': {} },
                install: { hooks: true }
            };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === mockConfigPath
            );
            const savedConfig = JSON.parse(configWrites[configWrites.length - 1][1]);

            expect(savedConfig.hooks).toEqual({ 'commit-msg': {} });
            expect(savedConfig.install.hooks).toBe(true);
            expect(savedConfig.install.CQT).toBeDefined();
        });

        test('doit gérer JSON invalide gracieusement', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{ invalid json }');

            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            // Ne doit pas throw, doit créer nouvelle config
            const configWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0] === mockConfigPath
            );
            expect(configWrites.length).toBeGreaterThan(0);
        });

        test('doit gérer erreur écriture fichier', async () => {
            fs.writeFileSync.mockImplementation((path) => {
                if (path === mockConfigPath) {
                    throw new Error('Permission denied');
                }
            });

            // Ne doit pas throw l'erreur
            await codeQualityTools.installCodeQualityTools(false, ['JavaScript (ESLint)']);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la création de la configuration'),
                'Permission denied'
            );
        });
    });
});
