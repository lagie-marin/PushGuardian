const fs = require('fs');
const path = require('path');

jest.mock('fs');

// Mock chalk-wrapper
jest.mock('../../src/utils/chalk-wrapper', () => ({
    getChalk: () => ({
        red: (msg) => msg,
        green: (msg) => msg,
        blue: (msg) => msg,
        yellow: (msg) => msg,
        cyan: (msg) => msg,
        gray: (msg) => msg
    })
}));

const hooks = require('../../src/cli/install/hooks');

describe('CLI Install - hooks', () => {
    const mockHooksDir = path.join(process.cwd(), '.git', 'hooks');
    const mockConfigPath = 'pushguardian.config.json';
    
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
        
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockImplementation(() => {});
        fs.chmodSync.mockImplementation(() => {});
    });

    describe('createHooksConfig', () => {
        test('doit créer config hooks si fichier inexistant', () => {
            fs.existsSync.mockReturnValue(false);

            hooks.createHooksConfig();

            const expectedConfig = {
                hooks: {
                    'commit-msg': {
                        type: ['ADD', 'UPDATE', 'DELETE', 'FIX', 'MERGE', 'CHORE'],
                        constraints: { maxLength: 80 }
                    },
                    'post-checkout': {
                        type: ['main', 'develop', 'staging', 'feat', 'fix', 'chore', 'hotfixes'],
                        constraints: {}
                    },
                    'pre-push': {}
                },
                install: { hooks: true }
            };

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify(expectedConfig, null, 4)
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Configuration des hooks mise à jour'));
        });

        test('doit fusionner avec config existante', () => {
            const existingConfig = { validate: { directories: ['src/'] } };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

            hooks.createHooksConfig();

            const calls = fs.writeFileSync.mock.calls;
            const lastCall = calls[calls.length - 1];
            const savedConfig = JSON.parse(lastCall[1]);

            expect(savedConfig.validate).toEqual({ directories: ['src/'] });
            expect(savedConfig.hooks).toBeDefined();
            expect(savedConfig.install.hooks).toBe(true);
        });

        test('doit gérer JSON invalide dans config existante', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{ invalid json }');

            hooks.createHooksConfig();

            // Doit utiliser config par défaut en cas d'erreur de parsing
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Configuration des hooks mise à jour'));
        });

        test('doit gérer erreur écriture fichier', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            hooks.createHooksConfig();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la création de la configuration des hooks:'),
                'Permission denied'
            );
        });

        test('doit préserver install.CQT existant', () => {
            const existingConfig = {
                install: { CQT: ['JavaScript (ESLint)'] }
            };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

            hooks.createHooksConfig();

            const calls = fs.writeFileSync.mock.calls;
            const lastCall = calls[calls.length - 1];
            const savedConfig = JSON.parse(lastCall[1]);

            expect(savedConfig.install.CQT).toEqual(['JavaScript (ESLint)']);
            expect(savedConfig.install.hooks).toBe(true);
        });
    });

    describe('installHooks', () => {
        test('doit installer hook pre-push par défaut', () => {
            // Le hook n'existe pas encore, mais le répertoire .git/hooks oui
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('.git/hooks/pre-push')) return false;
                if (p.includes('.git/hooks')) return true;
                return true;
            });

            const result = hooks.installHooks();

            const hookPath = path.join(mockHooksDir, 'pre-push');
            const hookCalls = fs.writeFileSync.mock.calls.filter(call => call[0] === hookPath);
            
            expect(hookCalls.length).toBe(1);
            expect(hookCalls[0][1]).toContain('npx pushguardian validate --hooks pre-push');
            expect(fs.chmodSync).toHaveBeenCalledWith(hookPath, '755');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Hook pre-push installé'));
            expect(result).toBe(true);
        });

        test('doit installer plusieurs hooks', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('.git/hooks/')) return p.includes(mockHooksDir) && !p.match(/\/(pre-push|commit-msg|post-checkout)$/);
                return true;
            });

            hooks.installHooks(['pre-push', 'commit-msg', 'post-checkout']);

            const hookWrites = fs.writeFileSync.mock.calls.filter(
                call => call[0].includes('.git/hooks/') && !call[0].endsWith('pushguardian.config.json')
            );
            expect(hookWrites.length).toBe(3);
            expect(fs.chmodSync).toHaveBeenCalledTimes(3);
            
            expect(hookWrites[0][1]).toContain('pre-push');
            expect(hookWrites[1][1]).toContain('commit-msg');
            expect(hookWrites[2][1]).toContain('post-checkout');
        });

        test('doit gérer hook commit-msg avec argument spécial', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('.git/hooks/commit-msg')) return false;
                if (p.includes('.git/hooks')) return true;
                return true;
            });

            hooks.installHooks(['commit-msg']);

            const hookPath = path.join(mockHooksDir, 'commit-msg');
            const hookCalls = fs.writeFileSync.mock.calls.filter(call => call[0] === hookPath);
            
            expect(hookCalls.length).toBe(1);
            expect(hookCalls[0][1]).toContain('"$(cat "$1")"');
        });

        test('doit retourner false si .git/hooks inexistant', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p === mockHooksDir) return false;
                return true;
            });

            const result = hooks.installHooks();

            expect(console.error).toHaveBeenCalledWith('❌ Répertoire .git/hooks non trouvé');
            expect(result).toBe(false);
        });

        test('ne doit pas écraser hook existant sans force', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p === path.join(mockHooksDir, 'pre-push')) return true;
                if (p === mockHooksDir) return true;
                return false;
            });

            hooks.installHooks(['pre-push'], false);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Hook pre-push existe déjà')
            );
            // writeFileSync appelé seulement pour la config, pas pour le hook
            expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
        });

        test('doit écraser hook existant avec force=true', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p === path.join(mockHooksDir, 'pre-push')) return true;
                if (p === mockHooksDir) return true;
                return false;
            });

            hooks.installHooks(['pre-push'], true);

            const hookPath = path.join(mockHooksDir, 'pre-push');
            const hookCalls = fs.writeFileSync.mock.calls.filter(call => call[0] === hookPath);
            
            expect(hookCalls.length).toBe(1);
            expect(hookCalls[0][1]).toContain('npx pushguardian validate');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Hook pre-push installé'));
        });

        test('doit gérer erreur écriture hook', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('.git/hooks/pre-push')) return false;
                if (p.includes('.git/hooks')) return true;
                return true;
            });

            fs.writeFileSync.mockImplementation((p) => {
                if (p.includes('.git/hooks/pre-push')) {
                    throw new Error('Permission denied');
                }
            });

            hooks.installHooks(['pre-push']);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de l\'installation du hook pre-push:'),
                'Permission denied'
            );
        });

        test('doit créer hook avec shebang correct', () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('.git/hooks/pre-push')) return false;
                if (p.includes('.git/hooks')) return true;
                return true;
            });

            hooks.installHooks(['pre-push']);

            const hookCalls = fs.writeFileSync.mock.calls.filter(
                call => call[0].includes('.git/hooks/pre-push')
            );
            const hookContent = hookCalls[0][1];

            expect(hookContent).toMatch(/^#!\/bin\/sh/);
            expect(hookContent).toContain('# PushGuardian pre-push hook');
            expect(hookContent).toContain('|| exit 1');
        });

        test('doit afficher message info validations automatiques', () => {
            hooks.installHooks(['pre-push']);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Les validations se déclencheront automatiquement')
            );
        });

        test('doit appeler createHooksConfig', () => {
            hooks.installHooks(['pre-push']);

            // Vérifie que la config a été créée (dernier writeFileSync pour pushguardian.config.json)
            const configCalls = fs.writeFileSync.mock.calls.filter(
                call => call[0] === mockConfigPath
            );
            expect(configCalls.length).toBeGreaterThan(0);
        });
    });
});
