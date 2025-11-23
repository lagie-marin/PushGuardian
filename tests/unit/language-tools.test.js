const fs = require('fs');
const { LANGUAGE_TOOLS } = require('../../src/core/codeQualityTools/languageTools');

jest.mock('fs');

describe('Core CodeQualityTools - languageTools', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('doit retourner un objet avec les outils de langage', () => {
        expect(LANGUAGE_TOOLS).toBeDefined();
        expect(typeof LANGUAGE_TOOLS).toBe('object');
    });

    test('doit contenir JavaScript (ESLint)', () => {
        expect(LANGUAGE_TOOLS['JavaScript (ESLint)']).toBeDefined();
        expect(LANGUAGE_TOOLS['JavaScript (ESLint)'].packages).toContain('eslint');
    });

    test('doit contenir TypeScript', () => {
        expect(LANGUAGE_TOOLS['TypeScript (TypeScript ESLint)']).toBeDefined();
        expect(LANGUAGE_TOOLS['TypeScript (TypeScript ESLint)'].packages).toContain('typescript');
    });

    test('doit contenir JSON', () => {
        expect(LANGUAGE_TOOLS['JSON (ESLint Plugin)']).toBeDefined();
    });

    test('doit contenir Markdown', () => {
        expect(LANGUAGE_TOOLS['Markdown (ESLint Plugin)']).toBeDefined();
    });

    test('doit contenir CSS/SCSS', () => {
        expect(LANGUAGE_TOOLS['CSS/SCSS (Stylelint)']).toBeDefined();
        expect(LANGUAGE_TOOLS['CSS/SCSS (Stylelint)'].packages).toContain('stylelint');
    });

    test('doit contenir YAML', () => {
        expect(LANGUAGE_TOOLS['YAML (ESLint Plugin)']).toBeDefined();
    });

    test('doit contenir HTML', () => {
        expect(LANGUAGE_TOOLS['HTML (ESLint Plugin)']).toBeDefined();
    });
});

describe('Core CodeQualityTools - toolInstaller', () => {
    const execa = require('execa');
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    test('module toolInstaller existe', () => {
        expect(() => require('../../src/core/codeQualityTools/toolInstaller')).not.toThrow();
    });
});

describe('Core Module - env-loader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('module env-loader existe', () => {
        expect(() => require('../../src/core/module/env-loader')).not.toThrow();
    });
});

describe('Core InteractiveMenu - interactiveMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('module interactiveMenu existe', () => {
        expect(() => require('../../src/core/interactiveMenu/interactiveMenu')).not.toThrow();
    });
});
