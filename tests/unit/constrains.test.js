const { constrains, validateCommitMessage, validateBranchName, validatePrePush } = require('../../src/hooks/constrains/constrains');
const { loadConfig } = require('../../src/core/configManager');
const { constraintEngine } = require('../../src/hooks/constrains/constraintEngine');
const { execa } = require('execa');
const fs = require('fs');

jest.mock('../../src/core/configManager');
jest.mock('execa');
jest.mock('fs');

describe('Hooks - constrains', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        process.exit.mockRestore();
    });

    describe('constrains', () => {
        test('doit retourner success si aucune config de hooks', async () => {
            loadConfig.mockReturnValue({ hooks: {} });

            const result = await constrains('commit-msg', 'test message');

            expect(result.success).toBe(true);
        });

        test('doit valider un message de commit correct', async () => {
            loadConfig.mockReturnValue({
                hooks: {
                    'commit-msg': {
                        type: ['feat', 'fix'],
                        constraints: {}
                    }
                }
            });

            const result = await constrains('commit-msg', '[feat]: add new feature');

            expect(result.success).toBe(true);
            expect(process.exit).not.toHaveBeenCalled();
        });

        test('doit rejeter un message de commit incorrect', async () => {
            loadConfig.mockReturnValue({
                hooks: {
                    'commit-msg': {
                        type: ['feat', 'fix'],
                        constraints: {}
                    }
                }
            });

            await constrains('commit-msg', '[invalid]: bad message');

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ne respecte pas les contraintes'));
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit valider un message avec contraintes', async () => {
            loadConfig.mockReturnValue({
                hooks: {
                    'commit-msg': {
                        type: ['feat'],
                        constraints: {
                            minLength: 10
                        }
                    }
                }
            });

            const result = await constrains('commit-msg', '[feat]: this is a long enough message');

            expect(result.success).toBe(true);
        });

        test('doit rejeter un message qui ne respecte pas les contraintes', async () => {
            loadConfig.mockReturnValue({
                hooks: {
                    'commit-msg': {
                        type: ['feat'],
                        constraints: {
                            minLength: 100
                        }
                    }
                }
            });

            await constrains('commit-msg', '[feat]: short');

            expect(process.exit).toHaveBeenCalledWith(1);
        });
    });

    describe('validateCommitMessage', () => {
        test('doit valider un message correctement formaté', async () => {
            const validationInfo = {
                msg: '[feat]: add new feature',
                type: ['feat', 'fix'],
                constraints: {}
            };

            const result = await validateCommitMessage(validationInfo);

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('doit extraire la description du message', async () => {
            const validationInfo = {
                msg: '[feat]: add new feature',
                type: ['feat', 'fix'],
                constraints: {}
            };

            const result = await validateCommitMessage(validationInfo);

            expect(result.description).toBeTruthy();
            expect(result.description.includes('add new feature')).toBe(true);
        });

        test('doit rejeter un message mal formaté', async () => {
            const validationInfo = {
                msg: 'feat add new feature',
                type: ['feat', 'fix'],
                constraints: {}
            };

            const result = await validateCommitMessage(validationInfo);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('doit rejeter un type non autorisé', async () => {
            const validationInfo = {
                msg: '[invalid]: add new feature',
                type: ['feat', 'fix'],
                constraints: {}
            };

            const result = await validateCommitMessage(validationInfo);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le type "invalid" n\'est pas valide. Types autorisés: feat, fix');
        });

        test('doit accepter tous les types si la liste est vide', async () => {
            const validationInfo = {
                msg: '[anytype]: add new feature',
                type: [],
                constraints: {}
            };

            const result = await validateCommitMessage(validationInfo);

            expect(result.isValid).toBe(true);
        });

        test('doit gérer les messages sans séparateur', async () => {
            const validationInfo = {
                msg: 'message sans format',
                type: ['feat'],
                constraints: {}
            };

            const result = await validateCommitMessage(validationInfo);

            expect(result.isValid).toBe(false);
        });

        test('doit gérer autoStartWith et corriger message', async () => {
            const validationInfo = {
                msg: '[feat]message sans séparateur',
                type: ['feat'],
                constraints: {
                    autoStartWith: ': ',
                    mustStartWith: ': '
                }
            };

            execa.mockResolvedValue({ stdout: '.git' });
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync = jest.fn();

            const result = await validateCommitMessage(validationInfo);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                '[feat]: message sans séparateur'
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Message de commit corrigé'));
        });

        test('doit gérer erreur si COMMIT_EDITMSG absent avec autoStartWith', async () => {
            const validationInfo = {
                msg: '[feat]bad format',
                type: ['feat'],
                constraints: {
                    autoStartWith: ': ',
                    mustStartWith: ': '
                }
            };

            execa.mockResolvedValue({ stdout: '.git' });
            fs.existsSync.mockReturnValue(false);

            await validateCommitMessage(validationInfo);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('git commit --amend'));
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit gérer erreur git lors de correction autoStartWith', async () => {
            const validationInfo = {
                msg: '[feat]bad',
                type: ['feat'],
                constraints: {
                    autoStartWith: ': ',
                    mustStartWith: ': '
                }
            };

            execa.mockRejectedValue(new Error('Git error'));

            await validateCommitMessage(validationInfo);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Erreur lors de la correction'));
            expect(process.exit).toHaveBeenCalledWith(1);
        });
    });

    describe('validateBranchName', () => {
        test('doit valider nom de branche correct', async () => {
            execa.mockResolvedValue({ stdout: 'feat/new-feature' });

            const validationInfo = {
                type: ['feat', 'fix']
            };

            const result = await validateBranchName(validationInfo);

            expect(result.isValid).toBe(true);
            expect(result.branchDescription).toBe('new-feature');
        });

        test('doit rejeter type de branche invalide', async () => {
            execa.mockResolvedValue({ stdout: 'invalid/branch' });

            const validationInfo = {
                type: ['feat', 'fix']
            };

            const result = await validateBranchName(validationInfo);

            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('type de branche "invalid" n\'est pas valide');
        });

        test('doit gérer branche sans description', async () => {
            execa.mockResolvedValue({ stdout: 'feat' });

            const validationInfo = {
                type: ['feat']
            };

            const result = await validateBranchName(validationInfo);

            expect(result.isValid).toBe(true);
            expect(result.branchDescription).toBe('');
        });

        test('doit gérer erreur git', async () => {
            execa.mockRejectedValue(new Error('Git error'));

            const validationInfo = {
                type: ['feat']
            };

            const result = await validateBranchName(validationInfo);

            expect(console.log).toHaveBeenCalledWith('Erreur Git, validation ignorée:', 'Git error');
            expect(result.isValid).toBe(true);
        });
    });

    describe('validatePrePush', () => {
        test('doit réussir pour nouvelle branche', async () => {
            execa.mockImplementation((cmd, args) => {
                if (args[0] === 'rev-parse') return Promise.resolve({ stdout: 'new-branch' });
                if (args[0] === 'ls-remote') return Promise.resolve({ stdout: '' });
                if (args[0] === 'validate') return Promise.resolve({ stdout: '' });
                return Promise.resolve({ stdout: '' });
            });

            const result = await validatePrePush();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Nouvelle branche'));
            expect(result.success).toBe(true);
        });

        test('doit détecter branche distante en avance', async () => {
            execa.mockImplementation((cmd, args) => {
                if (args[0] === 'rev-parse') return Promise.resolve({ stdout: 'main' });
                if (args[0] === 'ls-remote') return Promise.resolve({ stdout: 'refs/heads/main' });
                if (args[0] === 'fetch') return Promise.resolve({ stdout: '' });
                if (args[0] === 'rev-list') return Promise.resolve({ stdout: '5' });
                if (args[0] === 'status') return Promise.resolve({ stdout: '' });
                return Promise.resolve({ stdout: '' });
            });

            await validatePrePush();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('branche distante "origin/main" est différente'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('git pull'));
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit détecter modifications locales non commit', async () => {
            execa.mockImplementation((cmd, args) => {
                if (args[0] === 'rev-parse') return Promise.resolve({ stdout: 'main' });
                if (args[0] === 'ls-remote') return Promise.resolve({ stdout: 'refs/heads/main' });
                if (args[0] === 'fetch') return Promise.resolve({ stdout: '' });
                if (args[0] === 'rev-list') return Promise.resolve({ stdout: '3' });
                if (args[0] === 'status') return Promise.resolve({ stdout: 'M file.js' });
                return Promise.resolve({ stdout: '' });
            });

            await validatePrePush();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('git stash && git pull && git stash pop'));
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('doit gérer erreur fetch', async () => {
            execa.mockImplementation((cmd, args) => {
                if (args[0] === 'rev-parse') return Promise.resolve({ stdout: 'main' });
                if (args[0] === 'ls-remote') return Promise.resolve({ stdout: 'refs/heads/main' });
                if (args[0] === 'fetch') return Promise.reject(new Error('Fetch failed'));
                if (cmd === 'npx') return Promise.resolve({ stdout: '' });
                return Promise.resolve({ stdout: '' });
            });

            await validatePrePush();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Impossible de vérifier la branche distante'));
        });

        test('doit appeler validation à la fin', async () => {
            execa.mockImplementation((cmd, args) => {
                if (args && args[0] === 'rev-parse') return Promise.resolve({ stdout: 'main' });
                if (args && args[0] === 'ls-remote') return Promise.resolve({ stdout: '' });
                if (cmd === 'npx') return Promise.resolve({ stdout: '' });
                return Promise.resolve({ stdout: '' });
            });

            await validatePrePush();

            expect(execa).toHaveBeenCalledWith('npx', ['pushguardian', 'validate', '-s']);
        });
    });

    describe('constrains - post-checkout', () => {
        test('doit valider branche en post-checkout', async () => {
            loadConfig.mockReturnValue({
                hooks: {
                    'post-checkout': {
                        type: ['feat', 'fix'],
                        constraints: {}
                    }
                }
            });

            execa.mockResolvedValue({ stdout: 'feat/new-branch' });

            const result = await constrains('post-checkout', 'dummy');

            expect(result.success).toBe(true);
        });
    });

    describe('constrains - pre-push', () => {
        test('doit exécuter validatePrePush', async () => {
            loadConfig.mockReturnValue({
                hooks: {
                    'pre-push': {
                        constraints: {}
                    }
                }
            });

            execa.mockImplementation((cmd, args) => {
                if (args && args[0] === 'rev-parse') return Promise.resolve({ stdout: 'main' });
                if (args && args[0] === 'ls-remote') return Promise.resolve({ stdout: '' });
                if (cmd === 'npx') return Promise.resolve({ stdout: '' });
                return Promise.resolve({ stdout: '' });
            });

            const result = await constrains('pre-push', 'dummy');

            expect(result.success).toBe(true);
        });
    });
});
