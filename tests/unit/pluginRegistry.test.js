let fs = require('fs');
const path = require('path');

jest.mock('fs');

// Mock BasePlugin before requiring pluginRegistry
const mockBasePlugin = jest.fn();
jest.mock('../../src/core/plugins/basePlugin', () => mockBasePlugin);

describe('Core Plugins - pluginRegistry', () => {
    let pluginRegistry;
    let consoleLogSpy;
    let mockPlugin;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        fs = require('fs');

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Setup default mocks
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify({ plugins: {} }));
        fs.writeFileSync.mockImplementation(() => {});

        mockPlugin = {
            name: 'test-plugin',
            version: '1.0.0',
            enabled: true,
            commands: new Map()
        };

        // Re-require to get fresh instance
        pluginRegistry = require('../../src/core/plugins/pluginRegistry');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('construction', () => {
        test('doit initialiser plugins Map', () => {
            expect(pluginRegistry.plugins).toBeInstanceOf(Map);
        });

        test('doit définir configPath', () => {
            expect(pluginRegistry.configPath).toContain('.push-guardian-plugins.json');
        });

        test('doit définir pluginsDir', () => {
            expect(pluginRegistry.pluginsDir).toContain('plugins');
        });
    });

    describe('loadPluginConfig', () => {
        test('doit charger config si fichier existe', () => {
            const mockConfig = { plugins: { 'test-plugin': { enabled: true } } };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = pluginRegistry.loadPluginConfig();

            expect(config).toEqual(mockConfig);
            expect(fs.readFileSync).toHaveBeenCalledWith(
                pluginRegistry.configPath,
                'utf8'
            );
        });

        test('doit retourner config vide si fichier inexistant', () => {
            fs.existsSync.mockReturnValue(false);

            const config = pluginRegistry.loadPluginConfig();

            expect(config).toEqual({ plugins: {} });

            // restore default for other tests in this describe block
            fs.existsSync.mockReturnValue(true);
        });

        test('doit gérer erreur de parsing JSON', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json');

            const config = pluginRegistry.loadPluginConfig();

            expect(config).toEqual({ plugins: {} });
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors du chargement')
            );
        });

        test('doit gérer erreur de lecture fichier', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            const config = pluginRegistry.loadPluginConfig();

            expect(config).toEqual({ plugins: {} });
        });
    });

    describe('savePluginConfig', () => {
        test('doit sauvegarder config', () => {
            const config = { plugins: { 'test-plugin': { enabled: true } } };

            pluginRegistry.savePluginConfig(config);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                pluginRegistry.configPath,
                JSON.stringify(config, null, 2)
            );
        });

        test('doit formater JSON avec indentation', () => {
            const config = { plugins: {} };

            pluginRegistry.savePluginConfig(config);

            const savedContent = fs.writeFileSync.mock.calls[0][1];
            expect(savedContent).toContain('\n');
        });

        test('doit gérer erreur d\'écriture', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            pluginRegistry.savePluginConfig({ plugins: {} });

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la sauvegarde')
            );
        });
    });

    describe('register', () => {
        test('doit enregistrer un plugin', () => {
            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            expect(pluginRegistry.plugins.has('test-plugin')).toBe(true);
            expect(pluginRegistry.plugins.get('test-plugin')).toBe(mockPlugin);
        });

        test('doit sauvegarder config après enregistrement', () => {
            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('doit ajouter plugin à la config', () => {
            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['test-plugin']).toMatchObject({
                path: '/path/to/plugin',
                version: '1.0.0',
                enabled: true
            });
        });

        test('doit ajouter timestamp installedAt', () => {
            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['test-plugin'].installedAt).toBeDefined();
        });

        test('doit afficher message de succès', () => {
            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Plugin test-plugin enregistre')
            );
        });

        test('doit préserver plugins existants', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({
                plugins: { 'existing-plugin': { enabled: true } }
            }));

            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['existing-plugin']).toBeDefined();
            expect(savedConfig.plugins['test-plugin']).toBeDefined();
        });

        test('doit créer config.plugins si absent', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({}));

            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins).toBeDefined();
            expect(savedConfig.plugins['test-plugin']).toBeDefined();
        });
    });

    describe('loadAllPlugins', () => {
        test('doit retourner sans charger si config.plugins absent', () => {
            const loadPluginConfigSpy = jest
                .spyOn(pluginRegistry, 'loadPluginConfig')
                .mockReturnValue({});
            const loadPluginSpy = jest.spyOn(pluginRegistry, 'loadPlugin').mockImplementation(() => null);

            pluginRegistry.loadAllPlugins();

            expect(loadPluginConfigSpy).toHaveBeenCalled();
            expect(loadPluginSpy).not.toHaveBeenCalled();
        });

        test('doit charger uniquement les plugins actifs', () => {
            jest.spyOn(pluginRegistry, 'loadPluginConfig').mockReturnValue({
                plugins: {
                    actif: { enabled: true },
                    inactif: { enabled: false }
                }
            });
            const loadPluginSpy = jest.spyOn(pluginRegistry, 'loadPlugin').mockImplementation(() => null);

            pluginRegistry.loadAllPlugins();

            expect(loadPluginSpy).toHaveBeenCalledTimes(1);
            expect(loadPluginSpy).toHaveBeenCalledWith('actif');
        });
    });

    describe('unregister', () => {
        beforeEach(() => {
            pluginRegistry.plugins.set('test-plugin', mockPlugin);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                plugins: { 'test-plugin': { enabled: true } }
            }));
        });

        test('doit supprimer plugin de la Map', () => {
            pluginRegistry.unregister('test-plugin');

            expect(pluginRegistry.plugins.has('test-plugin')).toBe(false);
        });

        test('doit supprimer plugin de la config', () => {
            pluginRegistry.unregister('test-plugin');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['test-plugin']).toBeUndefined();
        });

        test('doit afficher message', () => {
            pluginRegistry.unregister('test-plugin');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('desenregistre')
            );
        });

        test('doit gérer plugin inexistant', () => {
            pluginRegistry.unregister('non-existent');

            // Ne doit pas crasher
            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('loadPlugin', () => {
        beforeEach(() => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('plugin.json')) {
                    return JSON.stringify({
                        name: 'test-plugin',
                        version: '1.0.0',
                        main: 'index.js'
                    });
                }
                return '{}';
            });
        });

        test('doit retourner null si manifest inexistant', () => {
            fs.existsSync.mockImplementation((filePath) => {
                return !filePath.includes('plugin.json');
            });

            const plugin = pluginRegistry.loadPlugin('test-plugin');

            expect(plugin).toBeNull();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Manifest non trouve')
            );
        });

        test('doit retourner null si point d\'entrée inexistant', () => {
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.includes('plugin.json')) return true;
                if (filePath.includes('index.js')) return false;
                return false;
            });

            const plugin = pluginRegistry.loadPlugin('test-plugin');

            expect(plugin).toBeNull();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Point d\'entree non trouve')
            );
        });

        test('doit gérer erreur de chargement', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Load error');
            });

            const plugin = pluginRegistry.loadPlugin('test-plugin');

            expect(plugin).toBeNull();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors du chargement'),
                expect.stringContaining('Load error')
            );
        });

        test('doit charger un plugin valide', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('plugin.json')) {
                    return JSON.stringify({
                        name: 'loaded-plugin',
                        version: '1.0.0',
                        main: '../../tests/fixtures/mockLoadedPlugin.js'
                    });
                }
                return '{}';
            });

            const plugin = pluginRegistry.loadPlugin('example-plugin');

            expect(plugin).toBeDefined();
            expect(plugin.name).toBe('loaded-plugin');
            expect(pluginRegistry.plugins.get('loaded-plugin')).toBe(plugin);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Plugin loaded-plugin charge')
            );
        });
    });

    describe('enablePlugin', () => {
        beforeEach(() => {
            fs.readFileSync.mockReturnValue(JSON.stringify({
                plugins: { 
                    'test-plugin': { 
                        enabled: false,
                        version: '1.0.0' 
                    } 
                }
            }));
        });

        test('doit activer plugin dans config', () => {
            pluginRegistry.enablePlugin('test-plugin');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['test-plugin'].enabled).toBe(true);
        });

        test('doit activer plugin existant dans Map', () => {
            mockPlugin.enabled = false;
            pluginRegistry.plugins.set('test-plugin', mockPlugin);

            pluginRegistry.enablePlugin('test-plugin');

            expect(mockPlugin.enabled).toBe(true);
        });

        test('doit afficher message de succès', () => {
            pluginRegistry.enablePlugin('test-plugin');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Plugin test-plugin active')
            );
        });

        test('doit afficher erreur si plugin non trouvé', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({ plugins: {} }));

            pluginRegistry.enablePlugin('unknown-plugin');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('non trouve')
            );
        });
    });

    describe('disablePlugin', () => {
        beforeEach(() => {
            fs.readFileSync.mockReturnValue(JSON.stringify({
                plugins: { 
                    'test-plugin': { 
                        enabled: true,
                        version: '1.0.0' 
                    } 
                }
            }));
            pluginRegistry.plugins.set('test-plugin', mockPlugin);
        });

        test('doit désactiver plugin dans config', () => {
            pluginRegistry.disablePlugin('test-plugin');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['test-plugin'].enabled).toBe(false);
        });

        test('doit désactiver plugin dans Map', () => {
            pluginRegistry.disablePlugin('test-plugin');

            expect(mockPlugin.enabled).toBe(false);
        });

        test('doit continuer même si plugin non chargé dans la Map', () => {
            pluginRegistry.plugins.delete('test-plugin');

            pluginRegistry.disablePlugin('test-plugin');

            const savedConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
            expect(savedConfig.plugins['test-plugin'].enabled).toBe(false);
        });

        test('doit afficher message', () => {
            pluginRegistry.disablePlugin('test-plugin');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('desactive')
            );
        });

        test('doit afficher erreur si plugin non trouvé', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({ plugins: {} }));

            pluginRegistry.disablePlugin('unknown-plugin');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('non trouve')
            );
        });
    });

    describe('get', () => {
        test('doit retourner plugin si existe', () => {
            pluginRegistry.plugins.set('test-plugin', mockPlugin);

            const plugin = pluginRegistry.get('test-plugin');

            expect(plugin).toBe(mockPlugin);
        });

        test('doit retourner null si inexistant', () => {
            const plugin = pluginRegistry.get('non-existent');

            expect(plugin).toBeNull();
        });
    });

    describe('listAll', () => {
        test('doit retourner tous les plugins', () => {
            pluginRegistry.plugins.set('plugin1', mockPlugin);
            pluginRegistry.plugins.set('plugin2', { ...mockPlugin, name: 'plugin2' });

            const plugins = pluginRegistry.listAll();

            expect(plugins).toHaveLength(2);
            expect(Array.isArray(plugins)).toBe(true);
        });

        test('doit retourner array vide si aucun plugin', () => {
            const plugins = pluginRegistry.listAll();

            expect(plugins).toEqual([]);
        });
    });

    describe('listActive', () => {
        test('doit retourner uniquement plugins actifs', () => {
            const enabledPlugin = { ...mockPlugin, enabled: true };
            const disabledPlugin = { ...mockPlugin, name: 'disabled', enabled: false };

            pluginRegistry.plugins.set('enabled', enabledPlugin);
            pluginRegistry.plugins.set('disabled', disabledPlugin);

            const active = pluginRegistry.listActive();

            expect(active).toHaveLength(1);
            expect(active[0].name).toBe('test-plugin');
        });

        test('doit retourner array vide si aucun plugin actif', () => {
            const disabledPlugin = { ...mockPlugin, enabled: false };
            pluginRegistry.plugins.set('disabled', disabledPlugin);

            const active = pluginRegistry.listActive();

            expect(active).toEqual([]);
        });

        test('doit retourner array si aucun plugin du tout', () => {
            const active = pluginRegistry.listActive();

            expect(active).toEqual([]);
        });
    });

    describe('getPluginInfo', () => {
        test('doit retourner info du plugin', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({
                plugins: {
                    'test-plugin': {
                        path: '/path',
                        version: '1.0.0',
                        enabled: true
                    }
                }
            }));

            const info = pluginRegistry.getPluginInfo('test-plugin');

            expect(info).toMatchObject({
                path: '/path',
                version: '1.0.0',
                enabled: true
            });
        });

        test('doit retourner null si plugin inexistant', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({ plugins: {} }));

            const info = pluginRegistry.getPluginInfo('unknown');

            expect(info).toBeNull();
        });

        test('doit retourner null si config.plugins undefined', () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({}));

            const info = pluginRegistry.getPluginInfo('test-plugin');

            expect(info).toBeNull();
        });
    });

    describe('module singleton', () => {
        test('doit être une instance unique', () => {
            const instance1 = require('../../src/core/plugins/pluginRegistry');
            const instance2 = require('../../src/core/plugins/pluginRegistry');

            expect(instance1).toBe(instance2);
        });
    });

    describe('intégration', () => {
        test('workflow complet d\'enregistrement et activation', () => {
            let persistedConfig = { plugins: {} };
            fs.readFileSync.mockImplementation(() => JSON.stringify(persistedConfig));
            fs.writeFileSync.mockImplementation((filePath, content) => {
                persistedConfig = JSON.parse(content);
            });

            // Register
            pluginRegistry.register(mockPlugin, '/path/to/plugin', '1.0.0');
            expect(pluginRegistry.plugins.has('test-plugin')).toBe(true);

            // Disable
            pluginRegistry.disablePlugin('test-plugin');
            expect(mockPlugin.enabled).toBe(false);

            // Enable
            pluginRegistry.enablePlugin('test-plugin');
            expect(mockPlugin.enabled).toBe(true);

            // Get info
            const info = pluginRegistry.getPluginInfo('test-plugin');
            expect(info).toBeDefined();

            // Unregister
            pluginRegistry.unregister('test-plugin');
            expect(pluginRegistry.plugins.has('test-plugin')).toBe(false);
        });
    });
});
