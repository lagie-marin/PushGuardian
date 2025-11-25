const { installHooks } = require('../install/hooks');
const interactiveMenu = require('../../core/interactiveMenu/interactiveMenu');
const { installCodeQualityTools } = require('../install/codeQualityTools');
const { installMirroringTools } = require('../install/mirroring');
const { loadConfig } = require('../../core/configManager');
const { getChalk } = require('../../utils/chalk-wrapper');

module.exports = {
    name: 'install',
    description: 'Installer les hooks Git',
    options: [
        {
            flags: '-f, --force',
            description: "forcer l'installation même si déjà installé"
        },
        {
            flags: '-a, --all',
            description: 'installer tous les modules disponibles'
        },
        {
            flags: '--hooks',
            description: 'installer les hooks Git'
        },
        {
            flags: '--code-quality',
            description: 'installer les outils de qualité de code'
        },
        {
            flags: '--skip-hooks',
            description: 'ne pas installer les hooks Git'
        },
        {
            flags: '--skip-code-quality',
            description: 'ne pas installer les outils de qualité de code'
        },
        {
            flags: '--mirroring',
            description: 'installer le système de mirroring'
        },
        {
            flags: '--skip-mirroring',
            description: 'ne pas installer le système de mirroring'
        },
        {
            flags: '--file <path>',
            description: 'installer les modules qui se trouvent dans le fichier de configuration'
        }
    ],
    action: async (options) => {
        const chalk = getChalk();
        try {
            if (
                (options.hooks && options.skipHooks) ||
                (options.codeQuality && options.skipCodeQuality) ||
                (options.mirroring && options.skipMirroring)
            ) {
                console.log(
                    chalk.red(
                        '❌ Options conflictuelles. Veuillez vérifier vos options.\n\t\tVous ne pouvez pas utiliser --hooks et --skip-hooks, --code-quality et --skip-code-quality, ou --mirroring et --skip-mirroring simultanément.'
                    )
                );
                return;
            }

            const config = options.file ? loadConfig(options.file) : null;
            let selected = ['Hooks Git', 'Code Quality Tools', 'Mirroring'];
            let preselectedHooks = false;
            let preselectedCQT = [];
            let preselectedMirroring = false;

            if (options.file && config && config.install) {
                if (config.install.hooks === true) {
                    preselectedHooks = true;
                }
                if (config.install.CQT && Array.isArray(config.install.CQT)) {
                    preselectedCQT = config.install.CQT;
                }
                if (config.install.mirroring === true) {
                    preselectedMirroring = true;
                }
            }

            if (options.skipHooks) selected = selected.filter((item) => item !== 'Hooks Git');
            if (options.skipCodeQuality) selected = selected.filter((item) => item !== 'Code Quality Tools');
            if (options.skipMirroring) selected = selected.filter((item) => item !== 'Mirroring');
            else if (
                options.hooks ||
                options.codeQuality ||
                options.mirroring ||
                options.skipHooks ||
                options.skipCodeQuality ||
                options.skipMirroring
            ) {
                selected = [];
                if (options.hooks && !options.skipHooks) selected.push('Hooks Git');
                if (options.codeQuality && !options.skipCodeQuality) selected.push('Code Quality Tools');
                if (options.mirroring && !options.skipMirroring) selected.push('Mirroring');

                if (
                    !options.hooks &&
                    !options.codeQuality &&
                    !options.mirroring &&
                    (options.skipHooks || options.skipCodeQuality || options.skipMirroring)
                ) {
                    if (!options.skipHooks) selected.push('Hooks Git');
                    if (!options.skipCodeQuality) selected.push('Code Quality Tools');
                    if (!options.skipMirroring) selected.push('Mirroring');
                }
            } else {
                if (options.all) {
                    selected = ['Hooks Git', 'Code Quality Tools', 'Mirroring'];
                } else if (preselectedHooks || preselectedCQT.length > 0 || preselectedMirroring) {
                    selected = [];
                    if (preselectedHooks) selected.push('Hooks Git');
                    if (preselectedCQT.length > 0) selected.push('Code Quality Tools');
                    if (preselectedMirroring) selected.push('Mirroring');
                } else {
                    selected = await interactiveMenu('Choisissez les modules à installer', selected);
                }
            }

            selected.forEach((item) => {
                if (item === 'Hooks Git') installHooks(['commit-msg', 'post-checkout', 'pre-push'], options.force);
                else if (item === 'Code Quality Tools') installCodeQualityTools(options.all, preselectedCQT);
                else if (item === 'Mirroring') installMirroringTools();
            });
        } catch (error) {
            console.error(chalk.red('❌ Une erreur est survenue :'), error.message);
        }
    }
};
