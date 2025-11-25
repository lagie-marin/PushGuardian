const { BranchSynchronizer } = require('../../src/core/mirroring/branchSynchronizer');

describe('Core Mirroring - BranchSynchronizer', () => {
    let mockClients;
    let synchronizer;

    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        mockClients = {
            github: {
                repos: {
                    listBranches: jest.fn()
                },
                git: {
                    createRef: jest.fn()
                }
            },
            gitlab: {
                Branches: {
                    all: jest.fn(),
                    create: jest.fn()
                }
            },
            bitbucket: {
                repositories: {
                    listBranches: jest.fn(),
                    createBranch: jest.fn()
                }
            }
        };
    });

    afterEach(() => {
        console.warn.mockRestore();
    });

    describe('construction', () => {
        test('le module se charge sans erreur', () => {
            expect(BranchSynchronizer).toBeDefined();
        });

        test('la classe BranchSynchronizer existe', () => {
            expect(typeof BranchSynchronizer).toBe('function');
        });

        test('peut créer une instance avec des clients', () => {
            const clients = { github: {}, gitlab: {} };
            const synchronizer = new BranchSynchronizer(clients);
            expect(synchronizer).toBeDefined();
            expect(synchronizer.clients).toEqual(clients);
        });

        test('stocke les clients correctement', () => {
            synchronizer = new BranchSynchronizer(mockClients);
            expect(synchronizer.clients).toBe(mockClients);
        });
    });

    describe('méthodes', () => {
        test('a une méthode syncBranches', () => {
            const synchronizer = new BranchSynchronizer({});
            expect(typeof synchronizer.syncBranches).toBe('function');
        });

        test('a une méthode getBranches', () => {
            const synchronizer = new BranchSynchronizer({});
            expect(typeof synchronizer.getBranches).toBe('function');
        });

        test('a une méthode createBranch', () => {
            const synchronizer = new BranchSynchronizer({});
            expect(typeof synchronizer.createBranch).toBe('function');
        });
    });

    describe('getBranches', () => {
        beforeEach(() => {
            synchronizer = new BranchSynchronizer(mockClients);
        });

        test('retourne une erreur si plateforme non supportée', async () => {
            await expect(synchronizer.getBranches('unsupported', 'repo', 'owner')).rejects.toThrow(
                'Plateforme non prise en charge'
            );
        });

        test('retourne erreur si client non défini', async () => {
            const sync = new BranchSynchronizer({});
            await expect(sync.getBranches('github', 'repo', 'owner')).rejects.toThrow(
                'Plateforme non prise en charge'
            );
        });

        test('doit récupérer branches GitHub', async () => {
            const mockBranches = [
                { name: 'main', commit: { sha: 'abc123' } },
                { name: 'dev', commit: { sha: 'def456' } }
            ];
            mockClients.github.repos.listBranches.mockResolvedValue({ data: mockBranches });

            const result = await synchronizer.getBranches('github', 'test-repo', 'test-owner');

            expect(mockClients.github.repos.listBranches).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo'
            });
            expect(result).toEqual(mockBranches);
        });

        test('doit récupérer branches GitLab', async () => {
            const mockBranches = [{ name: 'main' }, { name: 'dev' }];
            mockClients.gitlab.Branches.all.mockResolvedValue(mockBranches);

            const result = await synchronizer.getBranches('gitlab', 'test-repo', 'test-owner');

            expect(mockClients.gitlab.Branches.all).toHaveBeenCalledWith('test-repo');
            expect(result).toEqual(mockBranches);
        });

        test('doit récupérer branches Bitbucket', async () => {
            const mockBranches = [{ name: 'main' }, { name: 'dev' }];
            mockClients.bitbucket.repositories.listBranches.mockResolvedValue(mockBranches);

            const result = await synchronizer.getBranches('bitbucket', 'test-repo', 'test-owner');

            expect(mockClients.bitbucket.repositories.listBranches).toHaveBeenCalledWith({
                workspace: 'test-owner',
                repo_slug: 'test-repo'
            });
            expect(result).toEqual(mockBranches);
        });

        test('doit utiliser workspace par défaut pour Bitbucket', async () => {
            mockClients.bitbucket.repositories.listBranches.mockResolvedValue([]);

            await synchronizer.getBranches('bitbucket', 'test-repo', null);

            expect(mockClients.bitbucket.repositories.listBranches).toHaveBeenCalledWith({
                workspace: 'workspace',
                repo_slug: 'test-repo'
            });
        });

        test('doit propager erreur API GitHub', async () => {
            mockClients.github.repos.listBranches.mockRejectedValue(new Error('API Error'));

            await expect(synchronizer.getBranches('github', 'repo', 'owner')).rejects.toThrow('API Error');
        });
    });

    describe('createBranch', () => {
        beforeEach(() => {
            synchronizer = new BranchSynchronizer(mockClients);
        });

        test('retourne une erreur si plateforme non supportée', async () => {
            const branchData = { name: 'test', commit: { sha: 'abc123' } };
            await expect(synchronizer.createBranch('unsupported', 'repo', branchData, 'owner')).rejects.toThrow(
                'Plateforme non prise en charge'
            );
        });

        test('retourne erreur si client non défini', async () => {
            const sync = new BranchSynchronizer({});
            const branchData = { name: 'test', commit: { sha: 'abc123' } };
            await expect(sync.createBranch('github', 'repo', branchData, 'owner')).rejects.toThrow(
                'Plateforme non prise en charge'
            );
        });

        test('doit créer branche GitHub', async () => {
            const branchData = { name: 'feature-test', commit: { sha: 'abc123' } };
            mockClients.github.git.createRef.mockResolvedValue({ data: { ref: 'refs/heads/feature-test' } });

            await synchronizer.createBranch('github', 'test-repo', branchData, 'test-owner');

            expect(mockClients.github.git.createRef).toHaveBeenCalledWith({
                owner: 'test-owner',
                repo: 'test-repo',
                ref: 'refs/heads/feature-test',
                sha: 'abc123'
            });
        });

        test('doit créer branche GitLab', async () => {
            const branchData = { name: 'feature-test', commit: { sha: 'abc123' } };
            mockClients.gitlab.Branches.create.mockResolvedValue({ name: 'feature-test' });

            await synchronizer.createBranch('gitlab', 'test-repo', branchData, 'test-owner');

            expect(mockClients.gitlab.Branches.create).toHaveBeenCalledWith('test-repo', 'feature-test', {
                ref: 'abc123'
            });
        });

        test('doit créer branche Bitbucket', async () => {
            const branchData = { name: 'feature-test', commit: { sha: 'abc123' } };
            mockClients.bitbucket.repositories.createBranch.mockResolvedValue({ name: 'feature-test' });

            await synchronizer.createBranch('bitbucket', 'test-repo', branchData, 'test-owner');

            expect(mockClients.bitbucket.repositories.createBranch).toHaveBeenCalledWith({
                workspace: 'test-owner',
                repo_slug: 'test-repo',
                name: 'feature-test',
                target: { hash: 'abc123' }
            });
        });

        test('doit utiliser workspace par défaut pour Bitbucket', async () => {
            const branchData = { name: 'test', commit: { sha: 'abc123' } };
            mockClients.bitbucket.repositories.createBranch.mockResolvedValue({});

            await synchronizer.createBranch('bitbucket', 'repo', branchData, null);

            expect(mockClients.bitbucket.repositories.createBranch).toHaveBeenCalledWith({
                workspace: 'workspace',
                repo_slug: 'repo',
                name: 'test',
                target: { hash: 'abc123' }
            });
        });
    });

    describe('syncBranches', () => {
        beforeEach(() => {
            synchronizer = new BranchSynchronizer(mockClients);
        });

        test('doit synchroniser branches entre plateformes', async () => {
            const mockBranches = [
                { name: 'main', commit: { sha: 'abc123' } },
                { name: 'dev', commit: { sha: 'def456' } }
            ];
            mockClients.github.repos.listBranches.mockResolvedValue({ data: mockBranches });
            mockClients.gitlab.Branches.create.mockResolvedValue({});

            await synchronizer.syncBranches('github', 'gitlab', 'source-repo', 'target-repo', 'owner1', 'owner2');

            expect(mockClients.github.repos.listBranches).toHaveBeenCalled();
            expect(mockClients.gitlab.Branches.create).toHaveBeenCalledTimes(2);
        });

        test('doit continuer si création branche échoue', async () => {
            const mockBranches = [
                { name: 'main', commit: { sha: 'abc123' } },
                { name: 'dev', commit: { sha: 'def456' } }
            ];
            mockClients.github.repos.listBranches.mockResolvedValue({ data: mockBranches });
            mockClients.gitlab.Branches.create
                .mockRejectedValueOnce(new Error('Branch exists'))
                .mockResolvedValueOnce({});

            await synchronizer.syncBranches('github', 'gitlab', 'source-repo', 'target-repo', 'owner1', 'owner2');

            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Impossible de créer la branche'));
            expect(mockClients.gitlab.Branches.create).toHaveBeenCalledTimes(2);
        });

        test('doit lever erreur si getBranches échoue', async () => {
            mockClients.github.repos.listBranches.mockRejectedValue(new Error('API Error'));

            await expect(
                synchronizer.syncBranches('github', 'gitlab', 'source-repo', 'target-repo', 'owner1', 'owner2')
            ).rejects.toThrow('La synchronisation des branches a échoué');
        });

        test('doit traiter liste vide de branches', async () => {
            mockClients.github.repos.listBranches.mockResolvedValue({ data: [] });

            await synchronizer.syncBranches('github', 'gitlab', 'source-repo', 'target-repo', 'owner1', 'owner2');

            expect(mockClients.gitlab.Branches.create).not.toHaveBeenCalled();
        });

        test('doit afficher warning pour chaque échec', async () => {
            const mockBranches = [
                { name: 'main', commit: { sha: 'abc123' } },
                { name: 'dev', commit: { sha: 'def456' } },
                { name: 'test', commit: { sha: 'ghi789' } }
            ];
            mockClients.github.repos.listBranches.mockResolvedValue({ data: mockBranches });
            mockClients.gitlab.Branches.create.mockRejectedValue(new Error('Failed'));

            await synchronizer.syncBranches('github', 'gitlab', 'source-repo', 'target-repo', 'owner1', 'owner2');

            expect(console.warn).toHaveBeenCalledTimes(3);
        });
    });
});
