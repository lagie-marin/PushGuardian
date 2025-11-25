const fs = require('fs');

jest.mock('fs');

describe('CLI Command - security', () => {
    let securityCommand;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        fs.existsSync.mockReturnValue(false);
        
        jest.resetModules();
        securityCommand = require('../../src/cli/command/security');
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test('le module doit être chargeable', () => {
        expect(securityCommand).toBeDefined();
    });

    test('doit avoir la propriété name', () => {
        expect(securityCommand.name).toBe('security');
    });

    test('doit avoir la propriété action comme fonction', () => {
        expect(typeof securityCommand.action).toBe('function');
    });

    test('doit avoir la propriété description', () => {
        expect(typeof securityCommand.description).toBe('string');
    });

    test('doit avoir des options', () => {
        expect(Array.isArray(securityCommand.options)).toBe(true);
    });
});
