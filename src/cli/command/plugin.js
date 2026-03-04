const pluginRegistry = require('../../core/plugins/pluginRegistry');
const pluginManager = require('../../core/plugins/pluginManager');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

module.exports = {
    name: 'plugin',
    description: 'Gestion des plugins PushGuardian (list, commands, run, enable, disable, help)',
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
            await handleRun(args.slice(1), options);
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
async function handleRun(runArgs, options) {
    if (!runArgs || runArgs.length === 0) {
        console.log(chalk.red('Nom de commande requis'));
        console.log(chalk.yellow('Usage: pushguardian plugin run <commande> [args...]'));
        console.log(chalk.yellow('   ou: pushguardian plugin run <plugin> <commande> [args...]'));
        return;
    }

    let pluginName;
    let commandName;
    let args = [];

    const [firstArg, secondArg] = runArgs;
    const pluginInfo = pluginRegistry.getPluginInfo(firstArg);
    const isExplicitPluginSyntax = Boolean(secondArg) && Boolean(pluginInfo);

    if (isExplicitPluginSyntax) {
        pluginName = firstArg;
        commandName = secondArg;
        args = runArgs.slice(2);
    } else {
        commandName = firstArg;
        args = runArgs.slice(1);

        const matches = pluginManager.listCommands().filter((cmd) => cmd.command === commandName);

        if (matches.length === 0) {
            console.log(chalk.red(`Commande plugin introuvable: ${commandName}`));
            console.log(chalk.yellow('Utilisez: pushguardian plugin commands'));
            return;
        }

        if (matches.length > 1) {
            const plugins = [...new Set(matches.map((m) => m.plugin))].join(', ');
            console.log(chalk.red(`Commande ambiguë: ${commandName}`));
            console.log(chalk.yellow(`Plugins correspondants: ${plugins}`));
            console.log(chalk.yellow(`Utilisez: pushguardian plugin run <plugin> ${commandName} [args...]`));
            return;
        }

        pluginName = matches[0].plugin;
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
    console.log('  ' + chalk.green('run <cmd> [args...]') + '  - Execute une commande unique');
    console.log('  ' + chalk.green('run <plugin> <cmd>') + ' - Execute une commande de plugin');
    console.log();
}
