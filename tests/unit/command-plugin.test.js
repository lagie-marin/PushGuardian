jest.mock('../../src/core/plugins/pluginRegistry');
jest.mock('../../src/core/plugins/pluginManager');

const pluginCommand = require('../../src/cli/command/plugin');
const pluginRegistry = require('../../src/core/plugins/pluginRegistry');
const pluginManager = require('../../src/core/plugins/pluginManager');

describe('CLI Command - plugin', () => {
    let consoleLogSpy;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test('doit avoir les bonnes métadonnées', () => {
        expect(pluginCommand.name).toBe('plugin');
        expect(pluginCommand.description).toBeDefined();
        expect(pluginCommand.arguments).toBeDefined();
        expect(pluginCommand.action).toBeInstanceOf(Function);
    });

    test('doit avoir les bons arguments', () => {
        expect(pluginCommand.arguments).toHaveLength(2);
        expect(pluginCommand.arguments[0].name).toBe('<action>');
        expect(pluginCommand.arguments[1].name).toBe('[args...]');
    });

    describe('action enable', () => {
        test('doit activer un plugin avec nom valide', async () => {
            await pluginCommand.action('enable', ['test-plugin'], {});

            expect(pluginRegistry.enablePlugin).toHaveBeenCalledWith('test-plugin');
        });

        test('doit afficher erreur si nom de plugin manquant', async () => {
            await pluginCommand.action('enable', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('requis'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
            expect(pluginRegistry.enablePlugin).not.toHaveBeenCalled();
        });

        test('doit afficher usage pour enable sans nom', async () => {
            await pluginCommand.action('enable', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('pushguardian plugin enable <nom>')
            );
        });
    });

    describe('action disable', () => {
        test('doit désactiver un plugin avec nom valide', async () => {
            await pluginCommand.action('disable', ['test-plugin'], {});

            expect(pluginRegistry.disablePlugin).toHaveBeenCalledWith('test-plugin');
        });

        test('doit afficher erreur si nom de plugin manquant', async () => {
            await pluginCommand.action('disable', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('requis'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
            expect(pluginRegistry.disablePlugin).not.toHaveBeenCalled();
        });

        test('doit afficher usage pour disable sans nom', async () => {
            await pluginCommand.action('disable', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('pushguardian plugin disable <nom>')
            );
        });
    });

    describe('action list', () => {
        test('doit lister les plugins installés', async () => {
            await pluginCommand.action('list', [], {});

            expect(pluginManager.listPlugins).toHaveBeenCalled();
        });

        test('doit fonctionner sans arguments supplémentaires', async () => {
            await pluginCommand.action('list', [], {});

            expect(pluginManager.listPlugins).toHaveBeenCalledWith();
        });
    });

    describe('action commands', () => {
        test('doit lister les commandes disponibles', async () => {
            await pluginCommand.action('commands', [], {});

            expect(pluginManager.displayCommands).toHaveBeenCalled();
        });

        test('doit fonctionner sans arguments supplémentaires', async () => {
            await pluginCommand.action('commands', [], {});

            expect(pluginManager.displayCommands).toHaveBeenCalledWith();
        });
    });

    describe('action run', () => {
        test('doit exécuter une commande de plugin', async () => {
            pluginManager.executeCommand.mockResolvedValue('result');

            await pluginCommand.action('run', ['test-plugin', 'test-command'], {});

            expect(pluginManager.executeCommand).toHaveBeenCalledWith(
                'test-plugin',
                'test-command',
                [],
                {}
            );
        });

        test('doit passer les arguments à la commande', async () => {
            pluginManager.executeCommand.mockResolvedValue(undefined);

            await pluginCommand.action('run', ['test-plugin', 'test-command', 'arg1', 'arg2'], { opt: true });

            expect(pluginManager.executeCommand).toHaveBeenCalledWith(
                'test-plugin',
                'test-command',
                ['arg1', 'arg2'],
                { opt: true }
            );
        });

        test('doit afficher le résultat si défini', async () => {
            pluginManager.executeCommand.mockResolvedValue('Success result');

            await pluginCommand.action('run', ['test-plugin', 'test-command'], {});

            expect(consoleLogSpy).toHaveBeenCalledWith('Success result');
        });

        test('ne doit pas afficher undefined', async () => {
            pluginManager.executeCommand.mockResolvedValue(undefined);

            await pluginCommand.action('run', ['test-plugin', 'test-command'], {});

            expect(consoleLogSpy).not.toHaveBeenCalledWith(undefined);
        });

        test('doit afficher erreur si plugin manquant', async () => {
            await pluginCommand.action('run', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('requis'));
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('pushguardian plugin run <plugin> <commande>')
            );
            expect(pluginManager.executeCommand).not.toHaveBeenCalled();
        });

        test('doit afficher erreur si commande manquante', async () => {
            await pluginCommand.action('run', ['test-plugin'], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('requis'));
            expect(pluginManager.executeCommand).not.toHaveBeenCalled();
        });

        test('doit gérer erreur d\'exécution', async () => {
            pluginManager.executeCommand.mockRejectedValue(new Error('Execution failed'));

            await pluginCommand.action('run', ['test-plugin', 'test-command'], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur'),
                expect.stringContaining('Execution failed')
            );
        });
    });

    describe('action inconnue', () => {
        test('doit afficher erreur pour action inconnue', async () => {
            await pluginCommand.action('unknown', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Action inconnue: unknown')
            );
        });

        test('doit afficher aide pour action inconnue', async () => {
            await pluginCommand.action('invalid-action', [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Gestion des plugins')
            );
        });
    });

    describe('sans action', () => {
        test('doit afficher aide si aucune action', async () => {
            await pluginCommand.action(undefined, [], {});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Gestion des plugins')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('enable'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('disable'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('list'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('commands'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('run'));
        });
    });

    describe('intégration avec args array', () => {
        test('doit gérer correctement args vide', async () => {
            pluginManager.executeCommand.mockResolvedValue(undefined);

            await pluginCommand.action('run', ['plugin', 'cmd'], {});

            expect(pluginManager.executeCommand).toHaveBeenCalledWith(
                'plugin',
                'cmd',
                [],
                {}
            );
        });

        test('doit gérer plusieurs args', async () => {
            pluginManager.executeCommand.mockResolvedValue(undefined);

            await pluginCommand.action('run', ['plugin', 'cmd', 'a', 'b', 'c'], {});

            expect(pluginManager.executeCommand).toHaveBeenCalledWith(
                'plugin',
                'cmd',
                ['a', 'b', 'c'],
                {}
            );
        });
    });
});
