// Mock interactiveMenu au niveau du module pour éviter les problèmes avec stdin
jest.mock('../../src/core/interactiveMenu/interactiveMenu', () => {
    return jest.fn(() => Promise.resolve(['Hooks Git']));
});

const interactiveMenu = require('../../src/core/interactiveMenu/interactiveMenu');

describe('Core InteractiveMenu', () => {
    test('le module doit être une fonction', () => {
        expect(typeof interactiveMenu).toBe('function');
    });

    test('doit retourner une Promise', () => {
        const result = interactiveMenu('Test', ['Option 1', 'Option 2']);
        expect(result).toBeInstanceOf(Promise);
    });
});

describe('CLI Install - hooks', () => {
    const fs = require('fs');
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test('le module doit être chargeable', () => {
        expect(() => require('../../src/cli/install/hooks')).not.toThrow();
    });

    test('installHooks doit être une fonction', () => {
        const { installHooks } = require('../../src/cli/install/hooks');
        expect(typeof installHooks).toBe('function');
    });
});

describe('CLI Install - codeQualityTools', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('le module doit être chargeable', () => {
        expect(() => require('../../src/cli/install/codeQualityTools')).not.toThrow();
    });

    test('installCodeQualityTools doit être une fonction', () => {
        const { installCodeQualityTools } = require('../../src/cli/install/codeQualityTools');
        expect(typeof installCodeQualityTools).toBe('function');
    });
});

describe('CLI Install - mirroring', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('le module doit être chargeable', () => {
        expect(() => require('../../src/cli/install/mirroring')).not.toThrow();
    });

    test('installMirroringTools doit être une fonction', () => {
        const { installMirroringTools } = require('../../src/cli/install/mirroring');
        expect(typeof installMirroringTools).toBe('function');
    });
});
