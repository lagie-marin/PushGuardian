const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('Core CodeQualityTools - modules', () => {
    test('configManager doit être chargeable', () => {
        const configManager = require('../../src/core/codeQualityTools/configManager');
        expect(configManager).toBeDefined();
    });

    test('configAnalyzer doit être chargeable', () => {
        const configAnalyzer = require('../../src/core/codeQualityTools/configAnalyzer');
        expect(configAnalyzer).toBeDefined();
    });

    test('configGenerator doit être chargeable', () => {
        const configGenerator = require('../../src/core/codeQualityTools/configGenerator');
        expect(configGenerator).toBeDefined();
    });

    test('toolInstaller doit être chargeable', () => {
        const toolInstaller = require('../../src/core/codeQualityTools/toolInstaller');
        expect(toolInstaller).toBeDefined();
    });

    test('fileDetector doit être chargeable', () => {
        const fileDetector = require('../../src/core/codeQualityTools/fileDetector');
        expect(fileDetector).toBeDefined();
    });

    test('languageTools doit être chargeable', () => {
        const languageTools = require('../../src/core/codeQualityTools/languageTools');
        expect(languageTools).toBeDefined();
    });
});
