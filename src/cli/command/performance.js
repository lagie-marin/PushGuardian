const performanceAnalyzer = require('../../core/performance/performanceAnalyzer');
const metricsCollector = require('../../core/performance/metricsCollector');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

module.exports = {
    name: 'performance',
    description: 'Analyser les performances de push-guardian',
    options: [
        {
            flags: '-a, --analyze',
            description: 'Analyser les performances actuelles'
        },
        {
            flags: '-c, --compare <path>',
            description: 'Comparer avec un rapport précédent'
        },
        {
            flags: '-r, --report',
            description: 'Afficher le dernier rapport'
        },
        {
            flags: '--reset',
            description: 'Réinitialiser les métriques'
        },
        {
            flags: '-d, --detailed',
            description: 'Afficher les détails complets'
        },
        {
            flags: '-j, --json',
            description: 'Sortie au format JSON'
        }
    ],
    action: async (options) => {
        try {
            // Vérifier les options conflictuelles
            const actions = [options.analyze, options.compare, options.report, options.reset].filter(Boolean);
            if (actions.length > 1) {
                console.log(
                    chalk.red(
                        '❌ Options conflictuelles. Veuillez choisir une seule action: --analyze, --compare, --report ou --reset'
                    )
                );
                return;
            }

            // Si aucune option n'est fournie, afficher l'aide
            if (!options.analyze && !options.compare && !options.report && !options.reset) {
                console.log(chalk.yellow('Actions disponibles:'));
                console.log(chalk.cyan('  -a, --analyze') + '        - Analyser les performances actuelles');
                console.log(chalk.cyan('  -c, --compare <path>') + ' - Comparer avec un rapport précédent');
                console.log(chalk.cyan('  -r, --report') + '         - Afficher le dernier rapport');
                console.log(chalk.cyan('  --reset') + '            - Réinitialiser les métriques');
                console.log(chalk.gray('\nOptions supplémentaires: -d, --detailed, -j, --json'));
                console.log(chalk.gray('Exemple: npx push-guardian performance --analyze --detailed'));
                return;
            }

            // Exécuter l'action demandée
            if (options.analyze) {
                console.log(chalk.blue('📊 Analyse des performances en cours...'));
                await performanceAnalyzer.analyze(options);
                if (options.detailed) {
                    displayDetailedMetrics();
                }
            } else if (options.compare) {
                console.log(chalk.blue('📊 Comparaison des rapports...'));
                await performanceAnalyzer.compare(options.compare, options);
            } else if (options.report) {
                console.log(chalk.blue('📊 Rapport de performance actuel:'));
                displayCurrentMetrics(options);
            } else if (options.reset) {
                metricsCollector.reset();
                console.log(chalk.green('✅ Métriques réinitialisées'));
            }
        } catch (error) {
            console.log(chalk.red('❌ Erreur:'), error.message);
            process.exit(1);
        }
    }
};

/**
 * Affiche les métriques actuelles
 */
function displayCurrentMetrics(options) {
    const metrics = metricsCollector.getMetrics();

    if (options.json) {
        console.log(JSON.stringify(metrics, null, 2));
        return;
    }

    console.log(chalk.bold('\n📈 Métriques de performance:\n'));

    // Métriques système
    if (metrics.system) {
        console.log(chalk.cyan('Système:'));
        console.log(`  RAM min: ${chalk.yellow(metrics.system.memory.min.toFixed(2))} MB`);
        console.log(`  RAM max: ${chalk.yellow(metrics.system.memory.max.toFixed(2))} MB`);
        console.log(`  RAM moyenne: ${chalk.yellow(metrics.system.memory.avg.toFixed(2))} MB`);
        console.log(`  Threads actifs: ${chalk.yellow(metrics.system.threads.active)}`);
        console.log(`  Ressources actives: ${chalk.yellow(metrics.system.threads.resources)}`);
    }

    if (metrics.validation) {
        console.log(chalk.cyan('\nValidation:'));
        console.log(`  Durée: ${chalk.yellow(metrics.validation.duration || 0)}ms`);
        console.log(`  Fichiers analysés: ${chalk.yellow(metrics.validation.filesAnalyzed || 0)}`);
    }

    if (metrics.plugins) {
        console.log(chalk.cyan('\nPlugins:'));
        console.log(`  Chargés: ${chalk.yellow(metrics.plugins.loaded || 0)}`);
        console.log(`  Temps de chargement: ${chalk.yellow(metrics.plugins.loadTime || 0)}ms`);
    }

    if (metrics.git) {
        console.log(chalk.cyan('\nGit:'));
        console.log(`  Opérations: ${chalk.yellow(metrics.git.operations || 0)}`);
        console.log(`  Durée totale: ${chalk.yellow(metrics.git.duration || 0)}ms`);
    }

    // Afficher les statistiques calculées
    if (metrics.stats) {
        console.log(chalk.cyan('\nStatistiques:'));

        if (metrics.stats.validation && metrics.stats.validation.count > 0) {
            console.log(
                `  Validations: ${chalk.yellow(metrics.stats.validation.count)} (${chalk.yellow(metrics.stats.validation.successRate.toFixed(1))}% succès)`
            );
        }

        if (metrics.stats.hooks && metrics.stats.hooks.count > 0) {
            console.log(
                `  Hooks: ${chalk.yellow(metrics.stats.hooks.count)} (${chalk.yellow(metrics.stats.hooks.avgDuration.toFixed(2))}ms moy.)`
            );
        }

        if (metrics.stats.linting && metrics.stats.linting.count > 0) {
            console.log(
                `  Linting: ${chalk.yellow(metrics.stats.linting.count)} (${chalk.yellow(metrics.stats.linting.avgDuration.toFixed(2))}ms moy.)`
            );
        }
    }

    console.log();
}

/**
 * Affiche les métriques détaillées
 */
function displayDetailedMetrics() {
    const metrics = metricsCollector.getMetrics();

    console.log(chalk.bold('\n🔍 Détails des métriques:\n'));
    console.log(JSON.stringify(metrics, null, 2));
    console.log();
}
