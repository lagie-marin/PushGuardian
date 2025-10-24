const { default: chalk } = require('chalk');
const { loadConfig } = require('../../core/configManager');
const { SyncManager } = require('../../core/mirroring/syncManager');
const { generateWorkflow } = require('../../core/mirroring/generate');
const errorCMD = require('../../core/errorCMD');
const { getEnv, loadEnv } = require('../../core/module/env-loader');

module.exports = {
    name: 'mirror',
    description: 'Référentiels miroirs sur plusieurs plateformes (GitHub, GitLab, BitBucket, Azure DevOps)',
    options: [
        { flags: '-s --source <platform>', description: 'Plateforme source (github, gitlab, bitbucket, azure)' },
        { flags: '-t --target <platform>', description: 'Plateforme cible (github, gitlab, bitbucket, azure)' },
        {
            flags: '-r --repo <name>',
            description: 'Nom du référentiel source (et cible si --target-repo non spécifié)'
        },
        { flags: '--source-repo <name>', description: 'Nom du référentiel source' },
        { flags: '--target-repo <name>', description: 'Nom du référentiel cible' },
        { flags: '--source-owner <owner>', description: 'Propriétaire du référentiel source (requis pour GitHub)' },
        { flags: '--target-owner <owner>', description: 'Propriétaire du référentiel cible (requis pour GitHub)' },
        { flags: '-S --sync-branches', description: 'Activer la synchronisation des branches' },
        { flags: '-p --public-repo', description: 'Visibilité du mirroir en public' },
        { flags: '-g --generate', description: 'Génére un workflow' }
    ],
    action: async (options) => {
        try {
            loadEnv();
            const config = loadConfig();

            if (options.generate) {
                generateWorkflow();
                return;
            }

            if (!config.mirroring) {
                console.log(chalk.red('❌ Configuration de mise en miroir manquante dans pushguardian.config.json'));
                process.exit(1);
            }

            const sourcePlatform = options.source || getEnv('SOURCE_PLATFORM');
            const targetPlatform = options.target || getEnv('TARGET_PLATFORM');
            const sourceRepo = options.sourceRepo || getEnv('SOURCE_REPO');
            const targetRepo = options.targetRepo || getEnv('TARGET_REPO');
            const sourceOwner = options.sourceOwner || getEnv('SOURCE_OWNER');
            const targetOwner = options.targetOwner || getEnv('TARGET_OWNER');

            if (!sourcePlatform || !targetPlatform || !sourceRepo || !targetRepo || !sourceOwner || !targetOwner) {
                console.log(
                    chalk.red(
                        "❌ Plateformes, repos et propriétaires source/cible requis. Spécifiez-les via options ou configurez des valeurs par défaut lors de l'installation."
                    )
                );
                process.exit(1);
            }

            const syncManager = new SyncManager(config.mirroring.platforms);
            await syncManager.mirror(
                sourcePlatform,
                targetPlatform,
                sourceRepo,
                targetRepo,
                sourceOwner,
                targetOwner,
                options.syncBranches,
                options.publicRepo
            );
            console.log(chalk.green('✅ Mise en miroir terminée avec succès'));
        } catch (error) {
            errorCMD(error);
        }
    }
};
