const fs = require('fs');
const path = require('path');
const { generateWorkflow } = require('../../src/core/mirroring/generate');

jest.mock('fs');

describe('Core Mirroring - generate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('generateWorkflow', () => {
        test('doit créer le dossier workflows s\'il n\'existe pas', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {});
            fs.writeFileSync.mockImplementation(() => {});

            generateWorkflow();

            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('.github/workflows'),
                { recursive: true }
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Dossier .github/workflows créé'));
        });

        test('ne doit pas créer le dossier s\'il existe déjà', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {});

            generateWorkflow();

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        test('doit écrire le fichier workflow', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {});

            generateWorkflow();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('mirror.yml'),
                expect.stringContaining('name: Mirror Repository'),
                'utf8'
            );
        });

        test('doit afficher un message de succès', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {});

            generateWorkflow();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Workflow GitHub Actions généré')
            );
        });

        test('doit contenir les bonnes variables dans le workflow', () => {
            fs.existsSync.mockReturnValue(true);
            let workflowContent = '';
            fs.writeFileSync.mockImplementation((path, content) => {
                workflowContent = content;
            });

            generateWorkflow();

            expect(workflowContent).toContain('SOURCE_PLATFORM');
            expect(workflowContent).toContain('TARGET_PLATFORM');
            expect(workflowContent).toContain('REPO_NAME');
            expect(workflowContent).toContain('SOURCE_OWNER');
            expect(workflowContent).toContain('TARGET_OWNER');
            expect(workflowContent).toContain('GITHUB_TOKEN');
            expect(workflowContent).toContain('GITLAB_TOKEN');
        });

        test('doit gérer les erreurs lors de la génération', () => {
            fs.existsSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            expect(() => generateWorkflow()).toThrow('Permission denied');
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la génération du workflow')
            );
        });
    });
});
