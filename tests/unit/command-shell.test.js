jest.mock('readline');
jest.mock('../../src/utils/exec-wrapper', () => jest.fn());
jest.mock('../../src/cli/command/validate');
jest.mock('../../src/cli/command/plugin');
jest.mock('../../src/cli/command/mirror', () => ({
    action: jest.fn()
}));
jest.mock('../../src/cli/command/security');
jest.mock('../../src/cli/command/performance');
jest.mock('../../src/cli/command/config');

const readline = require('readline');
const execWrapper = require('../../src/utils/exec-wrapper');
const validateCommand = require('../../src/cli/command/validate');
const pluginCommand = require('../../src/cli/command/plugin');
const mirrorCommand = require('../../src/cli/command/mirror');
const securityCommand = require('../../src/cli/command/security');
const performanceCommand = require('../../src/cli/command/performance');
const configCommand = require('../../src/cli/command/config');

// Import shell command after mocks are set up
const shellCommand = require('../../src/cli/command/shell');

describe('CLI Command - shell', () => {
    let consoleLogSpy;
    let mockRl;
    let lineCallback;
    let closeCallback;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'clear').mockImplementation(() => {});
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        jest.clearAllMocks();

        lineCallback = null;
        closeCallback = null;

        mockRl = {
            prompt: jest.fn(),
            close: jest.fn(),
            on: jest.fn((event, callback) => {
                if (event === 'line') lineCallback = callback;
                if (event === 'close') closeCallback = callback;
            })
        };

        readline.createInterface.mockReturnValue(mockRl);

        validateCommand.action.mockResolvedValue(undefined);
        pluginCommand.action.mockResolvedValue(undefined);
        mirrorCommand.action.mockResolvedValue(undefined);
        securityCommand.action.mockResolvedValue(undefined);
        performanceCommand.action.mockResolvedValue(undefined);
        configCommand.action.mockResolvedValue(undefined);
        execWrapper.mockResolvedValue({ stdout: '', stderr: '' });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        console.clear.mockRestore();
        process.exit.mockRestore();
    });

    test('doit avoir les bonnes métadonnées', () => {
        expect(shellCommand.name).toBe('shell');
        expect(shellCommand.description).toBeDefined();
        expect(shellCommand.action).toBeInstanceOf(Function);
    });

    test('doit créer interface readline avec prompt', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(readline.createInterface).toHaveBeenCalledWith(
            expect.objectContaining({
                input: process.stdin,
                output: process.stdout
            })
        );
        expect(mockRl.prompt).toHaveBeenCalled();
    });

    test('doit afficher message de bienvenue', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('push-guardian Interactive Shell'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('help'));
    });

    test('doit quitter avec "exit"', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('exit');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Au revoir'));
        expect(mockRl.close).toHaveBeenCalled();
    });

    test('doit quitter avec "quit"', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('quit');

        expect(mockRl.close).toHaveBeenCalled();
    });

    test('doit effacer l\'écran avec "clear"', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('clear');

        expect(console.clear).toHaveBeenCalled();
        expect(mockRl.prompt).toHaveBeenCalledTimes(2);
    });

    test('doit effacer l\'écran avec "cls"', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('cls');

        expect(console.clear).toHaveBeenCalled();
    });

    test('doit afficher aide avec "help"', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('help');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Commandes disponibles'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('validate'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('plugin'));
    });

    test('doit afficher aide avec "?"', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('?');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Commandes disponibles'));
    });

    test('doit gérer ligne vide', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('   ');

        expect(mockRl.prompt).toHaveBeenCalledTimes(2);
    });

    test('doit exécuter commande validate', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('validate');

        expect(validateCommand.action).toHaveBeenCalledWith(undefined, {});
    });

    test('doit exécuter commande plugin avec args', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('plugin list');

        expect(pluginCommand.action).toHaveBeenCalledWith('list', [], {});
    });

    test('doit exécuter commande plugin run avec args', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('plugin run hello');

        expect(pluginCommand.action).toHaveBeenCalledWith('run', ['hello'], {});
    });

    test('doit exécuter commande mirror', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('mirror');

        expect(mirrorCommand.action).toHaveBeenCalledWith(undefined, {});
    });

    test('doit parser options --flag', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('validate --force');

        expect(validateCommand.action).toHaveBeenCalledWith(undefined, { force: true });
    });

    test('doit parser options -f', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('validate -f');

        expect(validateCommand.action).toHaveBeenCalledWith(undefined, { f: true });
    });

    test('doit exécuter commande inconnue comme bash', async () => {
        execWrapper.mockResolvedValue({ stdout: 'bash output', stderr: '' });
        
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('unknown-command');

        expect(execWrapper).toHaveBeenCalledWith('unknown-command', { shell: true });
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('bash output'));
    });

    test('doit gérer erreur d\'exécution', async () => {
        validateCommand.action.mockRejectedValue(new Error('Validation failed'));
        
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('validate');

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('Erreur'),
            expect.stringContaining('Validation failed')
        );
    });

    test('doit appeler process.exit lors de close', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        closeCallback();

        expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('doit exécuter commande security', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('security scan');

        expect(securityCommand.action).toHaveBeenCalledWith('scan', [], {});
    });

    test('doit exécuter commande performance', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('performance analyze');

        expect(performanceCommand.action).toHaveBeenCalledWith('analyze', [], {});
    });

    test('doit exécuter commande config', async () => {
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('config show');

        expect(configCommand.action).toHaveBeenCalledWith('show', [], {});
    });

    test('doit exécuter commande bash ls', async () => {
        execWrapper.mockResolvedValue({ stdout: 'file1.txt\nfile2.txt\n', stderr: '' });
        
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('ls');

        expect(execWrapper).toHaveBeenCalledWith('ls', { shell: true });
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('file1.txt'));
    });

    test('doit exécuter commande bash pwd', async () => {
        execWrapper.mockResolvedValue({ stdout: '/home/user/project\n', stderr: '' });
        
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('pwd');

        expect(execWrapper).toHaveBeenCalledWith('pwd', { shell: true });
    });

    test('doit gérer stderr de commande bash', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        execWrapper.mockResolvedValue({ stdout: '', stderr: 'warning message' });
        
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('some-command');

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('warning message'));
        consoleErrorSpy.mockRestore();
    });

    test('doit gérer erreur de commande bash', async () => {
        execWrapper.mockRejectedValue(new Error('Command not found'));
        
        const actionPromise = shellCommand.action();
        
        await new Promise((resolve) => setTimeout(resolve, 10));
        await lineCallback('invalid-command');

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('Commande bash échouée: Command not found')
        );
    });
});
