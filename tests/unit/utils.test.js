const { getChalk } = require('../../src/utils/chalk-wrapper');

describe('Utils - chalk-wrapper', () => {
    test('getChalk doit retourner un objet chalk', () => {
        const chalk = getChalk();
        expect(chalk).toBeDefined();
        expect(typeof chalk.red).toBe('function');
        expect(typeof chalk.green).toBe('function');
        expect(typeof chalk.yellow).toBe('function');
        expect(typeof chalk.blue).toBe('function');
    });

    test('getChalk doit retourner la même instance', () => {
        const chalk1 = getChalk();
        const chalk2 = getChalk();
        expect(chalk1).toBe(chalk2);
    });

    test('chalk.red doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.red('test');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    test('chalk.green doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.green('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.yellow doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.yellow('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.blue doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.blue('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.cyan doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.cyan('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.magenta doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.magenta('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.white doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.white('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.gray doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.gray('test');
        expect(typeof result).toBe('string');
    });

    test('chalk.black doit retourner une chaîne', () => {
        const chalk = getChalk();
        const result = chalk.black('test');
        expect(typeof result).toBe('string');
    });

    test('toutes les fonctions chalk doivent fonctionner avec des chaînes vides', () => {
        const chalk = getChalk();
        expect(typeof chalk.red('')).toBe('string');
        expect(typeof chalk.green('')).toBe('string');
        expect(typeof chalk.blue('')).toBe('string');
    });
});

describe('Utils - exec-wrapper', () => {
    const execa = require('../../src/utils/exec-wrapper');

    test('execa doit être une fonction', () => {
        expect(typeof execa).toBe('function');
    });
});

describe('Core - errorCMD', () => {
    const errorCMD = require('../../src/core/errorCMD');

    beforeEach(() => {
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        process.exit.mockRestore();
        console.log.mockRestore();
    });

    test('errorCMD doit afficher un message d\'erreur et quitter', () => {
        const error = new Error('Test error');
        errorCMD(error);

        expect(console.log).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('errorCMD doit afficher le message de l\'erreur', () => {
        const error = new Error('Custom error message');
        errorCMD(error);

        expect(console.log).toHaveBeenCalledWith(
            expect.anything(),
            'Custom error message',
            expect.anything()
        );
    });

    test('errorCMD doit gérer une erreur sans stack', () => {
        const error = { message: 'Error without stack', stack: '' };
        errorCMD(error);

        expect(console.log).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
