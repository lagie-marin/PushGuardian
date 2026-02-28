const fs = require('fs');
const path = require('path');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

/**
 * Registre central des plugins PushGuardian v2
 * Gère l'installation, le chargement et la configuration des plugins
 */
class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.configPath = path.join(process.cwd(), '.pushguardian-plugins.json');
        this.pluginsDir = path.join(process.cwd(), 'plugins');
        this.loadAllPlugins();
    }

    /**
     * Charge la configuration des plugins
     * @returns {Object}
     */
    loadPluginConfig() {
        if (fs.existsSync(this.configPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } catch {
                console.log(chalk.yellow('Erreur lors du chargement de la config plugins'));
                return { plugins: {} };
            }
        }
        return { plugins: {} };
    }

    /**
     * Sauvegarde la configuration des plugins
     * @param {Object} config - Configuration à sauvegarder
     */
    savePluginConfig(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch {
            console.log(chalk.red('Erreur lors de la sauvegarde de la config plugins'));
        }
    }

    /**
     * Enregistre un plugin
     * @param {BasePlugin} plugin - Instance du plugin
     * @param {string} pluginPath - Chemin du plugin
     * @param {string} version - Version du plugin
     */
    register(plugin, pluginPath, version) {
        this.plugins.set(plugin.name, plugin);

        const config = this.loadPluginConfig();
        config.plugins = config.plugins || {};
        config.plugins[plugin.name] = {
            path: pluginPath,
            version: version,
            enabled: true,
            installedAt: new Date().toISOString()
        };
        this.savePluginConfig(config);

        console.log(chalk.green(`Plugin ${plugin.name} enregistre`));
    }

    /**
     * Désenregistre un plugin
     * @param {string} pluginName - Nom du plugin
     */
    unregister(pluginName) {
        this.plugins.delete(pluginName);

        const config = this.loadPluginConfig();
        if (config.plugins && config.plugins[pluginName]) {
            delete config.plugins[pluginName];
            this.savePluginConfig(config);
        }

        console.log(chalk.yellow(`Plugin ${pluginName} desenregistre`));
    }

    /**
     * Charge un plugin depuis son répertoire
     * @param {string} pluginPath - Chemin du plugin
     * @returns {BasePlugin|null}
     */
    loadPlugin(pluginPath) {
        try {
            const absolutePath = path.resolve(this.pluginsDir, pluginPath);
            const manifestPath = path.join(absolutePath, 'plugin.json');

            if (!fs.existsSync(manifestPath)) {
                console.log(chalk.red(`Manifest non trouve: ${manifestPath}`));
                return null;
            }

            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const entryPoint = path.join(absolutePath, manifest.main || 'index.js');

            if (!fs.existsSync(entryPoint)) {
                console.log(chalk.red(`Point d'entree non trouve: ${entryPoint}`));
                return null;
            }

            delete require.cache[require.resolve(entryPoint)];
            const PluginClass = require(entryPoint);
            const plugin = new PluginClass(manifest);

            this.plugins.set(plugin.name, plugin);
            console.log(chalk.green(`Plugin ${plugin.name} charge`));

            return plugin;
        } catch (error) {
            console.log(chalk.red(`Erreur lors du chargement du plugin:`), error.message);
            return null;
        }
    }

    /**
     * Charge tous les plugins installés
     */
    loadAllPlugins() {
        const config = this.loadPluginConfig();
        if (!config.plugins) return;

        Object.entries(config.plugins).forEach(([name, info]) => {
            if (info.enabled) {
                this.loadPlugin(name);
            }
        });
    }

    /**
     * Active un plugin
     * @param {string} pluginName - Nom du plugin
     */
    enablePlugin(pluginName) {
        const config = this.loadPluginConfig();
        if (config.plugins && config.plugins[pluginName]) {
            config.plugins[pluginName].enabled = true;
            this.savePluginConfig(config);

            const plugin = this.plugins.get(pluginName);
            if (plugin) {
                plugin.enabled = true;
            } else {
                this.loadPlugin(pluginName);
            }

            console.log(chalk.green(`Plugin ${pluginName} active`));
        } else {
            console.log(chalk.red(`Plugin ${pluginName} non trouve`));
        }
    }

    /**
     * Désactive un plugin
     * @param {string} pluginName - Nom du plugin
     */
    disablePlugin(pluginName) {
        const config = this.loadPluginConfig();
        if (config.plugins && config.plugins[pluginName]) {
            config.plugins[pluginName].enabled = false;
            this.savePluginConfig(config);

            const plugin = this.plugins.get(pluginName);
            if (plugin) {
                plugin.enabled = false;
            }

            console.log(chalk.yellow(`Plugin ${pluginName} desactive`));
        } else {
            console.log(chalk.red(`Plugin ${pluginName} non trouve`));
        }
    }

    /**
     * Récupère un plugin
     * @param {string} pluginName - Nom du plugin
     * @returns {BasePlugin|null}
     */
    get(pluginName) {
        return this.plugins.get(pluginName) || null;
    }

    /**
     * Liste tous les plugins
     * @returns {Array<BasePlugin>}
     */
    listAll() {
        return Array.from(this.plugins.values());
    }

    /**
     * Liste les plugins actifs
     * @returns {Array<BasePlugin>}
     */
    listActive() {
        return Array.from(this.plugins.values()).filter((p) => p.enabled);
    }

    /**
     * Récupère les informations d'installation d'un plugin
     * @param {string} pluginName - Nom du plugin
     * @returns {Object|null}
     */
    getPluginInfo(pluginName) {
        const config = this.loadPluginConfig();
        return config.plugins && config.plugins[pluginName] ? config.plugins[pluginName] : null;
    }
}

module.exports = new PluginRegistry();
