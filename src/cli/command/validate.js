<<<<<<< HEAD
const { default: chalk } = require('chalk');
const { validateCode } = require('../../core/validator');
const errorCMD = require('../../core/errorCMD');
=======
const { validateCode } = require('../../core/validator');
const errorCMD = require('../../core/errorCMD');
const { getChalk } = require('../../utils/chalk-wrapper');
>>>>>>> feat/tests

module.exports = {
    name: 'validate',
    description: 'Valider le code actuel',
    arguments: [{ name: '[message]', descirption: 'message du commit pour commit-hooks' }],
    options: [
        {
            flags: '-S, --strict',
            description: 'mode strict avec échec sur les warnings'
        },
        {
            flags: '-f, --fix',
            description: 'corriger automatiquement les erreurs fixables'
        },
        {
            flags: '-v, --verbose',
            description: 'mode verbeux avec plus de détails'
        },
        {
            flags: '--hooks <hook>',
            description: 'spécifier les hooks à valider (comma-separated)'
        },
        {
            flags: '-s, --silent',
            description: "mode silencieux, aucune sortie sauf en cas d'erreur"
        }
    ],
    action: async (argument, options) => {
<<<<<<< HEAD
=======
        const chalk = getChalk();
>>>>>>> feat/tests
        if (!options.silent) console.log(chalk.blue('🔍 Validation en cours...'));
        try {
            const result = await validateCode(argument, options);

            if (result.success) {
                if (!options.silent) console.log(chalk.green('✅ Validation réussie!'));
                process.exit(0);
            } else {
                console.log(chalk.red('❌ Validation échouée'));
                console.log(chalk.yellow('📋 Erreurs:'));

                result.errors.forEach((error, index) => {
                    console.log(chalk.red(`${index + 1}. ${error}`));
                });

                process.exit(1);
            }
        } catch (error) {
            errorCMD(error);
        }
    }
};
