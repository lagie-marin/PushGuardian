jest.mock('../../src/cli/install/hooks');
jest.mock('../../src/core/interactiveMenu/interactiveMenu');
jest.mock('../../src/cli/install/codeQualityTools');
jest.mock('../../src/cli/install/mirroring');
jest.mock('../../src/core/configManager');

// Mock chalk-wrapper pour supporter require('chalk-wrapper') qui retourne directement getChalk
jest.mock('../../src/utils/chalk-wrapper', () => {
    const mockChalk = {
        red: (msg) => msg,
        green: (msg) => msg,
        blue: (msg) => msg,
        cyan: (msg) => msg,
        yellow: (msg) => msg
    };
    const getChalk = () => mockChalk;
    // Export à la fois comme fonction (pour install.js) et comme objet (pour hooks.js)
    const mockModule = getChalk;
    mockModule.getChalk = getChalk;
    return mockModule;
});

const installCommand = require('../../src/cli/command/install');
const { installHooks } = require('../../src/cli/install/hooks');
const { installCodeQualityTools } = require('../../src/cli/install/codeQualityTools');
const { installMirroringTools } = require('../../src/cli/install/mirroring');
const interactiveMenu = require('../../src/core/interactiveMenu/interactiveMenu');
const { loadConfig } = require('../../src/core/configManager');

describe('CLI Command - install', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();

        interactiveMenu.mockResolvedValue(['Hooks Git', 'Code Quality Tools']);
        installHooks.mockImplementation(() => {});
        installCodeQualityTools.mockResolvedValue([]);
        installMirroringTools.mockResolvedValue();
        loadConfig.mockReturnValue({});
    });

    test('doit avoir les bonnes métadonnées', () => {
        expect(installCommand.name).toBe('install');
        expect(installCommand.description).toBe('Installer les hooks Git');
        expect(installCommand.options).toHaveLength(9);
    });

    test('doit afficher erreur si options conflictuelles --hooks et --skip-hooks', async () => {
        await installCommand.action({ hooks: true, skipHooks: true });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Options conflictuelles')
        );
    });

    test('doit afficher erreur si options conflictuelles --code-quality et --skip-code-quality', async () => {
        await installCommand.action({ codeQuality: true, skipCodeQuality: true });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Options conflictuelles')
        );
    });

    test('doit afficher erreur si options conflictuelles --mirroring et --skip-mirroring', async () => {
        await installCommand.action({ mirroring: true, skipMirroring: true });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Options conflictuelles')
        );
    });

    test('doit installer tous modules avec --all', async () => {
        await installCommand.action({ all: true });

        expect(installHooks).toHaveBeenCalledWith(['commit-msg', 'post-checkout', 'pre-push'], undefined);
        expect(installCodeQualityTools).toHaveBeenCalledWith(true, []);
        expect(installMirroringTools).toHaveBeenCalled();
    });

    test('doit installer uniquement hooks avec --hooks', async () => {
        await installCommand.action({ hooks: true });

        expect(installHooks).toHaveBeenCalledWith(['commit-msg', 'post-checkout', 'pre-push'], undefined);
        expect(installCodeQualityTools).not.toHaveBeenCalled();
        expect(installMirroringTools).not.toHaveBeenCalled();
    });

    test('doit installer code quality avec --code-quality', async () => {
        await installCommand.action({ codeQuality: true });

        expect(installCodeQualityTools).toHaveBeenCalledWith(undefined, []);
        expect(installHooks).not.toHaveBeenCalled();
        expect(installMirroringTools).not.toHaveBeenCalled();
    });

    test('doit installer mirroring avec --mirroring', async () => {
        await installCommand.action({ mirroring: true });

        expect(installMirroringTools).toHaveBeenCalled();
        expect(installHooks).not.toHaveBeenCalled();
        expect(installCodeQualityTools).not.toHaveBeenCalled();
    });

    test('doit exclure hooks avec --skip-hooks', async () => {
        await installCommand.action({ skipHooks: true });

        expect(installHooks).not.toHaveBeenCalled();
        expect(installCodeQualityTools).toHaveBeenCalled();
        expect(installMirroringTools).toHaveBeenCalled();
    });

    test('doit exclure code quality avec --skip-code-quality', async () => {
        await installCommand.action({ skipCodeQuality: true });

        expect(installCodeQualityTools).not.toHaveBeenCalled();
        expect(installHooks).toHaveBeenCalled();
        expect(installMirroringTools).toHaveBeenCalled();
    });

    test('doit exclure mirroring avec --skip-mirroring', async () => {
        await installCommand.action({ skipMirroring: true });

        expect(installMirroringTools).not.toHaveBeenCalled();
        expect(installHooks).toHaveBeenCalled();
        expect(installCodeQualityTools).toHaveBeenCalled();
    });

    test('doit utiliser menu interactif par défaut', async () => {
        interactiveMenu.mockResolvedValue(['Hooks Git']);

        await installCommand.action({});

        expect(interactiveMenu).toHaveBeenCalledWith(
            'Choisissez les modules à installer',
            ['Hooks Git', 'Code Quality Tools', 'Mirroring']
        );
        expect(installHooks).toHaveBeenCalled();
    });

    test('doit charger config depuis fichier avec --file', async () => {
        loadConfig.mockReturnValue({
            install: {
                hooks: true,
                CQT: ['JavaScript (ESLint)'],
                mirroring: true
            }
        });

        await installCommand.action({ file: 'custom.config.json', all: true });

        expect(loadConfig).toHaveBeenCalledWith('custom.config.json');
        expect(installHooks).toHaveBeenCalled();
        expect(installCodeQualityTools).toHaveBeenCalledWith(true, ['JavaScript (ESLint)']);
        expect(installMirroringTools).toHaveBeenCalled();
    });

    test('doit passer force flag à installHooks', async () => {
        await installCommand.action({ hooks: true, force: true });

        expect(installHooks).toHaveBeenCalledWith(['commit-msg', 'post-checkout', 'pre-push'], true);
    });

    test('doit gérer erreur gracieusement', async () => {
        installHooks.mockImplementation(() => {
            throw new Error('Install failed');
        });

        await installCommand.action({ hooks: true });

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Une erreur est survenue'),
            'Install failed'
        );
    });

    test('doit pré-sélectionner modules depuis config file', async () => {
        loadConfig.mockReturnValue({
            install: {
                hooks: true,
                CQT: ['TypeScript (TypeScript ESLint)']
            }
        });

        await installCommand.action({ file: 'config.json' });

        expect(installHooks).toHaveBeenCalled();
        expect(installCodeQualityTools).toHaveBeenCalledWith(undefined, ['TypeScript (TypeScript ESLint)']);
    });
});
