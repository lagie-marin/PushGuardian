const { RepoManager } = require('../../src/core/mirroring/repoManager');

describe('Core Mirroring - RepoManager', () => {
    let repoManager;
    let mockClients;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        mockClients = {
            github: {
                repos: {
                    get: jest.fn(),
                    createForAuthenticatedUser: jest.fn(),
                    createInOrg: jest.fn()
                }
            },
            gitlab: {
                Projects: {
                    show: jest.fn(),
                    search: jest.fn(),
                    create: jest.fn()
                }
            },
            bitbucket: {
                repositories: {
                    get: jest.fn(),
                    list: jest.fn(),
                    create: jest.fn()
                }
            }
        };

        repoManager = new RepoManager(mockClients);
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('constructor', () => {
        test('doit stocker les clients', () => {
            expect(repoManager.clients).toBe(mockClients);
        });
    });

    describe('getRepo', () => {
        describe('GitHub', () => {
            test('doit récupérer un dépôt GitHub', async () => {
                const mockRepo = { data: { name: 'test-repo', description: 'Test' } };
                mockClients.github.repos.get.mockResolvedValue(mockRepo);

                const result = await repoManager.getRepo('github', 'test-repo', 'owner');

                expect(mockClients.github.repos.get).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'test-repo'
                });
                expect(result).toEqual(mockRepo);
            });
        });

        describe('GitLab', () => {
            test('doit récupérer un dépôt GitLab', async () => {
                const mockProject = { id: 123, name: 'test-project' };
                mockClients.gitlab.Projects.show.mockResolvedValue(mockProject);

                const result = await repoManager.getRepo('gitlab', 'test-project', 'owner');

                expect(mockClients.gitlab.Projects.show).toHaveBeenCalledWith('test-project');
                expect(result).toEqual(mockProject);
            });
        });

        describe('Bitbucket', () => {
            test('doit récupérer un dépôt Bitbucket', async () => {
                const mockRepo = { data: { name: 'test-repo' } };
                mockClients.bitbucket.repositories.get.mockResolvedValue(mockRepo);

                const result = await repoManager.getRepo('bitbucket', 'test-repo', 'workspace');

                expect(mockClients.bitbucket.repositories.get).toHaveBeenCalledWith({
                    workspace: 'workspace',
                    repo_slug: 'test-repo'
                });
                expect(result).toEqual(mockRepo);
            });

            test('doit utiliser workspace par défaut si owner non fourni', async () => {
                const mockRepo = { data: { name: 'test-repo' } };
                mockClients.bitbucket.repositories.get.mockResolvedValue(mockRepo);

                await repoManager.getRepo('bitbucket', 'test-repo');

                expect(mockClients.bitbucket.repositories.get).toHaveBeenCalledWith({
                    workspace: 'workspace',
                    repo_slug: 'test-repo'
                });
            });
        });

        describe('Erreurs', () => {
            test('doit lever erreur si plateforme non supportée', async () => {
                await expect(repoManager.getRepo('unsupported', 'repo', 'owner')).rejects.toThrow(
                    'Plateforme non prise en charge: unsupported'
                );
            });

            test('doit lever erreur si client non défini', async () => {
                const managerWithoutClient = new RepoManager({});
                await expect(managerWithoutClient.getRepo('github', 'repo', 'owner')).rejects.toThrow(
                    'Plateforme non prise en charge: github'
                );
            });
        });
    });

    describe('createRepo', () => {
        describe('GitHub', () => {
            test('doit créer un dépôt GitHub pour utilisateur authentifié', async () => {
                const repoData = { name: 'new-repo', description: 'Test repo', private: true };
                const createdRepo = { data: { ...repoData, id: 123 } };
                
                mockClients.github.repos.get.mockRejectedValue(new Error('Not found'));
                mockClients.github.repos.createForAuthenticatedUser.mockResolvedValue(createdRepo);

                const result = await repoManager.createRepo('github', repoData, 'owner', false);

                expect(mockClients.github.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
                    ...repoData,
                    private: true
                });
                expect(result).toEqual(createdRepo);
            });

            test('doit créer un dépôt public si public_repo=true', async () => {
                const repoData = { name: 'new-repo', description: 'Test repo', private: true };
                const createdRepo = { data: { ...repoData, id: 123 } };
                
                mockClients.github.repos.get.mockRejectedValue(new Error('Not found'));
                mockClients.github.repos.createForAuthenticatedUser.mockResolvedValue(createdRepo);

                await repoManager.createRepo('github', repoData, 'owner', true);

                expect(mockClients.github.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
                    ...repoData,
                    private: false
                });
            });

            test('doit utiliser dépôt existant si déjà présent', async () => {
                const repoData = { name: 'existing-repo', description: 'Test' };
                const existingRepo = { data: { ...repoData, id: 456 } };
                
                mockClients.github.repos.get.mockResolvedValue(existingRepo);

                const result = await repoManager.createRepo('github', repoData, 'owner');

                expect(console.log).toHaveBeenCalledWith(
                    expect.stringContaining('Le dépôt existing-repo existe déjà')
                );
                expect(mockClients.github.repos.createForAuthenticatedUser).not.toHaveBeenCalled();
                expect(result).toEqual(existingRepo.data);
            });

            test('doit créer dans organisation si échec utilisateur', async () => {
                const repoData = { name: 'org-repo', description: 'Test' };
                const createdRepo = { data: { ...repoData, id: 789 } };
                
                mockClients.github.repos.get.mockRejectedValue(new Error('Not found'));
                mockClients.github.repos.createForAuthenticatedUser.mockRejectedValue(new Error('User creation failed'));
                mockClients.github.repos.createInOrg.mockResolvedValue(createdRepo);

                const result = await repoManager.createRepo('github', repoData, 'org-name');

                expect(mockClients.github.repos.createInOrg).toHaveBeenCalledWith({
                    org: 'org-name',
                    ...repoData,
                    private: true
                });
                expect(result).toEqual(createdRepo);
            });

            test('doit lever erreur si création organisation échoue', async () => {
                const repoData = { name: 'fail-repo', description: 'Test' };
                
                mockClients.github.repos.get.mockRejectedValue(new Error('Not found'));
                mockClients.github.repos.createForAuthenticatedUser.mockRejectedValue(new Error('User failed'));
                mockClients.github.repos.createInOrg.mockRejectedValue(new Error('Org failed'));

                await expect(repoManager.createRepo('github', repoData, 'owner')).rejects.toThrow(
                    'Impossible de créer le dépôt: Org failed'
                );
            });
        });

        describe('GitLab', () => {
            test('doit créer un dépôt GitLab', async () => {
                const repoData = { name: 'gitlab-repo', description: 'Test' };
                const createdProject = { id: 123, ...repoData };
                
                mockClients.gitlab.Projects.search.mockResolvedValue([]);
                mockClients.gitlab.Projects.create.mockResolvedValue(createdProject);

                const result = await repoManager.createRepo('gitlab', repoData, 'owner', false);

                expect(mockClients.gitlab.Projects.create).toHaveBeenCalledWith({
                    ...repoData,
                    visibility: 'private'
                });
                expect(result).toEqual(createdProject);
            });

            test('doit créer projet public si public_repo=true', async () => {
                const repoData = { name: 'public-repo', description: 'Test' };
                
                mockClients.gitlab.Projects.search.mockResolvedValue([]);
                mockClients.gitlab.Projects.create.mockResolvedValue({ id: 123 });

                await repoManager.createRepo('gitlab', repoData, 'owner', true);

                expect(mockClients.gitlab.Projects.create).toHaveBeenCalledWith({
                    ...repoData,
                    visibility: 'public'
                });
            });

            test('doit utiliser projet existant si trouvé', async () => {
                const repoData = { name: 'existing-gitlab', description: 'Test' };
                const existingProject = { 
                    id: 456, 
                    name: 'existing-gitlab', 
                    namespace: { name: 'owner' } 
                };
                
                mockClients.gitlab.Projects.search.mockResolvedValue([existingProject]);

                const result = await repoManager.createRepo('gitlab', repoData, 'owner');

                expect(console.log).toHaveBeenCalledWith(
                    expect.stringContaining('Le dépôt existing-gitlab existe déjà')
                );
                expect(mockClients.gitlab.Projects.create).not.toHaveBeenCalled();
                expect(result).toEqual(existingProject);
            });

            test('doit ignorer projets avec namespace différent', async () => {
                const repoData = { name: 'gitlab-repo', description: 'Test' };
                const wrongNamespace = { 
                    name: 'gitlab-repo', 
                    namespace: { name: 'different-owner' } 
                };
                
                mockClients.gitlab.Projects.search.mockResolvedValue([wrongNamespace]);
                mockClients.gitlab.Projects.create.mockResolvedValue({ id: 789 });

                await repoManager.createRepo('gitlab', repoData, 'owner');

                expect(mockClients.gitlab.Projects.create).toHaveBeenCalled();
            });

            test('doit gérer erreur search et continuer création', async () => {
                const repoData = { name: 'new-repo', description: 'Test' };
                const createdProject = { id: 999 };
                
                mockClients.gitlab.Projects.search.mockRejectedValue(new Error('Search failed'));
                mockClients.gitlab.Projects.create.mockResolvedValue(createdProject);

                const result = await repoManager.createRepo('gitlab', repoData, 'owner');

                expect(mockClients.gitlab.Projects.create).toHaveBeenCalled();
                expect(result).toEqual(createdProject);
            });
        });

        describe('Bitbucket', () => {
            test('doit créer un dépôt Bitbucket', async () => {
                const repoData = { name: 'bitbucket-repo', description: 'Test' };
                const createdRepo = { name: 'bitbucket-repo', slug: 'bitbucket-repo' };
                
                mockClients.bitbucket.repositories.list.mockResolvedValue({ data: { values: [] } });
                mockClients.bitbucket.repositories.create.mockResolvedValue(createdRepo);

                const result = await repoManager.createRepo('bitbucket', repoData, 'workspace', false);

                expect(mockClients.bitbucket.repositories.create).toHaveBeenCalledWith({
                    workspace: 'workspace',
                    repository: { ...repoData, is_private: true }
                });
                expect(result).toEqual(createdRepo);
            });

            test('doit créer repo public si public_repo=true', async () => {
                const repoData = { name: 'public-bb', description: 'Test' };
                
                mockClients.bitbucket.repositories.list.mockResolvedValue({ data: { values: [] } });
                mockClients.bitbucket.repositories.create.mockResolvedValue({});

                await repoManager.createRepo('bitbucket', repoData, 'workspace', true);

                expect(mockClients.bitbucket.repositories.create).toHaveBeenCalledWith({
                    workspace: 'workspace',
                    repository: { ...repoData, is_private: false }
                });
            });

            test('doit utiliser workspace par défaut', async () => {
                const repoData = { name: 'default-ws', description: 'Test' };
                
                mockClients.bitbucket.repositories.list.mockResolvedValue({ data: { values: [] } });
                mockClients.bitbucket.repositories.create.mockResolvedValue({});

                await repoManager.createRepo('bitbucket', repoData);

                expect(mockClients.bitbucket.repositories.list).toHaveBeenCalledWith({
                    workspace: 'workspace'
                });
                expect(mockClients.bitbucket.repositories.create).toHaveBeenCalledWith({
                    workspace: 'workspace',
                    repository: expect.any(Object)
                });
            });

            test('doit utiliser repo existant si trouvé', async () => {
                const repoData = { name: 'existing-bb', description: 'Test' };
                const existingRepo = { name: 'existing-bb', slug: 'existing-bb' };
                
                mockClients.bitbucket.repositories.list.mockResolvedValue({
                    data: { values: [existingRepo] }
                });

                const result = await repoManager.createRepo('bitbucket', repoData, 'workspace');

                expect(console.log).toHaveBeenCalledWith(
                    expect.stringContaining('Le dépôt existing-bb existe déjà')
                );
                expect(mockClients.bitbucket.repositories.create).not.toHaveBeenCalled();
                expect(result).toEqual(existingRepo);
            });
        });

        describe('Erreurs', () => {
            test('doit lever erreur si plateforme non supportée', async () => {
                await expect(repoManager.createRepo('unsupported', {}, 'owner')).rejects.toThrow(
                    'Plateforme non prise en charge: unsupported'
                );
            });

            test('doit lever erreur si client non défini', async () => {
                const managerWithoutClient = new RepoManager({});
                await expect(managerWithoutClient.createRepo('github', {}, 'owner')).rejects.toThrow(
                    'Plateforme non prise en charge: github'
                );
            });
        });
    });

    describe('createOrUpdateRepo', () => {
        test('doit créer ou mettre à jour un dépôt', async () => {
            const srcRepo = { description: 'Source description', private: true };
            
            mockClients.github.repos.get.mockResolvedValue(srcRepo);
            mockClients.gitlab.Projects.search.mockResolvedValue([]);
            mockClients.gitlab.Projects.create.mockResolvedValue({ id: 123 });

            await repoManager.createOrUpdateRepo(
                'github',
                'gitlab',
                'source-repo',
                'target-repo',
                'source-owner',
                'target-owner',
                false
            );

            expect(mockClients.github.repos.get).toHaveBeenCalledWith({
                owner: 'source-owner',
                repo: 'source-repo'
            });
            expect(mockClients.gitlab.Projects.create).toHaveBeenCalledWith({
                name: 'target-repo',
                description: 'Source description',
                private: true,
                visibility: 'private'
            });
        });

        test('doit utiliser description vide si source sans description', async () => {
            const srcRepo = { private: false };
            
            mockClients.github.repos.get.mockImplementation((params) => {
                if (params.repo === 'target-repo') {
                    return Promise.reject(new Error('Not found'));
                }
                return Promise.resolve(srcRepo);
            });
            mockClients.github.repos.createForAuthenticatedUser.mockResolvedValue({ data: {} });

            await repoManager.createOrUpdateRepo(
                'github',
                'github',
                'source-repo',
                'target-repo',
                'owner',
                'owner'
            );

            expect(mockClients.github.repos.createForAuthenticatedUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: '',
                    private: true
                })
            );
        });

        test('doit propager erreur si getRepo échoue', async () => {
            mockClients.github.repos.get.mockRejectedValue(new Error('Repo not found'));

            await expect(
                repoManager.createOrUpdateRepo(
                    'github',
                    'gitlab',
                    'source-repo',
                    'target-repo',
                    'owner',
                    'owner'
                )
            ).rejects.toThrow('Échec de la mise en miroir du dépôt: Repo not found');
        });

        test('doit propager erreur si createRepo échoue', async () => {
            const srcRepo = { data: { description: 'Test' } };
            
            mockClients.github.repos.get.mockResolvedValue(srcRepo);
            mockClients.gitlab.Projects.search.mockResolvedValue([]);
            mockClients.gitlab.Projects.create.mockRejectedValue(new Error('Creation failed'));

            await expect(
                repoManager.createOrUpdateRepo(
                    'github',
                    'gitlab',
                    'source-repo',
                    'target-repo',
                    'owner',
                    'owner'
                )
            ).rejects.toThrow('Échec de la mise en miroir du dépôt: Creation failed');
        });
    });
});
