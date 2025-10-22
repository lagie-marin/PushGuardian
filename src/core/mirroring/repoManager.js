class RepoManager {
    constructor(clients) {
        this.clients = clients;
    }

    async createOrUpdateRepo(srcPlatform, targetPlatform, sourceRepo, targetRepo, sourceOwner, targetOwner, public_repo=false) {
        try {
            const srcRepo = await this.getRepo(srcPlatform, sourceRepo, sourceOwner);
            const repoData = {
                name: targetRepo,
                description: srcRepo.description || '',
                private: srcRepo.private || false,
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
        if (platform === 'bitbucket') return await client.repositories.get({ workspace: owner || 'workspace', repo_slug: repoName });
        throw new Error(`La récupération du dépôt n'est pas implémentée pour ${platform}`);
    }

    async createRepo(platform, repoData, owner, public_repo=false) {
        const client = this.clients[platform];
        if (!client) throw new Error(`Plateforme non prise en charge: ${platform}`);
        if (platform === 'github') {
            try {
                const existingRepo = await client.repos.get({ owner, repo: repoData.name }).catch(() => null);
                if (existingRepo) {
                    console.log(`📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`);
                    return existingRepo.data;
                }
                return await client.repos.createForAuthenticatedUser({ ...repoData, private: !public_repo });
            } catch (error) {
                try {
                    return await client.repos.createInOrg({ org: owner, ...repoData, private: !public_repo });
                } catch (orgError) {
                    throw new Error(`Impossible de créer le dépôt: ${orgError.message}`);
                }
            }
        }
        if (platform === 'gitlab') {
            try {
                const existing = await client.Projects.search(repoData.name).catch(() => []);
                const existingRepo = existing.find(p => p.name === repoData.name && p.namespace.name === owner);
                if (existingRepo) {
                    console.log(`📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`);
                    return existingRepo;
                }
            } catch (error) {}
            return await client.Projects.create({ ...repoData, visibility: public_repo ? "public" : "private" });
        }
        if (platform === 'bitbucket') {
            try {
                const existing = await client.repositories.list({ workspace: owner || 'workspace' });
                const existingRepo = existing.data.values.find(r => r.name === repoData.name);
                if (existingRepo) {
                    console.log(`📁 Le dépôt ${repoData.name} existe déjà chez ${owner}, utilisation du dépôt existant.`);
                    return existingRepo;
                }
            } catch (error) {}
            return await client.repositories.create({ workspace: owner || 'workspace', repository: { ...repoData, is_private: !public_repo } });
        }
        throw new Error(`La création de dépôt n'est pas implémentée pour ${platform}`);
    }
}

module.exports = { RepoManager };
