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
        this.systemMetrics = {
            memory: {
                min: Infinity,
                max: 0,
                samples: []
            },
            cpu: {
                samples: []
            }
        };
        this.startTime = null;
        this.monitoringInterval = null;
    }

    /**
     * Démarre la collecte avec monitoring système
     */
    start() {
        this.startTime = Date.now();

        // Démarrer le monitoring des ressources système
        this.startSystemMonitoring();
    }

    /**
     * Démarre le monitoring des ressources système
     */
    startSystemMonitoring() {
        // Capturer les métriques toutes les 100ms
        this.monitoringInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            const memoryMB = memUsage.heapUsed / 1024 / 1024;

            this.systemMetrics.memory.samples.push(memoryMB);
            this.systemMetrics.memory.min = Math.min(this.systemMetrics.memory.min, memoryMB);
            this.systemMetrics.memory.max = Math.max(this.systemMetrics.memory.max, memoryMB);

            // Capturer les stats CPU si disponible
            if (process.cpuUsage) {
                const cpuUsage = process.cpuUsage();
                this.systemMetrics.cpu.samples.push(cpuUsage);
            }
        }, 100);
    }

    /**
     * Arrête le monitoring système
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Enregistre une métrique de validation
     * @param {Object} metric - Métrique à enregistrer
     */
    recordValidation(metric) {
        // Démarrer le monitoring automatiquement si pas encore démarré
        if (!this.startTime) {
            this.start();
        }

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
        // Démarrer le monitoring automatiquement si pas encore démarré
        if (!this.startTime) {
            this.start();
        }

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
        // Démarrer le monitoring automatiquement si pas encore démarré
        if (!this.startTime) {
            this.start();
        }

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
     * Récupère toutes les métriques
     * @returns {Object} - Métriques collectées
     */
    getMetrics() {
        // Arrêter le monitoring si actif
        this.stop();

        // Calculer les métriques système finales
        const systemMetrics = {
            memory: {
                min: this.systemMetrics.memory.min === Infinity ? 0 : this.systemMetrics.memory.min,
                max: this.systemMetrics.memory.max,
                avg:
                    this.systemMetrics.memory.samples.length > 0
                        ? this.systemMetrics.memory.samples.reduce((a, b) => a + b, 0) /
                          this.systemMetrics.memory.samples.length
                        : 0
            },
            threads: {
                active: process._getActiveHandles ? process._getActiveHandles().length : 0,
                resources: process.getActiveResourcesInfo ? process.getActiveResourcesInfo().length : 0
            }
        };

        return {
            ...this.metrics,
            totalDuration: this.startTime ? Date.now() - this.startTime : 0,
            system: systemMetrics,
            stats: {
                validation: this.calculateStats(this.metrics.validation),
                hooks: this.calculateStats(this.metrics.hooks),
                linting: this.calculateStats(this.metrics.linting),
                tests: this.calculateStats(this.metrics.tests)
            }
        };
    }

    /**
     * Réinitialise les métriques
     */
    reset() {
        this.stop();
        this.metrics = {
            validation: [],
            hooks: [],
            linting: [],
            tests: []
        };
        this.systemMetrics = {
            memory: {
                min: Infinity,
                max: 0,
                samples: []
            },
            cpu: {
                samples: []
            }
        };
        this.startTime = null;
    }
}

module.exports = new MetricsCollector();
