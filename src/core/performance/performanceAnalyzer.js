const fs = require('fs');
const path = require('path');
const metricsCollector = require('./metricsCollector');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

/**
 * Analyseur de performance
 */
class PerformanceAnalyzer {
    constructor() {
        this.reportPath = path.join(process.cwd(), 'performance-report.json');
    }

    /**
     * Analyse les performances
     * @returns {Object} - Rapport d'analyse
     */
    async analyze() {
        console.log(chalk.blue('Analyse des performances en cours...'));

        // Démarrer la collecte de métriques
        metricsCollector.start();

        // Simuler une charge pour capturer les métriques
        await this.simulateLoad();

        const stats = metricsCollector.getStatistics();
        const report = this.generateReport(stats);

        this.saveReport(report);
        this.displayReport(report);

        return report;
    }

    /**
     * Simule une charge pour capturer les métriques système
     */
    async simulateLoad() {
        // Attendre un peu pour que le monitoring capture des métriques
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    /**
     * Génère un rapport détaillé
     * @param {Object} stats - Statistiques collectées
     * @returns {Object} - Rapport généré
     */
    generateReport(stats) {
        // Récupérer les métriques complètes avec system
        const fullMetrics = metricsCollector.getMetrics();

        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalDuration: stats.totalDuration,
                totalOperations: stats.validation.count + stats.hooks.count + stats.linting.count
            },
            system: fullMetrics.system,
            validation: stats.validation,
            hooks: stats.hooks,
            linting: stats.linting,
            recommendations: this.generateRecommendations(stats)
        };
    }

    /**
     * Génère des recommandations
     * @param {Object} stats - Statistiques
     * @returns {Array<string>} - Liste de recommandations
     */
    generateRecommendations(stats) {
        const recommendations = [];

        if (stats.totalDuration > 30000) {
            recommendations.push("  Validation lente (>30s). Considérez l'utilisation du cache.");
        }

        if (stats.hooks.avgDuration > 5000) {
            recommendations.push('  Hooks lents. Optimisez les validations de hooks.');
        }

        if (stats.linting.avgDuration > 10000) {
            recommendations.push('  Linting lent. Réduisez le nombre de fichiers ou utilisez des exclusions.');
        }

        if (stats.hooks.successRate < 80) {
            recommendations.push("  Taux d'échec élevé des hooks. Vérifiez vos configurations.");
        }

        if (recommendations.length === 0) {
            recommendations.push('Performances optimales !');
        }

        return recommendations;
    }

    /**
     * Affiche le rapport
     * @param {Object} report - Rapport à afficher
     */
    displayReport(report) {
        console.log(chalk.bold('\nRapport de Performance\n'));
        console.log(chalk.blue('─'.repeat(50)));

        console.log(chalk.bold('\nResume:'));
        console.log(`  Durée totale: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
        console.log(`  Opérations: ${report.summary.totalOperations}`);

        if (report.system) {
            console.log(chalk.bold('\nSystème:'));
            console.log(`  RAM min: ${report.system.memory.min.toFixed(2)} MB`);
            console.log(`  RAM max: ${report.system.memory.max.toFixed(2)} MB`);
            console.log(`  RAM moyenne: ${report.system.memory.avg.toFixed(2)} MB`);
            console.log(`  Threads actifs: ${report.system.threads.active}`);
            console.log(`  Ressources actives: ${report.system.threads.resources}`);
        }

        if (report.validation.count > 0) {
            console.log(chalk.bold('\nValidation:'));
            console.log(`  Nombre: ${report.validation.count}`);
            console.log(`  Durée moyenne: ${report.validation.avgDuration.toFixed(0)}ms`);
            console.log(`  Taux de succès: ${report.validation.successRate.toFixed(1)}%`);
        }

        if (report.hooks.count > 0) {
            console.log(chalk.bold('\nHooks:'));
            console.log(`  Nombre: ${report.hooks.count}`);
            console.log(`  Durée moyenne: ${report.hooks.avgDuration.toFixed(0)}ms`);
            console.log(`  Taux de succès: ${report.hooks.successRate.toFixed(1)}%`);
        }

        console.log(chalk.bold('\nRecommandations:'));
        report.recommendations.forEach((rec) => {
            console.log(`  ${rec}`);
        });

        console.log(chalk.blue('─'.repeat(50)));
        console.log(chalk.green(`\nRapport sauvegardé: ${this.reportPath}\n`));
    }

    /**
     * Sauvegarde le rapport
     * @param {Object} report - Rapport à sauvegarder
     */
    saveReport(report) {
        fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    }

    /**
     * Compare avec un rapport précédent
     * @param {string} previousReportPath - Chemin du rapport précédent
     * @returns {Object} - Comparaison
     */
    compare(previousReportPath) {
        if (!fs.existsSync(previousReportPath)) {
            console.log(chalk.yellow('Rapport précédent non trouvé'));
            return null;
        }

        const previous = JSON.parse(fs.readFileSync(previousReportPath, 'utf8'));
        const current = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));

        const comparison = {
            durationDiff: current.summary.totalDuration - previous.summary.totalDuration,
            operationsDiff: current.summary.totalOperations - previous.summary.totalOperations
        };

        console.log(chalk.bold('\nComparaison avec le rapport précédent:\n'));

        const durationChange = comparison.durationDiff > 0 ? chalk.red('+') : chalk.green('');
        console.log(`  Durée: ${durationChange}${(comparison.durationDiff / 1000).toFixed(2)}s`);

        const opsChange = comparison.operationsDiff > 0 ? '+' : '';
        console.log(`  Opérations: ${opsChange}${comparison.operationsDiff}`);

        return comparison;
    }
}

module.exports = new PerformanceAnalyzer();
