class BranchSynchronizer {
    constructor(clients) {
        this.clients = clients;
    }

    async syncBranches(srcPlatform, targetPlatform, sourceRepo, targetRepo, sourceOwner, targetOwner) {
        try {
            const branches = await this.getBranches(srcPlatform, sourceRepo, sourceOwner);

            for (const branch of branches) {
                try {
                    await this.createBranch(targetPlatform, targetRepo, branch, targetOwner);
                } catch (error) {
                    console.warn(`⚠️ Impossible de créer la branche ${branch.name}: ${error.message}`);
                }
            }
        } catch (error) {
            throw new Error(`La synchronisation des branches a échoué: ${error.message}`);
        }
    }
    async getBranches(platform, repoName, owner) {
        const client = this.clients[platform];

        if (!client) throw new Error(`Plateforme non prise en charge: ${platform}`);
        if (platform === 'github') {
            const response = await client.repos.listBranches({ owner, repo: repoName });
            return response.data;
        }
        if (platform === 'gitlab') return await client.Branches.all(repoName);
        if (platform === 'bitbucket')
            return await client.repositories.listBranches({ workspace: owner || 'workspace', repo_slug: repoName });
        throw new Error(`Liste des branches non implémentée pour ${platform}`);
    }

    async createBranch(platform, repoName, branchData, owner) {
        const client = this.clients[platform];

        if (!client) throw new Error(`Plateforme non prise en charge: ${platform}`);
        if (platform === 'github')
            return await client.git.createRef({
                owner,
                repo: repoName,
                ref: `refs/heads/${branchData.name}`,
                sha: branchData.commit.sha
            });
        if (platform === 'gitlab')
            return await client.Branches.create(repoName, branchData.name, { ref: branchData.commit.sha });
        if (platform === 'bitbucket')
            return await client.repositories.createBranch({
                workspace: owner || 'workspace',
                repo_slug: repoName,
                name: branchData.name,
                target: { hash: branchData.commit.sha }
            });
        throw new Error(`La création de branche n'est pas implémentée pour ${platform}`);
    }
}

module.exports = { BranchSynchronizer };
