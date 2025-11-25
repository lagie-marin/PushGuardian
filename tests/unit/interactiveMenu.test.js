// Mock stdin before requiring the module
const mockStdin = {
    setRawMode: jest.fn(),
    resume: jest.fn(),
    pause: jest.fn(),
    setEncoding: jest.fn(),
    removeListener: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    setMaxListeners: jest.fn()
};

// Replace stdin with mock
const originalStdin = process.stdin;
Object.defineProperty(process, 'stdin', {
    value: mockStdin,
    writable: true,
    configurable: true
});

const interactiveMenu = require('../../src/core/interactiveMenu/interactiveMenu');

describe('Core InteractiveMenu - interactiveMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'clear').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        
        // Reset mock implementations
        mockStdin.setRawMode.mockReturnValue(undefined);
        mockStdin.resume.mockReturnValue(undefined);
        mockStdin.pause.mockReturnValue(undefined);
        mockStdin.setEncoding.mockReturnValue(undefined);
        mockStdin.removeListener.mockReturnValue(undefined);
        mockStdin.on.mockReturnValue(undefined);
        mockStdin.removeAllListeners.mockReturnValue(undefined);
    });

    afterEach(() => {
        console.clear.mockRestore();
        console.log.mockRestore();
        if (process.exit && process.exit.mockRestore) process.exit.mockRestore();
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

    describe('navigation avec touches', () => {
        let handleInput;

        beforeEach(() => {
            mockStdin.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    handleInput = callback;
                }
            });
        });

        test('doit naviguer vers le haut avec flèche haut', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            const initialLogCount = console.log.mock.calls.length;
            handleInput('\u001B[A'); // UP Arrow
            
            expect(console.log.mock.calls.length).toBeGreaterThan(initialLogCount);
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit naviguer vers le bas avec flèche bas', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            const initialLogCount = console.log.mock.calls.length;
            handleInput('\u001B[B'); // DOWN Arrow
            
            expect(console.log.mock.calls.length).toBeGreaterThan(initialLogCount);
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit boucler navigation vers le haut depuis première option', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            console.clear.mockClear();
            handleInput('\u001B[A'); // UP Arrow from first item
            
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit boucler navigation vers le bas depuis dernière option', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            // Navigate to last item
            handleInput('\u001B[B');
            handleInput('\u001B[B');
            console.clear.mockClear();
            
            // Try to go down from last item
            handleInput('\u001B[B');
            
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit sélectionner option avec flèche droite', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            const initialLogCount = console.log.mock.calls.length;
            handleInput('\u001B[C'); // Right Arrow
            
            expect(console.log.mock.calls.length).toBeGreaterThan(initialLogCount);
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit permettre sélection multiple de la même option', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            handleInput('\u001B[C'); // SELECT Option 1
            console.clear.mockClear();
            handleInput('\u001B[C'); // SELECT Option 1 again
            
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit désélectionner option avec flèche gauche', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3'], [0]);
            
            const initialLogCount = console.log.mock.calls.length;
            handleInput('\u001B[D'); // Left Arrow
            
            expect(console.log.mock.calls.length).toBeGreaterThan(initialLogCount);
            expect(console.clear).toHaveBeenCalled();
        });

        test('ne doit rien faire si désélection sur option non sélectionnée', () => {
            interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            const initialLogCount = console.log.mock.calls.length;
            handleInput('\u001B[D'); // Left Arrow on unselected item
            
            expect(console.log.mock.calls.length).toBeGreaterThan(initialLogCount);
        });

        test('doit quitter avec Ctrl+C', () => {
            // Mock process.exit to throw to simulate actual exit
            const exitMock = jest.spyOn(process, 'exit').mockImplementation((code) => {
                throw new Error('Process exit called');
            });
            
            interactiveMenu('Test', ['Option 1', 'Option 2']);
            
            expect(() => {
                handleInput('\u0003'); // Ctrl+C
            }).toThrow('Process exit called');
            
            expect(exitMock).toHaveBeenCalled();
            
            // Restore the mock to the default behavior for other tests
            exitMock.mockRestore();
            jest.spyOn(process, 'exit').mockImplementation(() => {});
        });
    });

    describe('validation avec Entrée', () => {
        let handleInput;

        beforeEach(() => {
            mockStdin.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    handleInput = callback;
                }
            });
        });

        test('doit retourner option courante si aucune sélection', async () => {
            const promise = interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            handleInput('\r'); // ENTER
            
            const result = await promise;
            expect(result).toEqual(['Option 1']);
            expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
            expect(mockStdin.pause).toHaveBeenCalled();
        });

        test('doit retourner options sélectionnées', async () => {
            const promise = interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3'], [1, 2]);
            
            handleInput('\r'); // ENTER
            
            const result = await promise;
            expect(result).toEqual(['Option 2', 'Option 3']);
        });

        test('doit nettoyer listeners après validation', async () => {
            const promise = interactiveMenu('Test', ['Option 1']);
            
            handleInput('\r'); // ENTER
            
            await promise;
            expect(mockStdin.removeListener).toHaveBeenCalledWith('data', handleInput);
        });

        test('doit retourner sélections après navigation et sélection', async () => {
            const promise = interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            handleInput('\u001B[B'); // DOWN to Option 2
            handleInput('\u001B[C'); // SELECT Option 2
            handleInput('\u001B[B'); // DOWN to Option 3
            handleInput('\u001B[C'); // SELECT Option 3
            handleInput('\r'); // ENTER
            
            const result = await promise;
            expect(result).toEqual(['Option 2', 'Option 3']);
        });

        test('doit gérer navigation puis validation sans sélection', async () => {
            const promise = interactiveMenu('Test', ['Option 1', 'Option 2', 'Option 3']);
            
            handleInput('\u001B[B'); // DOWN to Option 2
            handleInput('\u001B[B'); // DOWN to Option 3
            handleInput('\r'); // ENTER without selecting
            
            const result = await promise;
            expect(result).toEqual(['Option 3']);
        });
    });

    describe('gestion stdin', () => {
        test('doit configurer stdin en mode raw', () => {
            interactiveMenu('Test', ['Option 1']);
            
            expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);
            expect(mockStdin.resume).toHaveBeenCalled();
            expect(mockStdin.setEncoding).toHaveBeenCalledWith('utf8');
        });

        test('doit enregistrer listener data', () => {
            interactiveMenu('Test', ['Option 1']);
            
            expect(mockStdin.on).toHaveBeenCalledWith('data', expect.any(Function));
        });

        test('doit restaurer stdin après validation', async () => {
            let handleInput;
            mockStdin.on.mockImplementation((event, callback) => {
                if (event === 'data') handleInput = callback;
            });

            const promise = interactiveMenu('Test', ['Option 1']);
            handleInput('\r');
            
            await promise;
            
            expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
            expect(mockStdin.pause).toHaveBeenCalled();
        });
    });

    describe('scénarios complexes', () => {
        let handleInput;

        beforeEach(() => {
            mockStdin.on.mockImplementation((event, callback) => {
                if (event === 'data') handleInput = callback;
            });
        });

        test('doit gérer sélection multiple puis désélection', async () => {
            const promise = interactiveMenu('Test', ['A', 'B', 'C']);
            
            handleInput('\u001B[C'); // SELECT A
            handleInput('\u001B[B'); // DOWN to B
            handleInput('\u001B[C'); // SELECT B
            handleInput('\u001B[D'); // DESELECT B
            handleInput('\r'); // ENTER
            
            const result = await promise;
            expect(result).toEqual(['A']);
        });

        test('doit gérer navigation circulaire complète', () => {
            interactiveMenu('Test', ['A', 'B', 'C']);
            
            // Navigate through all items and back
            handleInput('\u001B[B'); // A -> B
            handleInput('\u001B[B'); // B -> C
            handleInput('\u001B[B'); // C -> A
            handleInput('\u001B[A'); // A -> C
            handleInput('\u001B[A'); // C -> B
            handleInput('\u001B[A'); // B -> A
            
            expect(console.clear).toHaveBeenCalled();
        });

        test('doit gérer présélections puis modifications', async () => {
            const promise = interactiveMenu('Test', ['A', 'B', 'C'], [0, 1]);
            
            handleInput('\u001B[D'); // DESELECT A
            handleInput('\u001B[B'); // DOWN to B
            handleInput('\u001B[B'); // DOWN to C
            handleInput('\u001B[C'); // SELECT C
            handleInput('\r'); // ENTER
            
            const result = await promise;
            expect(result).toEqual(['B', 'C']);
        });
    });
});
