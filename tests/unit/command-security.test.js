const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('../../src/utils/exec-wrapper');
jest.mock('../../src/utils/chalk-wrapper', () => ({
    getChalk: () => ({
        red: (msg) => msg,
        green: (msg) => msg,
        blue: (msg) => msg,
        yellow: (msg) => msg,
        cyan: (msg) => msg
    })
}));

const securityCommand = require('../../src/cli/command/security');
const execa = require('../../src/utils/exec-wrapper');

describe('CLI Command - security', () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();

        fs.existsSync.mockReturnValue(false);
        execa.mockResolvedValue({ stdout: '', stderr: '' });
    });

    afterEach(() => {
        process.chdir(originalCwd);
    });

    test('doit avoir les bonnes métadonnées', () => {
        expect(securityCommand.name).toBe('security');
        expect(securityCommand.description).toContain('vulnérabilités de sécurité');
        expect(securityCommand.options).toHaveLength(1);
        expect(securityCommand.options[0].flags).toBe('-f, --fix');
    });

    describe('detectProjectTechnology', () => {
        test('doit détecter Node.js avec package.json', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('NODEJS'));
            expect(execa).toHaveBeenCalledWith('npm', ['audit']);
        });

        test('doit détecter Python avec requirements.txt', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('requirements.txt'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PYTHON'));
            expect(execa).toHaveBeenCalledWith('pip-audit', []);
        });

        test('doit détecter Python avec pyproject.toml', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('pyproject.toml'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PYTHON'));
        });

        test('doit détecter Python avec Pipfile', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('Pipfile'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PYTHON'));
        });

        test('doit détecter PHP avec composer.json', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('composer.json'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PHP'));
            expect(execa).toHaveBeenCalledWith('composer', ['audit']);
        });

        test('doit détecter Ruby avec Gemfile', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('Gemfile'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('RUBY'));
            expect(execa).toHaveBeenCalledWith('bundle', ['audit']);
        });

        test('doit détecter Java avec pom.xml', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('pom.xml'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('JAVA'));
            expect(execa).toHaveBeenCalledWith('mvn', ['dependency-check:check']);
        });

        test('doit détecter Java avec build.gradle', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('build.gradle'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('JAVA'));
        });

        test('doit détecter Go avec go.mod', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('go.mod'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GO'));
            expect(execa).toHaveBeenCalledWith('govulncheck', ['./...']);
        });

        test('doit détecter Rust avec Cargo.toml', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('Cargo.toml'));

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('RUST'));
            expect(execa).toHaveBeenCalledWith('cargo', ['audit']);
        });

        test('doit afficher message pour technologie inconnue', async () => {
            fs.existsSync.mockReturnValue(false);

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Technologie non détectée')
            );
            expect(execa).not.toHaveBeenCalled();
        });
    });

    describe('action check', () => {
        test('doit exécuter npm audit pour Node.js', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            execa.mockResolvedValue({ stdout: 'No vulnerabilities found' });

            await securityCommand.action({});

            expect(execa).toHaveBeenCalledWith('npm', ['audit']);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Vérification de sécurité terminée avec succès')
            );
        });

        test('doit afficher stdout en cas de succès', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            execa.mockResolvedValue({ stdout: 'Security report here' });

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith('Security report here');
        });

        test('doit gérer les vulnérabilités détectées', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            const error = new Error('Vulnerabilities found');
            error.stdout = '5 vulnerabilities found';
            execa.mockRejectedValue(error);

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Vulnérabilités détectées')
            );
            expect(console.log).toHaveBeenCalledWith('5 vulnerabilities found');
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Utilisez --fix pour tenter une correction')
            );
        });
    });

    describe('action fix', () => {
        test('doit exécuter npm audit fix avec --fix', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));

            await securityCommand.action({ fix: true });

            expect(execa).toHaveBeenCalledWith('npm', ['audit', 'fix']);
        });

        test('doit exécuter pip upgrade pour Python avec --fix', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('requirements.txt'));

            await securityCommand.action({ fix: true });

            expect(execa).toHaveBeenCalledWith('pip', ['install', '--upgrade', '-r', 'requirements.txt']);
        });

        test('doit exécuter composer update pour PHP avec --fix', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('composer.json'));

            await securityCommand.action({ fix: true });

            expect(execa).toHaveBeenCalledWith('composer', ['update', '--with-dependencies']);
        });

        test('doit gérer échec de correction', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            const error = new Error('Fix failed');
            error.stderr = 'Cannot fix automatically';
            execa.mockRejectedValue(error);

            await securityCommand.action({ fix: true });

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Échec de la correction automatique')
            );
            expect(console.log).toHaveBeenCalledWith('Cannot fix automatically');
        });

        test('doit afficher message de succès après fix', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            execa.mockResolvedValue({ stdout: 'Fixed 3 vulnerabilities' });

            await securityCommand.action({ fix: true });

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Vérification de sécurité terminée avec succès')
            );
        });
    });

    describe('gestion erreurs', () => {
        test('doit afficher stderr si disponible', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            const error = new Error('Command failed');
            error.stderr = 'Error details';
            execa.mockRejectedValue(error);

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith('Error details');
        });

        test('doit afficher message d\'erreur si stdout/stderr vides', async () => {
            fs.existsSync.mockImplementation((p) => p.includes('package.json'));
            const error = new Error('Generic error');
            execa.mockRejectedValue(error);

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith('Generic error');
        });

        test('doit gérer erreur globale', async () => {
            fs.existsSync.mockImplementation(() => {
                throw new Error('FS error');
            });

            await securityCommand.action({});

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Une erreur est survenue'),
                'FS error'
            );
        });
    });
});
