// const { getChalk } = require('../../utils/chalk-wrapper');
// const chalk = getChalk();

/**
 * Collecteur de métriques de performance
 */
class MetricsCollector {
    constructor() {
        this.metrics = {
            validation: [],
            hooks: [],
            linting: [],
            tests: []
        };
        this.startTime = null;
    }

    /**
     * Démarre la collecte
     */
    start() {
        this.startTime = Date.now();
    }

    /**
     * Enregistre une métrique de validation
     * @param {Object} metric - Métrique à enregistrer
     */
    recordValidation(metric) {
        this.metrics.validation.push({
            ...metric,
            timestamp: Date.now()
        });
    }

    /**
     * Enregistre une métrique de hook
     * @param {string} hookName - Nom du hook
     * @param {number} duration - Durée en ms
     * @param {boolean} success - Succès ou échec
     */
    recordHook(hookName, duration, success) {
        this.metrics.hooks.push({
            name: hookName,
            duration,
            success,
            timestamp: Date.now()
        });
    }

    /**
     * Enregistre une métrique de linting
     * @param {Object} metric - Métrique de linting
     */
    recordLinting(metric) {
        this.metrics.linting.push({
            ...metric,
            timestamp: Date.now()
        });
    }

    /**
     * Calcule les statistiques
     * @returns {Object} - Statistiques calculées
     */
    getStatistics() {
        return {
            totalDuration: Date.now() - this.startTime,
            validation: this.calculateStats(this.metrics.validation),
            hooks: this.calculateStats(this.metrics.hooks),
            linting: this.calculateStats(this.metrics.linting)
        };
    }

    /**
     * Calcule les stats pour un ensemble de métriques
     * @param {Array} metrics - Métriques
     * @returns {Object} - Stats calculées
     */
    calculateStats(metrics) {
        if (metrics.length === 0) return { count: 0 };

        const durations = metrics.map((m) => m.duration).filter((d) => d !== undefined);

        return {
            count: metrics.length,
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
            minDuration: Math.min(...durations) || 0,
            maxDuration: Math.max(...durations) || 0,
            successRate: (metrics.filter((m) => m.success !== false).length / metrics.length) * 100
        };
    }

    /**
     * Réinitialise les métriques
     */
    reset() {
        this.metrics = {
            validation: [],
            hooks: [],
            linting: [],
            tests: []
        };
        this.startTime = null;
    }
}

module.exports = new MetricsCollector();
