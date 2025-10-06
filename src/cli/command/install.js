const { default: chalk } = require('chalk');
const { installHooks } = require('../install/hooks');
const interactiveMenu = require('../../core/interactiveMenu/interactiveMenu');
const { installCodeQualityTools } = require('../install/codeQualityTools');

module.exports = {
    name: 'install',
    description: 'Installer les hooks Git',
    options: [
        {
            flags: '-f, --force',
            description: "forcer l'installation même si déjà installé"
        }
    ],
    action: async (options) => {
        try {
            const selected = await interactiveMenu('Choisissez les modules à installer', [
                'Hooks Git',
                'Code Quality Tools'
            ]);

            selected.forEach((item) => {
                if (item === 'Hooks Git') installHooks(['commit-msg', 'post-checkout', 'pre-push'], options.force);
                else if (item === 'Code Quality Tools') installCodeQualityTools();
            });
        } catch (error) {
            console.error(chalk.red('❌ Une erreur est survenue :'), error.message);
        }
    }
};
