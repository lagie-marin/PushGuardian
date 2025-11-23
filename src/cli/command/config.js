const { loadConfig, saveConfig } = require('../../core/configManager');
const { getChalk } = require('../../utils/chalk-wrapper');

module.exports = {
    name: 'config',
    description: 'Gérer la configuration',
    arguments: [
        { name: '[key]', description: 'clé de configuration' },
        { name: '[value]', description: 'valeur à définir' }
    ],
    options: [{ flags: '-l, --list', description: 'lister toute la configuration' }],
    action: async (key, value, options) => {
        const chalk = getChalk();
        if (options.list) {
            const config = loadConfig();
            console.log(chalk.blue('📋 Configuration actuelle:'));
            console.log(chalk.cyan(JSON.stringify(config, null, 2)));
            return;
        }

        if (key && value) {
            const config = loadConfig();
            config[key] = value;
            saveConfig(config);
            console.log(chalk.green(`⚙️  Configuration ${key} mise à jour avec succès.`));
        } else if (key) {
            const config = loadConfig();
            console.log(chalk.blue(`📋 ${key}: ${JSON.stringify(config[key], null, 2)}`));
        } else {
            console.log(chalk.yellow('ℹ️  Spécifiez une clé ou --list'));
        }
    }
};
