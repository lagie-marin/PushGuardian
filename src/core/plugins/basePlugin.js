const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

/**
 * Classe de base pour tous les plugins push-guardian v2
 * Les plugins sont des extensions qui enregistrent des commandes personnalisées
 */
class BasePlugin {
    /**
     * Constructeur du plugin
     * @param {Object} manifest - Manifest du plugin (plugin.json)
     * @param {string} manifest.name - Nom du plugin
     * @param {string} manifest.version - Version du plugin
     * @param {string} manifest.description - Description du plugin
     * @param {string} manifest.author - Auteur du plugin
     * @param {string} manifest.main - Point d'entrée du plugin
     */
    constructor(manifest) {
        this.name = manifest.name;
        this.version = manifest.version;
        this.description = manifest.description || '';
        this.author = manifest.author || '';
        this.enabled = true;
        this.commands = new Map();
        this.manifest = manifest;
    }

    /**
     * Enregistre une commande
     * @param {string} name - Nom de la commande
     * @param {Function} handler - Fonction de traitement
     * @param {Object} options - Options de la commande
     * @param {string} options.description - Description de la commande
     * @param {Array} options.args - Arguments de la commande
     */
    registerCommand(name, handler, options = {}) {
        this.commands.set(name, {
            name,
            handler,
            description: options.description || '',
            args: options.args || []
        });
        console.log(chalk.blue(`Commande ${name} enregistree pour ${this.name}`));
    }

    /**
     * Exécute une commande
     * @param {string} commandName - Nom de la commande
     * @param {Array} args - Arguments de la commande
     * @param {Object} options - Options de la commande
     * @returns {Promise<*>}
     */
    async executeCommand(commandName, args = [], options = {}) {
        const command = this.commands.get(commandName);
        if (!command) {
            throw new Error(`Commande ${commandName} non trouvee dans ${this.name}`);
        }

        if (!this.enabled) {
            throw new Error(`Plugin ${this.name} est desactive`);
        }

        try {
            return await command.handler(args, options);
        } catch (error) {
            console.log(chalk.red(`Erreur dans ${this.name}:${commandName}:`), error.message);
            throw error;
        }
    }

    /**
     * Récupère le manifest du plugin
     * @returns {Object}
     */
    getManifest() {
        return this.manifest;
    }

    /**
     * Nettoie les ressources du plugin
     * @returns {Promise<void>}
     */
    async cleanup() {
        console.log(chalk.blue(`Nettoyage du plugin: ${this.name}`));
        this.commands.clear();
    }
}

module.exports = BasePlugin;
