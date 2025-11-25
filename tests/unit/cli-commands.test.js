const { loadConfig, saveConfig } = require('../../src/core/configManager');
const configCommand = require('../../src/cli/command/config');

jest.mock('../../src/core/configManager');

describe('CLI Command - config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('doit avoir les bonnes propriétés', () => {
        expect(configCommand.name).toBe('config');
        expect(configCommand.description).toBe('Gérer la configuration');
        expect(typeof configCommand.action).toBe('function');
    });

    test('doit lister la configuration avec --list', async () => {
        const mockConfig = {
            hooks: {
                'commit-msg': {
                    type: ['feat', 'fix'],
                    constraints: {}
                }
            }
        };
        loadConfig.mockReturnValue(mockConfig);

        await configCommand.action(null, null, { list: true });

        expect(loadConfig).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Configuration actuelle'));
    });

    test('doit afficher une clé spécifique', async () => {
        const mockConfig = {
            hooks: {
                'commit-msg': {
                    type: ['feat', 'fix']
                }
            }
        };
        loadConfig.mockReturnValue(mockConfig);

        await configCommand.action('hooks', null, {});

        expect(loadConfig).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('hooks'));
    });

    test('doit mettre à jour une configuration', async () => {
        const mockConfig = { test: 'old' };
        loadConfig.mockReturnValue(mockConfig);

        await configCommand.action('test', 'new', {});

        expect(saveConfig).toHaveBeenCalledWith({ test: 'new' });
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('mise à jour avec succès'));
    });

    test('doit afficher un message d\'aide si aucun argument', async () => {
        await configCommand.action(null, null, {});

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Spécifiez une clé ou --list'));
    });
});

const { validateCode } = require('../../src/core/validator');
const errorCMD = require('../../src/core/errorCMD');
const validateCommand = require('../../src/cli/command/validate');

jest.mock('../../src/core/validator');
jest.mock('../../src/core/errorCMD');

describe('CLI Command - validate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        process.exit.mockRestore();
    });

    test('doit avoir les bonnes propriétés', () => {
        expect(validateCommand.name).toBe('validate');
        expect(validateCommand.description).toBe('Valider le code actuel');
        expect(typeof validateCommand.action).toBe('function');
    });

    test('doit valider avec succès', async () => {
        validateCode.mockResolvedValue({ success: true, errors: [] });

        await validateCommand.action(null, {});

        expect(validateCode).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Validation réussie'));
        expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('doit échouer avec des erreurs', async () => {
        validateCode.mockResolvedValue({
            success: false,
            errors: ['Error 1', 'Error 2']
        });

        await validateCommand.action(null, {});

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Validation échouée'));
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('doit être silencieux avec --silent', async () => {
        validateCode.mockResolvedValue({ success: true, errors: [] });

        await validateCommand.action(null, { silent: true });

        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Validation en cours'));
    });

    test('doit passer les options à validateCode', async () => {
        validateCode.mockResolvedValue({ success: true, errors: [] });
        const options = { fix: true, strict: true };

        await validateCommand.action('message', options);

        expect(validateCode).toHaveBeenCalledWith('message', options);
    });

    test('doit gérer les exceptions', async () => {
        const error = new Error('Test error');
        validateCode.mockRejectedValue(error);

        await validateCommand.action(null, {});

        expect(errorCMD).toHaveBeenCalledWith(error);
    });
});
