const readline = require('readline');
const path = require('path');
const fs = require('fs');
const { Command } = require('commander');
const execWrapper = require('../../utils/exec-wrapper');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

// Créer un programme commander pour traiter les commandes du shell
function createCommanderProgram() {
    const program = new Command();

    const commandsDir = path.join(__dirname);
    fs.readdirSync(commandsDir)
        .filter((file) => file.endsWith('.js') && file !== 'shell.js')
        .forEach((file) => {
            try {
                const command = require(path.join(commandsDir, file));
                const cmd = program.command(command.name).description(command.description);

                if (command.arguments) command.arguments.forEach((arg) => cmd.argument(arg.name, arg.description));

                if (command.options) command.options.forEach((opt) => cmd.option(opt.flags, opt.description));

                cmd.action(command.action);
            } catch (e) {
                // Ignorer les fichiers qui ne peuvent pas être chargés
            }
        });

    return program;
}

module.exports = {
    name: 'shell',
    description: 'Lance un shell interactif push-guardian (évite le rechargement des plugins)',
    options: [],
    action: async () => {
        await startInteractiveShell();
    }
};

/**
 * Lance le shell interactif push-guardian
 */
async function startInteractiveShell() {
    console.log(chalk.bold.cyan('\n🛡️  push-guardian Interactive Shell\n'));
    console.log(chalk.gray('Tapez "help" pour voir les commandes disponibles'));
    console.log(chalk.gray('Tapez "exit" ou "quit" pour quitter\n'));

    const program = createCommanderProgram();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.cyan('push-guardian> '),
        completer: completer
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            rl.prompt();
            return;
        }

        if (trimmedLine === 'exit' || trimmedLine === 'quit') {
            console.log(chalk.yellow('\n👋 Au revoir!\n'));
            rl.close();
            return;
        }

        if (trimmedLine === 'clear' || trimmedLine === 'cls') {
            console.clear();
            rl.prompt();
            return;
        }

        if (trimmedLine === 'help' || trimmedLine === '?') {
            displayHelp();
            rl.prompt();
            return;
        }

        await executeCommand(program, trimmedLine);
        rl.prompt();
    });

    rl.on('close', () => {
        process.exit(0);
    });
}

/**
 * Exécute une commande dans le shell
 */
async function executeCommand(program, input) {
    // Intercepter les appels à process.exit() pour éviter de terminer le shell
    const originalExit = process.exit;
    process.exit = (code) => {
        // Ne pas terminer le processus, juste retourner
        return;
    };

    // Rediriger stderr pour capturer les messages d'erreur de commander
    const originalStderr = process.stderr.write;
    let stderrOutput = '';
    process.stderr.write = (chunk, encoding, callback) => {
        stderrOutput += chunk.toString();
        return true;
    };

    try {
        // Convertir la ligne en argv pour commander (sans 'node' et 'push-guardian')
        const argv = input.split(/\s+/);

        // Parser et exécuter avec commander
        // On crée un clone du program car parseAsync modifie son état
        const tempProgram = new Command();
        tempProgram.exitOverride(); // Empêcher commander d'appeler process.exit()

        // Copier toutes les commandes au nouveau programme
        program.commands.forEach((cmd) => {
            tempProgram.addCommand(cmd);
        });

        await tempProgram.parseAsync(argv, { from: 'user' });
        stderrOutput = ''; // Réinitialiser s'il n'y a pas d'erreur
    } catch (error) {
        // Si ce n'est pas une commande push-guardian (unknown command), essayer une commande bash
        if (error.code === 'commander.unknownCommand' || stderrOutput.includes('unknown command')) {
            await executeSystemCommand(input);
        } else if (error.code && error.code !== 'commander.helpDisplayed') {
            // Afficher l'erreur seulement si ce n'est pas une erreur de commande inconnue ou d'aide
            if (stderrOutput && !stderrOutput.includes('Help:')) {
                console.log(chalk.red('Erreur:'), stderrOutput.trim());
            } else if (error.message && !error.message.includes('Help:')) {
                console.log(chalk.red('Erreur:'), error.message);
            }
        }
    } finally {
        // Restaurer stderr original
        process.stderr.write = originalStderr;
        // Restaurer le process.exit original
        process.exit = originalExit;
    }
}

/**
 * Exécute une commande système (bash)
 */
async function executeSystemCommand(command) {
    try {
        const result = await execWrapper(command, { shell: true });

        if (result.stdout) {
            console.log(result.stdout.trim());
        }

        if (result.stderr) {
            console.error(chalk.yellow(result.stderr.trim()));
        }
    } catch (error) {
        console.log(chalk.red(`Commande bash échouée: ${error.message}`));
    }
}

/**
 * Autocomplétion des commandes
 */
function completer(line) {
    const commands = [
        'validate',
        'plugin',
        'mirror',
        'security',
        'performance',
        'config',
        'help',
        'exit',
        'quit',
        'clear',
        'cls'
    ];

    const pluginSubcommands = ['list', 'commands', 'run', 'enable', 'disable'];
    const securitySubcommands = ['scan', 'audit', 'check'];
    const performanceSubcommands = ['analyze', 'report'];
    const configSubcommands = ['show', 'set', 'get'];

    const parts = line.split(/\s+/);

    if (parts.length === 1) {
        const hits = commands.filter((c) => c.startsWith(line));
        return [hits.length ? hits : commands, line];
    }

    if (parts.length === 2) {
        const [cmd] = parts;
        const subcommandMap = {
            plugin: pluginSubcommands,
            security: securitySubcommands,
            performance: performanceSubcommands,
            config: configSubcommands
        };

        const subcommands = subcommandMap[cmd] || [];
        const hits = subcommands.filter((sc) => sc.startsWith(parts[1]));
        return [hits.length ? hits : subcommands, parts[1]];
    }

    return [[], line];
}

/**
 * Affiche l'aide
 */
function displayHelp() {
    console.log(chalk.bold('\nCommandes disponibles:\n'));
    console.log(chalk.green('  validate') + '              - Valide le code et la configuration');
    console.log(
        chalk.green('  plugin <action>') + '       - Gestion des plugins (list, commands, run, enable, disable)'
    );
    console.log(chalk.green('  mirror') + '                - Synchronisation miroir multi-plateformes');
    console.log(chalk.green('  security <action>') + '     - Audit de sécurité (scan, audit, check)');
    console.log(chalk.green('  performance <action>') + '  - Analyse de performance (analyze, report)');
    console.log(chalk.green('  config <action>') + '       - Gestion de la configuration (show, set, get)');
    console.log();
    console.log(chalk.bold('Commandes shell:\n'));
    console.log(chalk.green('  help, ?') + '              - Affiche cette aide');
    console.log(chalk.green('  clear, cls') + "           - Efface l'écran");
    console.log(chalk.green('  exit, quit') + '           - Quitte le shell interactif');
    console.log();
    console.log(chalk.gray('💡 Toute autre commande sera exécutée comme une commande bash (ex: ls, pwd, git status)'));
    console.log();
}
