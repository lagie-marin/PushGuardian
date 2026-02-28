const BasePlugin = require('../../src/core/plugins/basePlugin');
const { getChalk } = require('../../src/utils/chalk-wrapper');
const chalk = getChalk();

/**
 * Plugin d'exemple pour PushGuardian v2
 * Démontre comment créer un plugin avec des commandes personnalisées
 */
class ExamplePlugin extends BasePlugin {
    constructor(manifest) {
        super(manifest);
        this.setupCommands();
    }

    /**
     * Configure les commandes du plugin
     */
    setupCommands() {
        // Commande simple
        this.registerCommand('hello', async (args, options) => {
            console.log(chalk.green('Hello from Example Plugin!'));
            return 'Plugin command executed successfully';
        }, {
            description: 'Affiche un message de bienvenue',
            args: []
        });

        // Commande avec arguments
        this.registerCommand('greet', async (args, options) => {
            const name = args[0] || 'World';
            console.log(chalk.cyan(`Hello, ${name}!`));
            console.log(chalk.gray(`Message depuis ${this.name} v${this.version}`));
            return `Greeted ${name}`;
        }, {
            description: 'Salue une personne',
            args: ['name']
        });

        // Commande d'information
        this.registerCommand('info', async (args, options) => {
            console.log(chalk.bold(`\nInformations sur ${this.name}:\n`));
            console.log(`  Version: ${chalk.cyan(this.version)}`);
            console.log(`  Description: ${this.description}`);
            console.log(`  Auteur: ${this.author}`);
            console.log(`  Commandes: ${chalk.green(Array.from(this.commands.keys()).join(', '))}`);
            console.log();
            return this.getManifest();
        }, {
            description: 'Affiche les informations du plugin',
            args: []
        });
    }
}

module.exports = ExamplePlugin;
