const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('../../src/core/performance/metricsCollector');

const performanceAnalyzer = require('../../src/core/performance/performanceAnalyzer');
const metricsCollector = require('../../src/core/performance/metricsCollector');

describe('Core Performance - performanceAnalyzer', () => {
    let consoleLogSpy;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.clearAllMocks();
        fs.writeFileSync.mockImplementation(() => {});
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('construction', () => {
        test('doit avoir reportPath défini', () => {
            expect(performanceAnalyzer.reportPath).toBeDefined();
            expect(performanceAnalyzer.reportPath).toContain('performance-report.json');
        });

        test('reportPath doit être dans le répertoire courant', () => {
            expect(performanceAnalyzer.reportPath).toBe(
                path.join(process.cwd(), 'performance-report.json')
            );
        });
    });

    describe('analyze', () => {
        beforeEach(() => {
            metricsCollector.getStatistics.mockReturnValue({
                totalDuration: 5000,
                validation: { count: 2, avgDuration: 150, successRate: 100 },
                hooks: { count: 3, avgDuration: 300, successRate: 100 },
                linting: { count: 1, avgDuration: 1000, successRate: 100 }
            });
        });

        test('doit analyser les performances', async () => {
            const report = await performanceAnalyzer.analyze();

            expect(report).toBeDefined();
            expect(report.timestamp).toBeDefined();
            expect(report.summary).toBeDefined();
        });

        test('doit appeler metricsCollector.getStatistics', async () => {
            await performanceAnalyzer.analyze();

            expect(metricsCollector.getStatistics).toHaveBeenCalled();
        });

        test('doit sauvegarder le rapport', async () => {
            await performanceAnalyzer.analyze();

            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('performance-report.json'),
                expect.any(String)
            );
        });

        test('doit afficher le rapport', async () => {
            await performanceAnalyzer.analyze();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Analyse des performances')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Rapport de Performance')
            );
        });

        test('doit retourner le rapport généré', async () => {
            const report = await performanceAnalyzer.analyze();

            expect(report.summary).toBeDefined();
            expect(report.validation).toBeDefined();
            expect(report.hooks).toBeDefined();
            expect(report.linting).toBeDefined();
            expect(report.recommendations).toBeDefined();
        });
    });

    describe('generateReport', () => {
        test('doit générer rapport avec timestamp', () => {
            const stats = {
                totalDuration: 5000,
                validation: { count: 2 },
                hooks: { count: 3 },
                linting: { count: 1 }
            };

            const report = performanceAnalyzer.generateReport(stats);

            expect(report.timestamp).toBeDefined();
            expect(new Date(report.timestamp)).toBeInstanceOf(Date);
        });

        test('doit inclure summary avec totalDuration', () => {
            const stats = {
                totalDuration: 8000,
                validation: { count: 2 },
                hooks: { count: 3 },
                linting: { count: 1 }
            };

            const report = performanceAnalyzer.generateReport(stats);

            expect(report.summary.totalDuration).toBe(8000);
        });

        test('doit calculer totalOperations correctement', () => {
            const stats = {
                totalDuration: 5000,
                validation: { count: 5 },
                hooks: { count: 10 },
                linting: { count: 3 }
            };

            const report = performanceAnalyzer.generateReport(stats);

            expect(report.summary.totalOperations).toBe(18);
        });

        test('doit inclure toutes les statistiques', () => {
            const stats = {
                totalDuration: 5000,
                validation: { count: 2, avgDuration: 100 },
                hooks: { count: 3, avgDuration: 200 },
                linting: { count: 1, avgDuration: 500 }
            };

            const report = performanceAnalyzer.generateReport(stats);

            expect(report.validation).toEqual(stats.validation);
            expect(report.hooks).toEqual(stats.hooks);
            expect(report.linting).toEqual(stats.linting);
        });

        test('doit générer des recommandations', () => {
            const stats = {
                totalDuration: 5000,
                validation: { count: 2 },
                hooks: { count: 3, avgDuration: 100, successRate: 100 },
                linting: { count: 1, avgDuration: 100 }
            };

            const report = performanceAnalyzer.generateReport(stats);

            expect(report.recommendations).toBeDefined();
            expect(Array.isArray(report.recommendations)).toBe(true);
        });
    });

    describe('generateRecommendations', () => {
        test('doit recommander optimisation si validation lente', () => {
            const stats = {
                totalDuration: 35000,
                hooks: { avgDuration: 1000, successRate: 90 },
                linting: { avgDuration: 2000 }
            };

            const recommendations = performanceAnalyzer.generateRecommendations(stats);

            expect(recommendations).toContainEqual(
                expect.stringContaining('lente')
            );
            expect(recommendations).toContainEqual(
                expect.stringContaining('cache')
            );
        });

        test('doit recommander optimisation hooks si lents', () => {
            const stats = {
                totalDuration: 10000,
                hooks: { avgDuration: 6000, successRate: 90 },
                linting: { avgDuration: 2000 }
            };

            const recommendations = performanceAnalyzer.generateRecommendations(stats);

            expect(recommendations.some(r => r.includes('Hooks lents'))).toBe(true);
        });

        test('doit recommander optimisation linting si lent', () => {
            const stats = {
                totalDuration: 10000,
                hooks: { avgDuration: 1000, successRate: 90 },
                linting: { avgDuration: 12000 }
            };

            const recommendations = performanceAnalyzer.generateRecommendations(stats);

            expect(recommendations.some(r => r.includes('Linting lent'))).toBe(true);
        });

        test('doit recommander vérification config si taux échec élevé', () => {
            const stats = {
                totalDuration: 10000,
                hooks: { avgDuration: 1000, successRate: 70 },
                linting: { avgDuration: 2000 }
            };

            const recommendations = performanceAnalyzer.generateRecommendations(stats);

            expect(recommendations.some(r => r.includes('échec'))).toBe(true);
        });

        test('doit retourner message optimal si aucun problème', () => {
            const stats = {
                totalDuration: 10000,
                hooks: { avgDuration: 1000, successRate: 95 },
                linting: { avgDuration: 2000 }
            };

            const recommendations = performanceAnalyzer.generateRecommendations(stats);

            expect(recommendations).toContain('Performances optimales !');
        });

        test('doit pouvoir générer plusieurs recommandations', () => {
            const stats = {
                totalDuration: 35000,
                hooks: { avgDuration: 6000, successRate: 70 },
                linting: { avgDuration: 12000 }
            };

            const recommendations = performanceAnalyzer.generateRecommendations(stats);

            expect(recommendations.length).toBeGreaterThan(1);
        });
    });

    describe('displayReport', () => {
        test('doit afficher le résumé', () => {
            const report = {
                summary: { totalDuration: 5000, totalOperations: 10 },
                validation: { count: 0 },
                hooks: { count: 0 },
                recommendations: ['Test']
            };

            performanceAnalyzer.displayReport(report);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Rapport de Performance')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Durée totale')
            );
        });

        test('doit afficher validation si présente', () => {
            const report = {
                summary: { totalDuration: 5000, totalOperations: 10 },
                validation: { count: 5, avgDuration: 100, successRate: 95 },
                hooks: { count: 0 },
                recommendations: []
            };

            performanceAnalyzer.displayReport(report);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Validation')
            );
        });

        test('doit afficher hooks si présents', () => {
            const report = {
                summary: { totalDuration: 5000, totalOperations: 10 },
                validation: { count: 0 },
                hooks: { count: 3, avgDuration: 200, successRate: 100 },
                recommendations: []
            };

            performanceAnalyzer.displayReport(report);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Hooks')
            );
        });

        test('doit afficher recommandations', () => {
            const report = {
                summary: { totalDuration: 5000, totalOperations: 10 },
                validation: { count: 0 },
                hooks: { count: 0 },
                recommendations: ['Recommendation 1', 'Recommendation 2']
            };

            performanceAnalyzer.displayReport(report);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Recommandations')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Recommendation 1')
            );
        });

        test('doit afficher chemin du rapport sauvegardé', () => {
            const report = {
                summary: { totalDuration: 5000, totalOperations: 10 },
                validation: { count: 0 },
                hooks: { count: 0 },
                recommendations: []
            };

            performanceAnalyzer.displayReport(report);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Rapport sauvegardé')
            );
        });
    });

    describe('saveReport', () => {
        test('doit sauvegarder le rapport en JSON', () => {
            const report = {
                timestamp: new Date().toISOString(),
                summary: { totalDuration: 5000 }
            };

            performanceAnalyzer.saveReport(report);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                performanceAnalyzer.reportPath,
                JSON.stringify(report, null, 2)
            );
        });

        test('doit formater JSON avec indentation', () => {
            const report = { test: 'data' };

            performanceAnalyzer.saveReport(report);

            const savedContent = fs.writeFileSync.mock.calls[0][1];
            expect(savedContent).toContain('\n');
            expect(savedContent).toBe(JSON.stringify(report, null, 2));
        });
    });

    describe('compare', () => {
        test('doit retourner null si rapport précédent inexistant', () => {
            fs.existsSync.mockReturnValue(false);

            const result = performanceAnalyzer.compare('/path/to/report.json');

            expect(result).toBeNull();
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('non trouvé')
            );
        });

        test('doit comparer avec rapport précédent', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('previous')) {
                    return JSON.stringify({
                        summary: { totalDuration: 5000, totalOperations: 10 }
                    });
                }
                return JSON.stringify({
                    summary: { totalDuration: 6000, totalOperations: 12 }
                });
            });

            const comparison = performanceAnalyzer.compare('/path/to/previous-report.json');

            expect(comparison).toBeDefined();
            expect(comparison.durationDiff).toBeDefined();
            expect(comparison.operationsDiff).toBeDefined();
        });

        test('doit calculer différence de durée', () => {
            fs.existsSync.mockReturnValue(true);
            
            const previousReport = {
                summary: { totalDuration: 5000, totalOperations: 10 }
            };
            const currentReport = {
                summary: { totalDuration: 7000, totalOperations: 12 }
            };

            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('previous') || !filePath.includes('performance-report')) {
                    return JSON.stringify(previousReport);
                }
                return JSON.stringify(currentReport);
            });

            const comparison = performanceAnalyzer.compare('/path/to/previous-report.json');

            expect(comparison.durationDiff).toBe(2000);
        });

        test('doit calculer différence d\'opérations', () => {
            fs.existsSync.mockReturnValue(true);
            
            const previousReport = {
                summary: { totalDuration: 5000, totalOperations: 10 }
            };
            const currentReport = {
                summary: { totalDuration: 5000, totalOperations: 15 }
            };

            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('previous') || !filePath.includes('performance-report')) {
                    return JSON.stringify(previousReport);
                }
                return JSON.stringify(currentReport);
            });

            const comparison = performanceAnalyzer.compare('/path/to/previous-report.json');

            expect(comparison.operationsDiff).toBe(5);
        });

        test('doit afficher comparaison', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                summary: { totalDuration: 5000, totalOperations: 10 }
            }));

            performanceAnalyzer.compare('/path/to/previous-report.json');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Comparaison')
            );
        });

        test('doit gérer amélioration de performance', () => {
            fs.existsSync.mockReturnValue(true);
            
            const previousReport = {
                summary: { totalDuration: 8000, totalOperations: 10 }
            };
            const currentReport = {
                summary: { totalDuration: 5000, totalOperations: 10 }
            };

            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('previous') || !filePath.includes('performance-report')) {
                    return JSON.stringify(previousReport);
                }
                return JSON.stringify(currentReport);
            });

            const comparison = performanceAnalyzer.compare('/path/to/previous-report.json');

            expect(comparison.durationDiff).toBe(-3000);
        });
    });

    describe('module singleton', () => {
        test('doit être une instance unique', () => {
            const instance1 = require('../../src/core/performance/performanceAnalyzer');
            const instance2 = require('../../src/core/performance/performanceAnalyzer');

            expect(instance1).toBe(instance2);
        });
    });
});
