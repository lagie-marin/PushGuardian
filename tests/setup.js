/* global jest, afterEach */

// Augmenter les timeouts pour les tests d'intégration
jest.setTimeout(15000);

// Mock execa pour éviter les problèmes avec les modules ESM
jest.mock('execa', () => ({
    execa: jest.fn(() =>
        Promise.resolve({
            stdout: '',
            stderr: '',
            exitCode: 0
        })
    )
}));

// Mock console pour les tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

// Nettoyer après chaque test
afterEach(() => {
    jest.clearAllMocks();
});
