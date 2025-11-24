const interactiveMenu = require('../../src/core/interactiveMenu/interactiveMenu');

describe('Core InteractiveMenu - interactiveMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'clear').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        if (typeof process.stdin.setMaxListeners === 'function') {
            process.stdin.setMaxListeners(100);
        }
    });

    afterEach(() => {
        console.clear.mockRestore();
        console.log.mockRestore();
        if (process.exit && process.exit.mockRestore) process.exit.mockRestore();
        // Remove any lingering stdin data listeners and restore raw mode
        try {
            process.stdin.removeAllListeners && process.stdin.removeAllListeners('data');
            if (typeof process.stdin.setRawMode === 'function') process.stdin.setRawMode(false);
            process.stdin.pause && process.stdin.pause();
        } catch (e) {
            // ignore cleanup errors
        }
    });

    describe('module export', () => {
        test('doit être une fonction', () => {
            expect(typeof interactiveMenu).toBe('function');
        });

        test('doit retourner une Promise', () => {
            const result = interactiveMenu('Test', ['Option 1', 'Option 2']);
            expect(result).toBeInstanceOf(Promise);
        });
    });

    describe('affichage', () => {
        test('doit afficher le message', () => {
            interactiveMenu('Test message', ['Option 1']);
            
            expect(console.clear).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test message'));
        });

        test('doit afficher toutes les options', () => {
            const choices = ['Option 1', 'Option 2', 'Option 3'];
            interactiveMenu('Test', choices);
            
            choices.forEach(choice => {
                expect(console.log).toHaveBeenCalledWith(expect.stringContaining(choice));
            });
        });

        test('doit afficher les instructions', () => {
            interactiveMenu('Test', ['Option 1']);
            
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Up'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Down'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Select'));
        });

        test('doit mettre en surbrillance première option', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2']);
            
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('>'));
        });

        test('doit marquer options présélectionnées', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2'], [1]);
            
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('*'));
        });
    });

    describe('comportement', () => {
        test('doit accepter présélections vides', () => {
            expect(() => {
                interactiveMenu('Test', ['Option 1', 'Option 2'], []);
            }).not.toThrow();
        });

        test('doit accepter présélections multiples', () => {
            expect(() => {
                interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3'], [0, 2]);
            }).not.toThrow();
        });

        test('doit gérer une seule option', () => {
            interactiveMenu('Test', ['Unique option']);
            
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Unique option'));
        });

        test('doit gérer liste vide', () => {
            expect(() => {
                interactiveMenu('Test', []);
            }).not.toThrow();
        });

        test('doit créer Promise pour chaque appel', () => {
            const promise1 = interactiveMenu('Test', ['Option 1']);
            const promise2 = interactiveMenu('Test', ['Option 2']);
            
            expect(promise1).toBeInstanceOf(Promise);
            expect(promise2).toBeInstanceOf(Promise);
            expect(promise1).not.toBe(promise2);
        });
    });

    describe('paramètres', () => {
        test('doit accepter message et choices', () => {
            expect(() => {
                interactiveMenu('Message', ['Choice 1', 'Choice 2']);
            }).not.toThrow();
        });

        test('doit accepter présélections optionnelles', () => {
            expect(() => {
                interactiveMenu('Test', ['Option']);
            }).not.toThrow();
        });

        test('doit gérer tableau présélections', () => {
            expect(() => {
                interactiveMenu('Test', ['A', 'B', 'C'], [0, 1]);
            }).not.toThrow();
        });
    });
});
