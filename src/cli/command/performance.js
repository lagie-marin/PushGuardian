const performanceAnalyzer = require('../../core/performance/performanceAnalyzer');
const metricsCollector = require('../../core/performance/metricsCollector');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

module.exports = {
    name: 'performance',
    description: 'Analyser les performances de PushGuardian',
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
            flags: '-r, --reset',
            description: 'Réinitialiser les métriques'
        }
    ],
    action: async (options) => {
        try {
            if (options.reset) {
                metricsCollector.reset();
                console.log(chalk.green('Métriques réinitialisées'));
                return;
            }

            if (options.compare) {
                performanceAnalyzer.compare(options.compare);
                return;
            }

            if (options.analyze) {
                await performanceAnalyzer.analyze();
                return;
            }

            console.log(chalk.yellow('  Utilisez --help pour voir les options disponibles'));
        } catch (error) {
            console.log(chalk.red('Erreur:'), error.message);
            process.exit(1);
        }
    }
};
