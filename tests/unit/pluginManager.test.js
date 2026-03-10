jest.mock('../../src/core/plugins/pluginRegistry');

const pluginManager = require('../../src/core/plugins/pluginManager');
const pluginRegistry = require('../../src/core/plugins/pluginRegistry');

describe('Core Plugins - pluginManager', () => {
    let consoleLogSpy;
    let mockPlugin;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.clearAllMocks();

        mockPlugin = {
            name: 'test-plugin',
            enabled: true,
            commands: new Map([
                ['cmd1', { 
                    name: 'cmd1',
                    handler: jest.fn().mockResolvedValue('result1'),
                    description: 'Command 1',
                    args: ['arg1']
                }],
                ['cmd2', { 
                    name: 'cmd2',
                    handler: jest.fn().mockResolvedValue('result2'),
                    description: 'Command 2',
                    args: []
                }]
            ]),
            executeCommand: jest.fn().mockResolvedValue('executed')
        };

        pluginRegistry.get.mockReturnValue(mockPlugin);
        pluginRegistry.listActive.mockReturnValue([mockPlugin]);
        pluginRegistry.loadPluginConfig.mockReturnValue({
            plugins: {
                'test-plugin': {
                    version: '1.0.0',
                    enabled: true
                }
            }
        });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('executeCommand', () => {
        test('doit exécuter commande d\'un plugin', async () => {
            const result = await pluginManager.executeCommand('test-plugin', 'cmd1');

            expect(pluginRegistry.get).toHaveBeenCalledWith('test-plugin');
            expect(mockPlugin.executeCommand).toHaveBeenCalledWith('cmd1', [], {});
            expect(result).toBe('executed');
        });

        test('doit passer args et options', async () => {
            await pluginManager.executeCommand('test-plugin', 'cmd1', ['arg'], { opt: true });

            expect(mockPlugin.executeCommand).toHaveBeenCalledWith('cmd1', ['arg'], { opt: true });
        });

        test('doit utiliser valeurs par défaut pour args et options', async () => {
            await pluginManager.executeCommand('test-plugin', 'cmd1');

            expect(mockPlugin.executeCommand).toHaveBeenCalledWith('cmd1', [], {});
        });

        test('doit throw si plugin non trouvé', async () => {
            pluginRegistry.get.mockReturnValue(null);

            await expect(
                pluginManager.executeCommand('unknown-plugin', 'cmd1')
            ).rejects.toThrow('Plugin unknown-plugin non trouve');
        });

        test('doit throw si plugin désactivé', async () => {
            mockPlugin.enabled = false;

            await expect(
                pluginManager.executeCommand('test-plugin', 'cmd1')
            ).rejects.toThrow('Plugin test-plugin est desactive');
        });

        test('doit gérer erreur d\'exécution', async () => {
            const error = new Error('Execution failed');
            mockPlugin.executeCommand.mockRejectedValue(error);

            await expect(
                pluginManager.executeCommand('test-plugin', 'cmd1')
            ).rejects.toThrow('Execution failed');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de l\'execution'),
                expect.stringContaining('Execution failed')
            );
        });

        test('doit afficher nom du plugin et commande dans erreur', async () => {
            mockPlugin.executeCommand.mockRejectedValue(new Error('Test error'));

            await expect(
                pluginManager.executeCommand('test-plugin', 'special-cmd')
            ).rejects.toThrow();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-plugin:special-cmd'),
                expect.any(String)
            );
        });

        test('doit retourner résultat de executeCommand', async () => {
            mockPlugin.executeCommand.mockResolvedValue({ data: 'test' });

            const result = await pluginManager.executeCommand('test-plugin', 'cmd1');

            expect(result).toEqual({ data: 'test' });
        });
    });

    describe('listCommands', () => {
        test('doit lister toutes les commandes actives', () => {
            const commands = pluginManager.listCommands();

            expect(commands).toHaveLength(2);
            expect(commands[0]).toMatchObject({
                plugin: 'test-plugin',
                command: 'cmd1',
                description: 'Command 1',
                args: ['arg1']
            });
        });

        test('doit retourner array vide si aucun plugin actif', () => {
            pluginRegistry.listActive.mockReturnValue([]);

            const commands = pluginManager.listCommands();

            expect(commands).toEqual([]);
        });

        test('doit inclure commandes de plusieurs plugins', () => {
            const plugin2 = {
                name: 'plugin2',
                enabled: true,
                commands: new Map([
                    ['cmd3', { 
                        name: 'cmd3',
                        description: 'Command 3',
                        args: []
                    }]
                ])
            };

            pluginRegistry.listActive.mockReturnValue([mockPlugin, plugin2]);

            const commands = pluginManager.listCommands();

            expect(commands).toHaveLength(3);
            expect(commands.find(c => c.command === 'cmd3')).toBeDefined();
        });

        test('doit inclure toutes les propriétés de commande', () => {
            const commands = pluginManager.listCommands();

            expect(commands[0]).toHaveProperty('plugin');
            expect(commands[0]).toHaveProperty('command');
            expect(commands[0]).toHaveProperty('description');
            expect(commands[0]).toHaveProperty('args');
        });

        test('doit gérer plugin sans commandes', () => {
            const emptyPlugin = {
                name: 'empty-plugin',
                enabled: true,
                commands: new Map()
            };

            pluginRegistry.listActive.mockReturnValue([emptyPlugin]);

            const commands = pluginManager.listCommands();

            expect(commands).toEqual([]);
        });
    });

    describe('displayCommands', () => {
        test('doit afficher commandes disponibles', () => {
            pluginManager.displayCommands();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Commandes disponibles')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-plugin')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('cmd1')
            );
        });

        test('doit afficher message si aucune commande', () => {
            pluginRegistry.listActive.mockReturnValue([]);

            pluginManager.displayCommands();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Aucune commande disponible')
            );
        });

        test('doit grouper commandes par plugin', () => {
            pluginManager.displayCommands();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-plugin:')
            );
        });

        test('doit afficher args si présents', () => {
            pluginManager.displayCommands();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const cmd1Call = calls.find(c => c.includes('cmd1'));
            
            expect(cmd1Call).toContain('arg1');
        });

        test('doit afficher description si présente', () => {
            pluginManager.displayCommands();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const cmd1Call = calls.find(c => c.includes('cmd1'));
            
            expect(cmd1Call).toContain('Command 1');
        });

        test('doit gérer commande sans args', () => {
            pluginManager.displayCommands();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const cmd2Call = calls.find(c => c.includes('cmd2') && !c.includes('cmd1'));
            
            expect(cmd2Call).toBeDefined();
        });

        test('doit gérer commande sans description', () => {
            mockPlugin.commands.set('cmd-no-desc', {
                name: 'cmd-no-desc',
                description: '',
                args: []
            });

            pluginManager.displayCommands();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const cmdCall = calls.find(c => c.includes('cmd-no-desc'));

            expect(cmdCall).toBeDefined();
            expect(cmdCall).not.toContain(' - ');
        });

        test('doit afficher plusieurs plugins', () => {
            const plugin2 = {
                name: 'plugin2',
                enabled: true,
                commands: new Map([
                    ['cmd3', { 
                        name: 'cmd3',
                        description: 'Command 3',
                        args: []
                    }]
                ])
            };

            pluginRegistry.listActive.mockReturnValue([mockPlugin, plugin2]);

            pluginManager.displayCommands();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('plugin2:')
            );
        });
    });

    describe('listPlugins', () => {
        test('doit afficher plugins installés', () => {
            pluginManager.listPlugins();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Plugins installes')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-plugin')
            );
        });

        test('doit afficher message si aucun plugin', () => {
            pluginRegistry.loadPluginConfig.mockReturnValue({ plugins: {} });

            pluginManager.listPlugins();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Aucun plugin installe')
            );
        });

        test('doit afficher message si config.plugins est undefined', () => {
            pluginRegistry.loadPluginConfig.mockReturnValue({});

            pluginManager.listPlugins();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Aucun plugin installe')
            );
        });

        test('doit afficher statut actif', () => {
            pluginManager.listPlugins();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const pluginCall = calls.find(c => c.includes('test-plugin'));
            
            expect(pluginCall).toContain('Actif');
        });

        test('doit afficher statut inactif', () => {
            pluginRegistry.loadPluginConfig.mockReturnValue({
                plugins: {
                    'disabled-plugin': {
                        version: '1.0.0',
                        enabled: false
                    }
                }
            });
            pluginRegistry.get.mockReturnValue(null);

            pluginManager.listPlugins();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const pluginCall = calls.find(c => c.includes('disabled-plugin'));
            
            expect(pluginCall).toContain('Inactif');
        });

        test('doit afficher version du plugin', () => {
            pluginManager.listPlugins();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const pluginCall = calls.find(c => c.includes('test-plugin'));
            
            expect(pluginCall).toContain('1.0.0');
        });

        test('doit afficher nombre de commandes', () => {
            pluginManager.listPlugins();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const pluginCall = calls.find(c => c.includes('test-plugin'));
            
            expect(pluginCall).toContain('2 commande(s)');
        });

        test('doit afficher 0 commandes si plugin non chargé', () => {
            pluginRegistry.get.mockReturnValue(null);

            pluginManager.listPlugins();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const pluginCall = calls.find(c => c.includes('test-plugin'));
            
            expect(pluginCall).toContain('0 commande(s)');
        });

        test('doit afficher description si disponible', () => {
            mockPlugin.description = 'Test plugin description';

            pluginManager.listPlugins();

            const calls = consoleLogSpy.mock.calls.map(c => c.join(' '));
            const descCall = calls.find(c => c.includes('Test plugin description'));
            
            expect(descCall).toBeDefined();
        });

        test('doit gérer plugin sans description', () => {
            mockPlugin.description = '';

            pluginManager.listPlugins();

            // Ne doit pas crasher
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('module singleton', () => {
        test('doit être une instance unique', () => {
            const instance1 = require('../../src/core/plugins/pluginManager');
            const instance2 = require('../../src/core/plugins/pluginManager');

            expect(instance1).toBe(instance2);
        });
    });

    describe('intégration', () => {
        test('doit gérer workflow complet', async () => {
            // List commands
            const commands = pluginManager.listCommands();
            expect(commands).toHaveLength(2);

            // Display commands
            pluginManager.displayCommands();
            expect(consoleLogSpy).toHaveBeenCalled();

            // Execute command
            const result = await pluginManager.executeCommand('test-plugin', 'cmd1');
            expect(result).toBe('executed');

            // List plugins
            consoleLogSpy.mockClear();
            pluginManager.listPlugins();
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });
});
