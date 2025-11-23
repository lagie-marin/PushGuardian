const { validateCode } = require('../../src/core/validator');
const { loadConfig } = require('../../src/core/configManager');
const fs = require('fs');
const execa = require('../../src/utils/exec-wrapper');

jest.mock('../../src/core/configManager');
jest.mock('fs');
jest.mock('../../src/utils/exec-wrapper');
jest.mock('../../src/hooks/constrains/constrains', () => ({
    constrains: jest.fn()
}));

describe('Core - validator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
        process.exit.mockRestore();
    });

    describe('validateCode', () => {
        test('doit valider le code avec la configuration par défaut', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src', 'tests']
                }
            });
            fs.existsSync.mockReturnValue(true);
            execa.mockResolvedValue({ stdout: '', stderr: '' });

            const result = await validateCode();

            expect(result.success).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('doit retourner success true si CQT est désactivé', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: false
                }
            });

            const result = await validateCode();

            expect(result.success).toBe(true);
            expect(execa).not.toHaveBeenCalled();
        });

        test('doit ajouter --fix si l\'option fix est activée', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src']
                }
            });
            fs.existsSync.mockReturnValue(true);
            execa.mockResolvedValue({ stdout: '', stderr: '' });

            await validateCode({}, { fix: true });

            expect(execa).toHaveBeenCalledWith('npx', expect.arrayContaining(['--fix']));
        });

        test('doit ajouter --max-warnings=0 si l\'option strict est activée', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src']
                }
            });
            fs.existsSync.mockReturnValue(true);
            execa.mockResolvedValue({ stdout: '', stderr: '' });

            await validateCode({}, { strict: true });

            expect(execa).toHaveBeenCalledWith('npx', expect.arrayContaining(['--max-warnings=0']));
        });

        test('doit utiliser le fichier de config personnalisé si spécifié', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src'],
                    config: '.eslintrc.custom.js'
                }
            });
            fs.existsSync.mockReturnValue(true);
            execa.mockResolvedValue({ stdout: '', stderr: '' });

            await validateCode();

            expect(execa).toHaveBeenCalledWith('npx', expect.arrayContaining(['--config', '.eslintrc.custom.js']));
        });

        test('doit filtrer les répertoires non existants', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src', 'nonexistent', 'tests']
                }
            });
            fs.existsSync.mockImplementation((dir) => dir !== 'nonexistent');
            execa.mockResolvedValue({ stdout: '', stderr: '' });

            await validateCode();

            expect(execa).toHaveBeenCalledWith('npx', expect.arrayContaining(['src', 'tests']));
            expect(execa).toHaveBeenCalledWith('npx', expect.not.arrayContaining(['nonexistent']));
        });

        test('doit retourner success false si execa échoue', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src']
                }
            });
            fs.existsSync.mockReturnValue(true);
            execa.mockRejectedValue({ stdout: 'ESLint errors found', message: 'Command failed' });

            const result = await validateCode();

            expect(result.success).toBe(false);
            expect(result.errors).toContain('ESLint errors found');
        });

        test('doit retourner le message d\'erreur si stdout n\'est pas disponible', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['src']
                }
            });
            fs.existsSync.mockReturnValue(true);
            execa.mockRejectedValue({ message: 'Command failed without stdout' });

            const result = await validateCode();

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Command failed without stdout');
        });

        test('doit retourner success true si onMissing est ignoré et aucun répertoire n\'est valide', async () => {
            loadConfig.mockReturnValue({
                validate: {
                    activateCQT: true,
                    directories: ['nonexistent1', 'nonexistent2'],
                    onMissing: 'ignore'
                }
            });
            fs.existsSync.mockReturnValue(false);

            const result = await validateCode();

            expect(result.success).toBe(true);
            expect(result.errors).toEqual([]);
        });
    });
});
