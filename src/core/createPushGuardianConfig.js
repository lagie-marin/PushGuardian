const { default: chalk } = require('chalk');
const fs = require('fs');

module.exports = () => {
    const config = {
        validate: {
            directories: ['src/'],
            onMissing: 'ignore',
            activateCQT: false
        },
        hooks: {
            'commit-msg': {
                type: ['ADD', 'UPDATE', 'DELETE', 'FIX', 'MERGE', 'CHORE'],
                constraints: {
                    maxLength: 80
                }
            },
            'post-checkout': {
                type: ['main', 'develop', 'staging', 'feat', 'fix', 'chore', 'hotfixes'],
                constraints: {}
            },
            'pre-push': {}
        }
    };

    const configFilePath = 'pushguardian.config.json';

    if (fs.existsSync(configFilePath)) {
        return;
    }

    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
        console.log(chalk.green('📄 Fichier de configuration pushguardian.config.json créé avec succès.'));
    } catch (error) {
        console.log(
            chalk.red('❌ Erreur lors de la création du fichier de configuration pushguardian.config.json:'),
            error.message
        );
    }
};
