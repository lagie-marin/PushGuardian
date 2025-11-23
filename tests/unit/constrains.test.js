const { constrains, validateCommitMessage } = require('../../src/hooks/constrains/constrains');
const { loadConfig } = require('../../src/core/configManager');
const { constraintEngine } = require('../../src/hooks/constrains/constraintEngine');

jest.mock('../../src/core/configManager');
jest.mock('execa');

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
    });
});
