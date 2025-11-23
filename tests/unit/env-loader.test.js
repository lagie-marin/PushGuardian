const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('Core Module - env-loader', () => {
    let envLoader;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        process.env = { ...originalEnv };
        jest.resetModules();
        envLoader = require('../../src/core/module/env-loader');
    });

    afterEach(() => {
        console.log.mockRestore();
        console.warn.mockRestore();
        console.error.mockRestore();
        process.env = originalEnv;
    });

    test('le module doit être chargeable', () => {
        expect(envLoader).toBeDefined();
    });

    test('loadEnv doit être une fonction', () => {
        expect(typeof envLoader.loadEnv).toBe('function');
    });

    test('getEnv doit être une fonction', () => {
        expect(typeof envLoader.getEnv).toBe('function');
    });

    describe('getEnv', () => {
        test('doit retourner la valeur de la variable', () => {
            process.env.TEST_VAR = 'test_value';

            const value = envLoader.getEnv('TEST_VAR');

            expect(value).toBe('test_value');
        });

        test('doit retourner la valeur par défaut si la variable n\'existe pas', () => {
            const value = envLoader.getEnv('NON_EXISTENT', 'default');

            expect(value).toBe('default');
        });

        test('doit gérer les variables vides', () => {
            process.env.EMPTY_VAR = '';

            const value = envLoader.getEnv('EMPTY_VAR', 'default');

            expect(value).toBe('default');
        });
    });
});
