const fs = require('fs');

jest.mock('fs');
jest.mock('execa');

const execa = require('execa');
const toolInstaller = require('../../src/core/codeQualityTools/toolInstaller');

describe('Core codeQualityTools - toolInstaller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});

        fs.writeFileSync.mockImplementation(() => {});
        fs.existsSync.mockReturnValue(false);

        execa.execa.mockResolvedValue({ stdout: '', stderr: '' });
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('module exports', () => {
        test('doit exporter installBaseTools', () => {
            expect(typeof toolInstaller.installBaseTools).toBe('function');
        });

        test('doit exporter installLanguageTools', () => {
            expect(typeof toolInstaller.installLanguageTools).toBe('function');
        });
    });

    describe('installBaseTools', () => {
        test('doit être une fonction async', () => {
            const result = toolInstaller.installBaseTools();
            expect(result).toBeInstanceOf(Promise);
        });

        test('doit installer packages npm de base', async () => {
            await toolInstaller.installBaseTools();

            expect(execa.execa).toHaveBeenCalledWith(
                'npm',
                expect.arrayContaining([
                    'install',
                    '-s',
                    '--save-dev',
                    'prettier',
                    'eslint',
                    '@eslint/markdown',
                    'eslint-plugin-prettier',
                    'globals'
                ]),
                expect.objectContaining({ stdio: 'inherit' })
            );
        });

        test('doit créer fichier .prettierrc après installation', async () => {
            await toolInstaller.installBaseTools();

            expect(fs.writeFileSync).toHaveBeenCalledWith('.prettierrc', expect.any(String));
        });

        test('doit créer .prettierrc avec bonne config', async () => {
            await toolInstaller.installBaseTools();

            const call = fs.writeFileSync.mock.calls.find(c => c[0] === '.prettierrc');
            expect(call).toBeDefined();
            const writtenContent = call[1];
            const config = JSON.parse(writtenContent);

            expect(config.semi).toBe(true);
            expect(config.singleQuote).toBe(true);
            expect(config.printWidth).toBe(120);
            expect(config.tabWidth).toBe(4);
            expect(config.trailingComma).toBe('none');
        });

        test('doit afficher message de succès', async () => {
            await toolInstaller.installBaseTools();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Prettier et ESLint installés'));
        });

        test('doit gérer erreur installation', async () => {
            execa.execa.mockRejectedValue(new Error('npm install failed'));

            await toolInstaller.installBaseTools();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Warning during base tools installation:'),
                'npm install failed'
            );
        });

        test('ne doit pas planter si execa échoue', async () => {
            execa.execa.mockRejectedValue(new Error('Network error'));

            await expect(toolInstaller.installBaseTools()).resolves.not.toThrow();
        });
    });

    describe('installLanguageTools', () => {
        test('doit être une fonction async', () => {
            const toolConfig = { packages: ['test-package'] };
            const result = toolInstaller.installLanguageTools(toolConfig);
            expect(result).toBeInstanceOf(Promise);
        });

        test('doit installer packages si fournis', async () => {
            const toolConfig = {
                packages: ['eslint-plugin-typescript', '@typescript-eslint/parser']
            };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(execa.execa).toHaveBeenCalledWith(
                'npm',
                ['install', '-s', '--save-dev', 'eslint-plugin-typescript', '@typescript-eslint/parser'],
                { stdio: 'inherit' }
            );
        });

        test('ne doit pas installer si packages vide', async () => {
            const toolConfig = { packages: [] };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(execa.execa).not.toHaveBeenCalled();
        });

        test('ne doit pas installer si pas de packages', async () => {
            const toolConfig = {};

            await toolInstaller.installLanguageTools(toolConfig);

            expect(execa.execa).not.toHaveBeenCalled();
        });

        test('doit appeler setup function si fournie', async () => {
            const setupMock = jest.fn().mockResolvedValue();
            const toolConfig = {
                packages: ['test-package'],
                setup: setupMock
            };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(setupMock).toHaveBeenCalled();
        });

        test('doit appeler setup même sans packages', async () => {
            const setupMock = jest.fn().mockResolvedValue();
            const toolConfig = {
                setup: setupMock
            };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(setupMock).toHaveBeenCalled();
        });

        test('ne doit pas appeler setup si non fournie', async () => {
            const toolConfig = {
                packages: ['test-package']
            };

            await expect(toolInstaller.installLanguageTools(toolConfig)).resolves.not.toThrow();
        });

        test('doit gérer erreur installation packages', async () => {
            execa.execa.mockRejectedValue(new Error('Package not found'));
            const toolConfig = { packages: ['invalid-package'] };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Warning: Package not found')
            );
        });

        test('doit gérer erreur dans setup function', async () => {
            const setupMock = jest.fn().mockRejectedValue(new Error('Setup failed'));
            const toolConfig = {
                packages: ['test-package'],
                setup: setupMock
            };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Warning: Setup failed')
            );
        });

        test('ne doit pas planter si installation échoue', async () => {
            execa.execa.mockRejectedValue(new Error('Error'));
            const toolConfig = { packages: ['package'] };

            await expect(toolInstaller.installLanguageTools(toolConfig)).resolves.not.toThrow();
        });

        test('doit installer packages avant setup', async () => {
            const callOrder = [];
            execa.execa.mockImplementation(async () => {
                callOrder.push('install');
            });
            const setupMock = jest.fn().mockImplementation(async () => {
                callOrder.push('setup');
            });
            const toolConfig = {
                packages: ['test-package'],
                setup: setupMock
            };

            await toolInstaller.installLanguageTools(toolConfig);

            expect(callOrder).toEqual(['install', 'setup']);
        });
    });

    describe('gestion des erreurs', () => {
        test('installBaseTools ne doit pas throw sur erreur fs', async () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            await expect(toolInstaller.installBaseTools()).resolves.not.toThrow();
        });

        test('installLanguageTools doit gérer toolConfig null', async () => {
            await expect(toolInstaller.installLanguageTools(null)).resolves.not.toThrow();
        });

        test('installLanguageTools doit gérer toolConfig undefined', async () => {
            await expect(toolInstaller.installLanguageTools(undefined)).resolves.not.toThrow();
        });
    });
});
