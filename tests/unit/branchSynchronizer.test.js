describe('Core Mirroring - branchSynchronizer', () => {
    let BranchSynchronizer;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.resetModules();
        const module = require('../../src/core/mirroring/branchSynchronizer');
        BranchSynchronizer = module.BranchSynchronizer || module.default || module;
    });

    afterEach(() => {
        console.warn.mockRestore();
    });

    test('le module doit être chargeable', () => {
        expect(BranchSynchronizer).toBeDefined();
    });

    test('BranchSynchronizer doit être une classe', () => {
        expect(typeof BranchSynchronizer).toBe('function');
    });

    test('doit créer une instance avec des clients', () => {
        const mockClients = {
            github: { repos: {} },
            gitlab: { Branches: {} }
        };
        
        const synchronizer = new BranchSynchronizer(mockClients);
        
        expect(synchronizer).toBeDefined();
        expect(synchronizer.clients).toEqual(mockClients);
    });

    test('doit avoir une méthode syncBranches', () => {
        const synchronizer = new BranchSynchronizer({});
        expect(typeof synchronizer.syncBranches).toBe('function');
    });

    test('doit avoir une méthode getBranches', () => {
        const synchronizer = new BranchSynchronizer({});
        expect(typeof synchronizer.getBranches).toBe('function');
    });

    test('doit avoir une méthode createBranch', () => {
        const synchronizer = new BranchSynchronizer({});
        expect(typeof synchronizer.createBranch).toBe('function');
    });

    test('getBranches doit rejeter pour une plateforme non supportée', async () => {
        const synchronizer = new BranchSynchronizer({});
        
        await expect(
            synchronizer.getBranches('unsupported', 'repo', 'owner')
        ).rejects.toThrow('Plateforme non prise en charge');
    });

    test('createBranch doit rejeter pour une plateforme non supportée', async () => {
        const synchronizer = new BranchSynchronizer({});
        
        await expect(
            synchronizer.createBranch('unsupported', 'repo', {}, 'owner')
        ).rejects.toThrow('Plateforme non prise en charge');
    });
});
