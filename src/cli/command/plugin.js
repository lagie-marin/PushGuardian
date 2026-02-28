const pluginRegistry = require('../../core/plugins/pluginRegistry');
const pluginManager = require('../../core/plugins/pluginManager');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

module.exports = {
    name: 'plugin',
    description: 'Gestion des plugins PushGuardian (list, commands, run, enable, disable)',
    arguments: [
        {
            name: '<action>',
            description: 'Action a executer (list, commands, run, enable, disable)'
        },
        { name: '[args...]', description: "Arguments de l'action" }
    ],
    action: async (action, args, options) => {
        await pluginCommand([action, ...args], options);
    }
};

/**
 * Commande de gestion des plugins
 * @param {Array} args - Arguments de la commande
 * @param {Object} options - Options de la commande
 */
async function pluginCommand(args, options) {
    const action = args[0];

    if (!action) {
        displayHelp();
        return;
    }

    switch (action) {
        case 'enable':
            await handleEnable(args[1]);
            break;

        case 'disable':
            await handleDisable(args[1]);
            break;

        case 'list':
            handleList();
            break;

        case 'commands':
            handleCommands();
            break;

        case 'run':
            await handleRun(args[1], args[2], args.slice(3), options);
            break;

        default:
            console.log(chalk.red(`Action inconnue: ${action}`));
            displayHelp();
    }
}

/**
 * Active un plugin
 */
async function handleEnable(pluginName) {
    if (!pluginName) {
        console.log(chalk.red('Nom du plugin requis'));
        console.log(chalk.yellow('Usage: pushguardian plugin enable <nom>'));
        return;
    }

    pluginRegistry.enablePlugin(pluginName);
}

/**
 * Désactive un plugin
 */
async function handleDisable(pluginName) {
    if (!pluginName) {
        console.log(chalk.red('Nom du plugin requis'));
        console.log(chalk.yellow('Usage: pushguardian plugin disable <nom>'));
        return;
    }

    pluginRegistry.disablePlugin(pluginName);
}

/**
 * Liste les plugins installés
 */
function handleList() {
    pluginManager.listPlugins();
}

/**
 * Liste les commandes disponibles
 */
function handleCommands() {
    pluginManager.displayCommands();
}

/**
 * Exécute une commande d'un plugin
 */
async function handleRun(pluginName, commandName, args, options) {
    if (!pluginName || !commandName) {
        console.log(chalk.red('Nom du plugin et de la commande requis'));
        console.log(chalk.yellow('Usage: pushguardian plugin run <plugin> <commande> [args...]'));
        return;
    }

    try {
        const result = await pluginManager.executeCommand(pluginName, commandName, args, options);
        if (result !== undefined) {
            console.log(result);
        }
    } catch (error) {
        console.log(chalk.red('Erreur:'), error.message);
    }
}

/**
 * Affiche l'aide
 */
function displayHelp() {
    console.log(chalk.bold('\nGestion des plugins PushGuardian\n'));
    console.log(chalk.cyan('Usage:') + ' pushguardian plugin <action> [options]\n');
    console.log(chalk.bold('Actions disponibles:\n'));
    console.log('  ' + chalk.green('enable <nom>') + '       - Active un plugin');
    console.log('  ' + chalk.green('disable <nom>') + '      - Desactive un plugin');
    console.log('  ' + chalk.green('list') + '               - Liste les plugins installes');
    console.log('  ' + chalk.green('commands') + '           - Liste les commandes disponibles');
    console.log('  ' + chalk.green('run <plugin> <cmd>') + ' - Execute une commande de plugin');
    console.log();
}
