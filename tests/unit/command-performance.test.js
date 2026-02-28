jest.mock('../../src/core/performance/performanceAnalyzer');
jest.mock('../../src/core/performance/metricsCollector');

const performanceCommand = require('../../src/cli/command/performance');
const performanceAnalyzer = require('../../src/core/performance/performanceAnalyzer');
const metricsCollector = require('../../src/core/performance/metricsCollector');

describe('CLI Command - performance', () => {
    let consoleLogSpy;
    let processExitSpy;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    test('doit avoir les bonnes métadonnées', () => {
        expect(performanceCommand.name).toBe('performance');
        expect(performanceCommand.description).toBeDefined();
        expect(performanceCommand.options).toBeDefined();
        expect(performanceCommand.action).toBeInstanceOf(Function);
    });

    test('doit avoir les bonnes options', () => {
        expect(performanceCommand.options).toHaveLength(3);
        expect(performanceCommand.options[0].flags).toContain('--analyze');
        expect(performanceCommand.options[1].flags).toContain('--compare');
        expect(performanceCommand.options[2].flags).toContain('--reset');
    });

    describe('action reset', () => {
        test('doit réinitialiser les métriques avec --reset', async () => {
            await performanceCommand.action({ reset: true });

            expect(metricsCollector.reset).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('réinitialisées'));
        });

        test('ne doit pas appeler analyze ou compare avec --reset', async () => {
            await performanceCommand.action({ reset: true });

            expect(performanceAnalyzer.analyze).not.toHaveBeenCalled();
            expect(performanceAnalyzer.compare).not.toHaveBeenCalled();
        });
    });

    describe('action compare', () => {
        test('doit comparer avec rapport précédent avec --compare', async () => {
            const reportPath = '/path/to/report.json';
            await performanceCommand.action({ compare: reportPath });

            expect(performanceAnalyzer.compare).toHaveBeenCalledWith(reportPath);
        });

        test('ne doit pas appeler analyze ou reset avec --compare', async () => {
            await performanceCommand.action({ compare: '/path/to/report.json' });

            expect(performanceAnalyzer.analyze).not.toHaveBeenCalled();
            expect(metricsCollector.reset).not.toHaveBeenCalled();
        });
    });

    describe('action analyze', () => {
        test('doit analyser les performances avec --analyze', async () => {
            performanceAnalyzer.analyze.mockResolvedValue({});
            await performanceCommand.action({ analyze: true });

            expect(performanceAnalyzer.analyze).toHaveBeenCalled();
        });

        test('ne doit pas appeler compare ou reset avec --analyze', async () => {
            performanceAnalyzer.analyze.mockResolvedValue({});
            await performanceCommand.action({ analyze: true });

            expect(performanceAnalyzer.compare).not.toHaveBeenCalled();
            expect(metricsCollector.reset).not.toHaveBeenCalled();
        });
    });

    describe('sans options', () => {
        test('doit afficher message d\'aide si aucune option', async () => {
            await performanceCommand.action({});

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('--help')
            );
        });

        test('ne doit appeler aucune action si aucune option', async () => {
            await performanceCommand.action({});

            expect(performanceAnalyzer.analyze).not.toHaveBeenCalled();
            expect(performanceAnalyzer.compare).not.toHaveBeenCalled();
            expect(metricsCollector.reset).not.toHaveBeenCalled();
        });
    });

    describe('gestion des erreurs', () => {
        test('doit gérer erreur lors de analyze', async () => {
            performanceAnalyzer.analyze.mockRejectedValue(new Error('Analyze failed'));

            await performanceCommand.action({ analyze: true });

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur'),
                expect.stringContaining('Analyze failed')
            );
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });

        test('doit gérer erreur lors de compare', async () => {
            performanceAnalyzer.compare.mockImplementation(() => {
                throw new Error('Compare failed');
            });

            await performanceCommand.action({ compare: '/path/to/report.json' });

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur'),
                expect.stringContaining('Compare failed')
            );
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });

        test('doit gérer erreur lors de reset', async () => {
            metricsCollector.reset.mockImplementation(() => {
                throw new Error('Reset failed');
            });

            await performanceCommand.action({ reset: true });

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erreur'),
                expect.stringContaining('Reset failed')
            );
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });

    describe('priorité des options', () => {
        test('reset doit avoir priorité sur compare', async () => {
            await performanceCommand.action({ reset: true, compare: '/path/to/report.json' });

            expect(metricsCollector.reset).toHaveBeenCalled();
            expect(performanceAnalyzer.compare).not.toHaveBeenCalled();
        });

        test('reset doit avoir priorité sur analyze', async () => {
            await performanceCommand.action({ reset: true, analyze: true });

            expect(metricsCollector.reset).toHaveBeenCalled();
            expect(performanceAnalyzer.analyze).not.toHaveBeenCalled();
        });

        test('compare doit avoir priorité sur analyze', async () => {
            const reportPath = '/path/to/report.json';
            await performanceCommand.action({ compare: reportPath, analyze: true });

            expect(performanceAnalyzer.compare).toHaveBeenCalledWith(reportPath);
            expect(performanceAnalyzer.analyze).not.toHaveBeenCalled();
        });
    });
});
