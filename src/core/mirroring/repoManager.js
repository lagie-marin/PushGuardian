class RepoManager {
    constructor(clients) {
        this.clients = clients;
    }

    async createOrUpdateRepo(
        srcPlatform,
        targetPlatform,
        sourceRepo,
        targetRepo,
        sourceOwner,
        targetOwner,
        public_repo = false
    ) {
        try {
            const srcRepo = await this.getRepo(srcPlatform, sourceRepo, sourceOwner);
            const normalizedSrcRepo = srcRepo && srcRepo.data ? srcRepo.data : srcRepo;
            const repoData = {
                name: targetRepo,
                description: normalizedSrcRepo.description || '',
                private: normalizedSrcRepo.private || false
            };
            await this.createRepo(targetPlatform, repoData, targetOwner, public_repo);
        } catch (error) {
            throw new Error(`Échec de la mise en miroir du dépôt: ${error.message}`);
        }
    }

    async getRepo(platform, repoName, owner) {
        const client = this.clients[platform];
        if (!client) throw new Error(`Plateforme non prise en charge: ${platform}`);
        if (platform === 'github') return await client.repos.get({ owner, repo: repoName });
        if (platform === 'gitlab') return await client.Projects.show(repoName);
        if (platform === 'bitbucket')
            return await client.repositories.get({ workspace: owner || 'workspace', repo_slug: repoName });
        throw new Error(`La récupération du dépôt n'est pas implémentée pour ${platform}`);
    }

    async createRepo(platform, repoData, owner, public_repo = false) {
        const client = this.clients[platform];
        if (!client) throw new Error(`Plateforme non prise en charge: ${platform}`);
        if (platform === 'github') {
            try {
                const existingRepo = await client.repos.get({ owner, repo: repoData.name }).catch(() => null);
                if (existingRepo) {
                    console.log(
                        `📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`
                    );
                    return existingRepo.data;
                }
                return await client.repos.createForAuthenticatedUser({ ...repoData, private: !public_repo });
            } catch {
                try {
                    return await client.repos.createInOrg({ org: owner, ...repoData, private: !public_repo });
                } catch (orgError) {
                    throw new Error(`Impossible de créer le dépôt: ${orgError.message}`);
                }
            }
        }
        if (platform === 'gitlab') {
            const projectPath = `${owner}/${repoData.name}`;

            try {
                const existingByPath = await client.Projects.show(projectPath);
                if (existingByPath) {
                    console.log(
                        `📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`
                    );
                    return existingByPath;
                }
            } catch {
                // Le projet n'existe pas (ou n'est pas accessible), on tente la création juste après.
            }

            const existing = await client.Projects.search(repoData.name).catch(() => []);
            const existingRepo = existing.find((p) => p.name === repoData.name && p.namespace.name === owner);
            if (existingRepo) {
                console.log(`📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`);
                return existingRepo;
            }

            try {
                return await client.Projects.create({
                    ...repoData,
                    visibility: public_repo ? 'public' : 'private'
                });
            } catch (error) {
                if (error && (error.message || '').toLowerCase().includes('forbidden')) {
                    throw new Error(
                        "GitLab a refusé l'opération (Forbidden). Vérifiez que GITLAB_TOKEN a le scope 'api' et les droits de création dans le namespace cible."
                    );
                }
                throw error;
            }
        }
        if (platform === 'bitbucket') {
            const existing = await client.repositories.list({ workspace: owner || 'workspace' });
            const existingRepo = existing.data.values.find((r) => r.name === repoData.name);
            if (existingRepo) {
                console.log(`📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`);
                return existingRepo;
            }
            return await client.repositories.create({
                workspace: owner || 'workspace',
                repository: { ...repoData, is_private: !public_repo }
            });
        }
        throw new Error(`La création de dépôt n'est pas implémentée pour ${platform}`);
    }
}

module.exports = { RepoManager };
