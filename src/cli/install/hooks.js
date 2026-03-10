const fs = require('fs');
const path = require('path');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

function createHooksConfig() {
    const hooksConfig = {
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

    const configFilePath = 'push-guardian.config.json';

    try {
        let config = {};

        if (fs.existsSync(configFilePath)) {
            try {
                const existingContent = fs.readFileSync(configFilePath, 'utf8');
                config = JSON.parse(existingContent);
            } catch {
                config = {};
            }
        }

        config.hooks = hooksConfig.hooks;

        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
        console.log(chalk.green('📄 Configuration des hooks mise à jour avec succès.'));

        if (!config.install) config.install = {};
        config.install.hooks = true;
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
    } catch (error) {
        console.log(chalk.red('❌ Erreur lors de la création de la configuration des hooks:'), error.message);
    }
}

function installHooks(hooks = ['pre-push'], force = false) {
    const hooksDir = path.join(process.cwd(), '.git', 'hooks');

    console.log(chalk.blue('📦 Installation des hooks Git...'));

    if (!fs.existsSync(hooksDir)) {
        console.error('❌ Répertoire .git/hooks non trouvé');
        return false;
    }

    hooks.forEach((hook) => {
        const hookPath = path.join(hooksDir, hook);

        if (fs.existsSync(hookPath) && !force) {
            console.error(`⚠️  Hook ${hook} existe déjà. Use --force pour écraser`);
            return;
        }

        const hookContent = `#!/bin/sh
# push-guardian ${hook} hook
npx push-guardian validate --hooks ${hook} ${hook == 'commit-msg' ? '"$(cat "$1")"' : ''} || exit 1
`;

        try {
            fs.writeFileSync(hookPath, hookContent);
            fs.chmodSync(hookPath, '755');
            console.log(chalk.green(`✅ Hook ${hook} installé avec succès!`));
        } catch (error) {
            console.error(`❌ Erreur lors de l'installation du hook ${hook}:`, error.message);
        }
    });

    console.log(chalk.cyan('💡 Les validations se déclencheront automatiquement sur les hooks configurés.'));

    createHooksConfig();

    return true;
}

module.exports = { installHooks, createHooksConfig };
