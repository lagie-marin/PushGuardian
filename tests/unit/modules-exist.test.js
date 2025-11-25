const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('execa');

describe('CLI Install - hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    test('le module hooks existe', () => {
        expect(() => require('../../src/cli/install/hooks')).not.toThrow();
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

    test('le module codeQualityTools existe', () => {
        expect(() => require('../../src/cli/install/codeQualityTools')).not.toThrow();
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

    test('le module mirroring existe', () => {
        expect(() => require('../../src/cli/install/mirroring')).not.toThrow();
    });
});

describe('CLI Command - install', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('le module install existe', () => {
        expect(() => require('../../src/cli/command/install')).not.toThrow();
    });
});

describe('CLI Command - security', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('le module security existe', () => {
        expect(() => require('../../src/cli/command/security')).not.toThrow();
    });
});

describe('Core CodeQualityTools - configAnalyzer', () => {
    test('le module configAnalyzer existe', () => {
        expect(() => require('../../src/core/codeQualityTools/configAnalyzer')).not.toThrow();
    });
});

describe('Core CodeQualityTools - configGenerator', () => {
    test('le module configGenerator existe', () => {
        expect(() => require('../../src/core/codeQualityTools/configGenerator')).not.toThrow();
    });
});

describe('Core CodeQualityTools - configManager', () => {
    test('le module configManager existe', () => {
        expect(() => require('../../src/core/codeQualityTools/configManager')).not.toThrow();
    });
});

describe('Core Mirroring - branchSynchronizer', () => {
    test('le module branchSynchronizer existe', () => {
        expect(() => require('../../src/core/mirroring/branchSynchronizer')).not.toThrow();
    });
});
