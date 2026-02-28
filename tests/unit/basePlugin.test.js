const BasePlugin = require('../../src/core/plugins/basePlugin');

describe('Core Plugins - basePlugin', () => {
    let plugin;
    let consoleLogSpy;

    const mockManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 'index.js'
    };

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        plugin = new BasePlugin(mockManifest);
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('construction', () => {
        test('doit créer instance avec manifest', () => {
            expect(plugin.name).toBe('test-plugin');
            expect(plugin.version).toBe('1.0.0');
            expect(plugin.description).toBe('A test plugin');
            expect(plugin.author).toBe('Test Author');
        });

        test('doit initialiser enabled à true', () => {
            expect(plugin.enabled).toBe(true);
        });

        test('doit initialiser Map vide pour commandes', () => {
            expect(plugin.commands).toBeInstanceOf(Map);
            expect(plugin.commands.size).toBe(0);
        });

        test('doit stocker manifest', () => {
            expect(plugin.manifest).toEqual(mockManifest);
        });

        test('doit gérer manifest sans description', () => {
            const minimalManifest = {
                name: 'minimal-plugin',
                version: '1.0.0'
            };
            const minimalPlugin = new BasePlugin(minimalManifest);

            expect(minimalPlugin.description).toBe('');
            expect(minimalPlugin.author).toBe('');
        });

        test('doit gérer manifest sans author', () => {
            const noAuthorManifest = {
                name: 'no-author-plugin',
                version: '1.0.0',
                description: 'Plugin without author'
            };
            const noAuthorPlugin = new BasePlugin(noAuthorManifest);

            expect(noAuthorPlugin.author).toBe('');
            expect(noAuthorPlugin.description).toBe('Plugin without author');
        });
    });

    describe('registerCommand', () => {
        test('doit enregistrer une commande simple', () => {
            const handler = jest.fn();
            plugin.registerCommand('test-cmd', handler);

            expect(plugin.commands.has('test-cmd')).toBe(true);
            expect(plugin.commands.get('test-cmd').handler).toBe(handler);
        });

        test('doit enregistrer commande avec description', () => {
            const handler = jest.fn();
            const options = { description: 'Test command' };
            
            plugin.registerCommand('test-cmd', handler, options);

            const command = plugin.commands.get('test-cmd');
            expect(command.description).toBe('Test command');
        });

        test('doit enregistrer commande avec args', () => {
            const handler = jest.fn();
            const options = { args: ['arg1', 'arg2'] };
            
            plugin.registerCommand('test-cmd', handler, options);

            const command = plugin.commands.get('test-cmd');
            expect(command.args).toEqual(['arg1', 'arg2']);
        });

        test('doit utiliser valeurs par défaut si options vide', () => {
            const handler = jest.fn();
            plugin.registerCommand('test-cmd', handler);

            const command = plugin.commands.get('test-cmd');
            expect(command.description).toBe('');
            expect(command.args).toEqual([]);
        });

        test('doit afficher message de confirmation', () => {
            const handler = jest.fn();
            plugin.registerCommand('test-cmd', handler);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Commande test-cmd enregistree')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('test-plugin')
            );
        });

        test('doit stocker nom de commande', () => {
            const handler = jest.fn();
            plugin.registerCommand('my-command', handler);

            const command = plugin.commands.get('my-command');
            expect(command.name).toBe('my-command');
        });

        test('doit pouvoir enregistrer plusieurs commandes', () => {
            plugin.registerCommand('cmd1', jest.fn());
            plugin.registerCommand('cmd2', jest.fn());
            plugin.registerCommand('cmd3', jest.fn());

            expect(plugin.commands.size).toBe(3);
            expect(plugin.commands.has('cmd1')).toBe(true);
            expect(plugin.commands.has('cmd2')).toBe(true);
            expect(plugin.commands.has('cmd3')).toBe(true);
        });

        test('doit écraser commande existante', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            plugin.registerCommand('test-cmd', handler1);
            plugin.registerCommand('test-cmd', handler2);

            expect(plugin.commands.size).toBe(1);
            expect(plugin.commands.get('test-cmd').handler).toBe(handler2);
        });
    });

    describe('executeCommand', () => {
        test('doit exécuter commande enregistrée', async () => {
            const handler = jest.fn().mockResolvedValue('result');
            plugin.registerCommand('test-cmd', handler);

            const result = await plugin.executeCommand('test-cmd');

            expect(handler).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        test('doit passer args à handler', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            plugin.registerCommand('test-cmd', handler);

            await plugin.executeCommand('test-cmd', ['arg1', 'arg2']);

            expect(handler).toHaveBeenCalledWith(['arg1', 'arg2'], {});
        });

        test('doit passer options à handler', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            plugin.registerCommand('test-cmd', handler);

            await plugin.executeCommand('test-cmd', [], { opt: 'value' });

            expect(handler).toHaveBeenCalledWith([], { opt: 'value' });
        });

        test('doit utiliser valeurs par défaut pour args et options', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            plugin.registerCommand('test-cmd', handler);

            await plugin.executeCommand('test-cmd');

            expect(handler).toHaveBeenCalledWith([], {});
        });

        test('doit throw si commande non trouvée', async () => {
            await expect(
                plugin.executeCommand('non-existent')
            ).rejects.toThrow('Commande non-existent non trouvee dans test-plugin');
        });

        test('doit throw si plugin désactivé', async () => {
            const handler = jest.fn();
            plugin.registerCommand('test-cmd', handler);
            plugin.enabled = false;

            await expect(
                plugin.executeCommand('test-cmd')
            ).rejects.toThrow('Plugin test-plugin est desactive');

            expect(handler).not.toHaveBeenCalled();
        });

        test('doit gérer erreur dans handler', async () => {
            const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
            plugin.registerCommand('test-cmd', handler);

            await expect(
                plugin.executeCommand('test-cmd')
            ).rejects.toThrow('Handler error');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur dans test-plugin:test-cmd'),
                expect.stringContaining('Handler error')
            );
        });

        test('doit propager erreur après log', async () => {
            const error = new Error('Test error');
            const handler = jest.fn().mockRejectedValue(error);
            plugin.registerCommand('test-cmd', handler);

            await expect(
                plugin.executeCommand('test-cmd')
            ).rejects.toThrow('Test error');
        });

        test('doit retourner résultat du handler', async () => {
            const handler = jest.fn().mockResolvedValue({ data: 'test' });
            plugin.registerCommand('test-cmd', handler);

            const result = await plugin.executeCommand('test-cmd');

            expect(result).toEqual({ data: 'test' });
        });

        test('doit gérer handler synchrone', async () => {
            const handler = jest.fn().mockReturnValue('sync result');
            plugin.registerCommand('test-cmd', handler);

            const result = await plugin.executeCommand('test-cmd');

            expect(result).toBe('sync result');
        });
    });

    describe('getManifest', () => {
        test('doit retourner manifest', () => {
            const manifest = plugin.getManifest();

            expect(manifest).toEqual(mockManifest);
        });

        test('doit retourner même référence que manifest stocké', () => {
            const manifest = plugin.getManifest();

            expect(manifest).toBe(plugin.manifest);
        });

        test('doit inclure toutes les propriétés du manifest', () => {
            const manifest = plugin.getManifest();

            expect(manifest.name).toBe('test-plugin');
            expect(manifest.version).toBe('1.0.0');
            expect(manifest.description).toBe('A test plugin');
            expect(manifest.author).toBe('Test Author');
            expect(manifest.main).toBe('index.js');
        });
    });

    describe('cleanup', () => {
        test('doit nettoyer les commandes', async () => {
            plugin.registerCommand('cmd1', jest.fn());
            plugin.registerCommand('cmd2', jest.fn());

            await plugin.cleanup();

            expect(plugin.commands.size).toBe(0);
        });

        test('doit afficher message de nettoyage', async () => {
            await plugin.cleanup();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Nettoyage du plugin: test-plugin')
            );
        });

        test('doit vider Map des commandes', async () => {
            plugin.registerCommand('test', jest.fn());
            expect(plugin.commands.size).toBe(1);

            await plugin.cleanup();

            expect(plugin.commands.size).toBe(0);
            expect(plugin.commands.has('test')).toBe(false);
        });

        test('doit être async', async () => {
            const result = plugin.cleanup();
            expect(result).toBeInstanceOf(Promise);
            await result;
        });
    });

    describe('propriétés', () => {
        test('enabled doit être modifiable', () => {
            expect(plugin.enabled).toBe(true);
            plugin.enabled = false;
            expect(plugin.enabled).toBe(false);
        });

        test('commands doit être accessible', () => {
            expect(plugin.commands).toBeInstanceOf(Map);
            plugin.registerCommand('test', jest.fn());
            expect(plugin.commands.size).toBe(1);
        });

        test('toutes les propriétés doivent être accessibles', () => {
            expect(plugin.name).toBeDefined();
            expect(plugin.version).toBeDefined();
            expect(plugin.description).toBeDefined();
            expect(plugin.author).toBeDefined();
            expect(plugin.enabled).toBeDefined();
            expect(plugin.commands).toBeDefined();
            expect(plugin.manifest).toBeDefined();
        });
    });

    describe('cas d\'utilisation complexes', () => {
        test('doit gérer workflow complet', async () => {
            // Enregistrer commandes
            const handler1 = jest.fn().mockResolvedValue('result1');
            const handler2 = jest.fn().mockResolvedValue('result2');
            
            plugin.registerCommand('cmd1', handler1, { description: 'Command 1' });
            plugin.registerCommand('cmd2', handler2, { description: 'Command 2' });

            // Exécuter commandes
            const result1 = await plugin.executeCommand('cmd1', ['arg'], { opt: true });
            const result2 = await plugin.executeCommand('cmd2');

            expect(result1).toBe('result1');
            expect(result2).toBe('result2');
            expect(handler1).toHaveBeenCalledWith(['arg'], { opt: true });
            expect(handler2).toHaveBeenCalledWith([], {});

            // Cleanup
            await plugin.cleanup();
            expect(plugin.commands.size).toBe(0);
        });
    });
});
