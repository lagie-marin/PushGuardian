const metricsCollector = require('../../src/core/performance/metricsCollector');

describe('Core Performance - metricsCollector', () => {
    beforeEach(() => {
        metricsCollector.reset();
    });

    describe('construction et initialisation', () => {
        test('doit avoir les bonnes propriétés initiales', () => {
            expect(metricsCollector.metrics).toBeDefined();
            expect(metricsCollector.metrics.validation).toEqual([]);
            expect(metricsCollector.metrics.hooks).toEqual([]);
            expect(metricsCollector.metrics.linting).toEqual([]);
            expect(metricsCollector.metrics.tests).toEqual([]);
        });

        test('startTime doit être null initialement', () => {
            expect(metricsCollector.startTime).toBeNull();
        });
    });

    describe('start', () => {
        test('doit initialiser startTime', () => {
            const before = Date.now();
            metricsCollector.start();
            const after = Date.now();

            expect(metricsCollector.startTime).toBeGreaterThanOrEqual(before);
            expect(metricsCollector.startTime).toBeLessThanOrEqual(after);
        });

        test('doit mettre à jour startTime à chaque appel', () => {
            metricsCollector.start();
            const firstStart = metricsCollector.startTime;

            jest.advanceTimersByTime(100);
            metricsCollector.start();

            expect(metricsCollector.startTime).toBeGreaterThanOrEqual(firstStart);
        });
    });

    describe('recordValidation', () => {
        test('doit enregistrer une métrique de validation', () => {
            const metric = { duration: 100, success: true };
            metricsCollector.recordValidation(metric);

            expect(metricsCollector.metrics.validation).toHaveLength(1);
            expect(metricsCollector.metrics.validation[0]).toMatchObject(metric);
            expect(metricsCollector.metrics.validation[0].timestamp).toBeDefined();
        });

        test('doit ajouter timestamp à la métrique', () => {
            const before = Date.now();
            metricsCollector.recordValidation({ duration: 50 });
            const after = Date.now();

            const recorded = metricsCollector.metrics.validation[0];
            expect(recorded.timestamp).toBeGreaterThanOrEqual(before);
            expect(recorded.timestamp).toBeLessThanOrEqual(after);
        });

        test('doit pouvoir enregistrer plusieurs métriques', () => {
            metricsCollector.recordValidation({ duration: 100, success: true });
            metricsCollector.recordValidation({ duration: 200, success: false });
            metricsCollector.recordValidation({ duration: 150, success: true });

            expect(metricsCollector.metrics.validation).toHaveLength(3);
        });

        test('doit préserver toutes les propriétés de la métrique', () => {
            const metric = { 
                duration: 100, 
                success: true, 
                tool: 'eslint',
                errors: 5 
            };
            metricsCollector.recordValidation(metric);

            const recorded = metricsCollector.metrics.validation[0];
            expect(recorded.duration).toBe(100);
            expect(recorded.success).toBe(true);
            expect(recorded.tool).toBe('eslint');
            expect(recorded.errors).toBe(5);
        });
    });

    describe('recordHook', () => {
        test('doit enregistrer une métrique de hook', () => {
            metricsCollector.recordHook('pre-push', 500, true);

            expect(metricsCollector.metrics.hooks).toHaveLength(1);
            expect(metricsCollector.metrics.hooks[0]).toMatchObject({
                name: 'pre-push',
                duration: 500,
                success: true
            });
        });

        test('doit ajouter timestamp automatiquement', () => {
            const before = Date.now();
            metricsCollector.recordHook('pre-commit', 300, true);
            const after = Date.now();

            const recorded = metricsCollector.metrics.hooks[0];
            expect(recorded.timestamp).toBeGreaterThanOrEqual(before);
            expect(recorded.timestamp).toBeLessThanOrEqual(after);
        });

        test('doit gérer les hooks échoués', () => {
            metricsCollector.recordHook('pre-push', 1000, false);

            const recorded = metricsCollector.metrics.hooks[0];
            expect(recorded.success).toBe(false);
            expect(recorded.name).toBe('pre-push');
            expect(recorded.duration).toBe(1000);
        });

        test('doit enregistrer plusieurs hooks', () => {
            metricsCollector.recordHook('pre-commit', 100, true);
            metricsCollector.recordHook('pre-push', 200, true);
            metricsCollector.recordHook('commit-msg', 50, false);

            expect(metricsCollector.metrics.hooks).toHaveLength(3);
        });
    });

    describe('recordLinting', () => {
        test('doit enregistrer une métrique de linting', () => {
            const metric = { duration: 2000, files: 50 };
            metricsCollector.recordLinting(metric);

            expect(metricsCollector.metrics.linting).toHaveLength(1);
            expect(metricsCollector.metrics.linting[0]).toMatchObject(metric);
        });

        test('doit ajouter timestamp', () => {
            const before = Date.now();
            metricsCollector.recordLinting({ duration: 1500 });
            const after = Date.now();

            const recorded = metricsCollector.metrics.linting[0];
            expect(recorded.timestamp).toBeGreaterThanOrEqual(before);
            expect(recorded.timestamp).toBeLessThanOrEqual(after);
        });

        test('doit gérer propriétés personnalisées', () => {
            const metric = {
                duration: 3000,
                files: 100,
                errors: 10,
                warnings: 25,
                tool: 'eslint'
            };
            metricsCollector.recordLinting(metric);

            const recorded = metricsCollector.metrics.linting[0];
            expect(recorded).toMatchObject(metric);
        });
    });

    describe('getStatistics', () => {
        beforeEach(() => {
            metricsCollector.start();
        });

        test('doit retourner statistiques avec totalDuration', () => {
            jest.advanceTimersByTime(5000);
            const stats = metricsCollector.getStatistics();

            expect(stats.totalDuration).toBeGreaterThan(0);
            expect(stats.validation).toBeDefined();
            expect(stats.hooks).toBeDefined();
            expect(stats.linting).toBeDefined();
        });

        test('doit calculer stats pour validation', () => {
            metricsCollector.recordValidation({ duration: 100, success: true });
            metricsCollector.recordValidation({ duration: 200, success: true });

            const stats = metricsCollector.getStatistics();

            expect(stats.validation.count).toBe(2);
            expect(stats.validation.avgDuration).toBe(150);
            expect(stats.validation.minDuration).toBe(100);
            expect(stats.validation.maxDuration).toBe(200);
            expect(stats.validation.successRate).toBe(100);
        });

        test('doit calculer stats pour hooks', () => {
            metricsCollector.recordHook('pre-push', 500, true);
            metricsCollector.recordHook('pre-commit', 300, true);
            metricsCollector.recordHook('commit-msg', 200, false);

            const stats = metricsCollector.getStatistics();

            expect(stats.hooks.count).toBe(3);
            expect(stats.hooks.avgDuration).toBeCloseTo(333.33333333333337, 10);
            expect(stats.hooks.minDuration).toBe(200);
            expect(stats.hooks.maxDuration).toBe(500);
            expect(stats.hooks.successRate).toBeCloseTo(66.67, 1);
        });

        test('doit calculer stats pour linting', () => {
            metricsCollector.recordLinting({ duration: 1000, success: true });
            metricsCollector.recordLinting({ duration: 2000, success: true });

            const stats = metricsCollector.getStatistics();

            expect(stats.linting.count).toBe(2);
            expect(stats.linting.avgDuration).toBe(1500);
            expect(stats.linting.successRate).toBe(100);
        });
    });

    describe('calculateStats', () => {
        test('doit retourner count 0 pour array vide', () => {
            const stats = metricsCollector.calculateStats([]);

            expect(stats).toEqual({ count: 0 });
        });

        test('doit calculer moyenne correctement', () => {
            const metrics = [
                { duration: 100, success: true },
                { duration: 200, success: true },
                { duration: 300, success: true }
            ];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.avgDuration).toBe(200);
        });

        test('doit calculer min et max correctement', () => {
            const metrics = [
                { duration: 500, success: true },
                { duration: 100, success: true },
                { duration: 300, success: true }
            ];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.minDuration).toBe(100);
            expect(stats.maxDuration).toBe(500);
        });

        test('doit calculer taux de succès correctement', () => {
            const metrics = [
                { duration: 100, success: true },
                { duration: 200, success: false },
                { duration: 300, success: true },
                { duration: 400, success: true }
            ];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.successRate).toBe(75);
        });

        test('doit gérer métriques sans success', () => {
            const metrics = [
                { duration: 100 },
                { duration: 200 }
            ];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.successRate).toBe(100);
        });

        test('doit filtrer métriques sans duration', () => {
            const metrics = [
                { duration: 100, success: true },
                { success: true },
                { duration: 200, success: true }
            ];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.avgDuration).toBe(150);
            expect(stats.count).toBe(3); // Count total, pas juste avec duration
        });

        test('doit gérer array avec un seul élément', () => {
            const metrics = [{ duration: 100, success: true }];
            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.count).toBe(1);
            expect(stats.avgDuration).toBe(100);
            expect(stats.minDuration).toBe(100);
            expect(stats.maxDuration).toBe(100);
            expect(stats.successRate).toBe(100);
        });

        test('doit retourner durées à 0 si aucune duration n\'est fournie', () => {
            const metrics = [
                { success: true },
                { success: false }
            ];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.count).toBe(2);
            expect(stats.avgDuration).toBe(0);
            expect(stats.minDuration).toBe(Infinity);
            expect(stats.maxDuration).toBe(-Infinity);
        });

        test('doit garder min/max à 0 quand la durée vaut 0', () => {
            const metrics = [{ duration: 0, success: true }];

            const stats = metricsCollector.calculateStats(metrics);

            expect(stats.minDuration).toBe(0);
            expect(stats.maxDuration).toBe(0);
        });
    });

    describe('reset', () => {
        test('doit réinitialiser toutes les métriques', () => {
            metricsCollector.recordValidation({ duration: 100 });
            metricsCollector.recordHook('pre-push', 200, true);
            metricsCollector.recordLinting({ duration: 300 });
            metricsCollector.start();

            metricsCollector.reset();

            expect(metricsCollector.metrics.validation).toEqual([]);
            expect(metricsCollector.metrics.hooks).toEqual([]);
            expect(metricsCollector.metrics.linting).toEqual([]);
            expect(metricsCollector.metrics.tests).toEqual([]);
            expect(metricsCollector.startTime).toBeNull();
        });

        test('doit permettre nouvel enregistrement après reset', () => {
            metricsCollector.recordValidation({ duration: 100 });
            metricsCollector.reset();
            metricsCollector.recordValidation({ duration: 200 });

            expect(metricsCollector.metrics.validation).toHaveLength(1);
            expect(metricsCollector.metrics.validation[0].duration).toBe(200);
        });
    });

    describe('module singleton', () => {
        test('doit être une instance unique', () => {
            const instance1 = require('../../src/core/performance/metricsCollector');
            const instance2 = require('../../src/core/performance/metricsCollector');

            expect(instance1).toBe(instance2);
        });
    });
});
