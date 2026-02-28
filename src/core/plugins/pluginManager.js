const pluginRegistry = require('./pluginRegistry');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

/**
 * Gestionnaire de plugins v2 - Gestion des commandes uniquement
 */
class PluginManager {
    /**
     * Exécute une commande d'un plugin
     * @param {string} pluginName - Nom du plugin
     * @param {string} commandName - Nom de la commande
     * @param {Array} args - Arguments de la commande
     * @param {Object} options - Options de la commande
     * @returns {Promise<*>}
     */
    async executeCommand(pluginName, commandName, args = [], options = {}) {
        const plugin = pluginRegistry.get(pluginName);

        if (!plugin) {
            throw new Error(`Plugin ${pluginName} non trouve`);
        }

        if (!plugin.enabled) {
            throw new Error(`Plugin ${pluginName} est desactive`);
        }

        try {
            return await plugin.executeCommand(commandName, args, options);
        } catch (error) {
            console.log(chalk.red(`Erreur lors de l'execution de ${pluginName}:${commandName}:`), error.message);
            throw error;
        }
    }

    /**
     * Liste toutes les commandes disponibles
     * @returns {Array<Object>}
     */
    listCommands() {
        const plugins = pluginRegistry.listActive();
        const commands = [];

        for (const plugin of plugins) {
            for (const [commandName, command] of plugin.commands.entries()) {
                commands.push({
                    plugin: plugin.name,
                    command: commandName,
                    description: command.description,
                    args: command.args
                });
            }
        }

        return commands;
    }

    /**
     * Affiche toutes les commandes disponibles
     */
    displayCommands() {
        const commands = this.listCommands();

        if (commands.length === 0) {
            console.log(chalk.yellow('Aucune commande disponible'));
            return;
        }

        console.log(chalk.bold('\nCommandes disponibles:\n'));

        const groupedByPlugin = {};
        commands.forEach((cmd) => {
            if (!groupedByPlugin[cmd.plugin]) {
                groupedByPlugin[cmd.plugin] = [];
            }
            groupedByPlugin[cmd.plugin].push(cmd);
        });

        for (const [pluginName, pluginCommands] of Object.entries(groupedByPlugin)) {
            console.log(chalk.cyan(`\n  ${pluginName}:`));
            pluginCommands.forEach((cmd) => {
                const argsStr = cmd.args.length > 0 ? ` <${cmd.args.join('> <')}>` : '';
                const desc = cmd.description ? ` - ${cmd.description}` : '';
                console.log(`    ${chalk.green(cmd.command)}${argsStr}${desc}`);
            });
        }

        console.log();
    }

    /**
     * Affiche les informations sur les plugins
     */
    listPlugins() {
        const config = pluginRegistry.loadPluginConfig();
        // const plugins = pluginRegistry.listAll();

        if (!config.plugins || Object.keys(config.plugins).length === 0) {
            console.log(chalk.yellow('Aucun plugin installe'));
            return;
        }

        console.log(chalk.bold('\nPlugins installes:\n'));

        // Liste basée sur la config pour montrer tous les plugins même non chargés
        for (const [name, info] of Object.entries(config.plugins)) {
            const plugin = pluginRegistry.get(name);
            const status = info.enabled ? chalk.green('[Actif]') : chalk.red('[Inactif]');
            const commandCount = plugin ? plugin.commands.size : 0;

            console.log(`  ${status} ${chalk.cyan(name)} v${info.version} - ${commandCount} commande(s)`);

            if (plugin && plugin.description) {
                console.log(`         ${chalk.gray(plugin.description)}`);
            }
        }

        console.log();
    }
}

module.exports = new PluginManager();
