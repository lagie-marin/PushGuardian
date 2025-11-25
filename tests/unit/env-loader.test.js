const fs = require('fs');
const path = require('path');

jest.mock('fs');

const envLoader = require('../../src/core/module/env-loader');

describe('Core Module - env-loader', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        process.env = { ...originalEnv };
        
        // Setup fs mocks
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('');
        fs.writeFileSync.mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.warn.mockRestore();
        console.error.mockRestore();
        process.env = originalEnv;
    });

    test('le module doit être chargeable', () => {
        expect(envLoader).toBeDefined();
    });

    test('loadEnv doit être une fonction', () => {
        expect(typeof envLoader.loadEnv).toBe('function');
    });

    test('getEnv doit être une fonction', () => {
        expect(typeof envLoader.getEnv).toBe('function');
    });

    describe('getEnv', () => {
        test('doit retourner la valeur de la variable', () => {
            process.env.TEST_VAR = 'test_value';

            const value = envLoader.getEnv('TEST_VAR');

            expect(value).toBe('test_value');
        });

        test('doit retourner la valeur par défaut si la variable n\'existe pas', () => {
            const value = envLoader.getEnv('NON_EXISTENT', 'default');

            expect(value).toBe('default');
        });

        test('doit gérer les variables vides', () => {
            process.env.EMPTY_VAR = '';

            const value = envLoader.getEnv('EMPTY_VAR', 'default');

            expect(value).toBe('default');
        });

        test('doit retourner chaîne vide si pas de valeur par défaut', () => {
            const value = envLoader.getEnv('NON_EXISTENT');

            expect(value).toBe('');
        });

        test('doit throw si werror=true et variable manquante', () => {
            expect(() => envLoader.getEnv('MISSING_VAR', null, true)).toThrow('Variable d\'environnement manquante: MISSING_VAR');
        });

        test('ne doit pas throw si werror=false et variable manquante', () => {
            const value = envLoader.getEnv('MISSING_VAR', null, false);
            expect(value).toBe('');
        });
    });

    describe('loadEnv', () => {
        test('doit afficher warning si fichier .env absent', () => {
            fs.existsSync.mockReturnValue(false);

            envLoader.loadEnv();

            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Fichier .env non trouvé'));
        });

        test('doit charger variables depuis .env', () => {
            const envContent = 'TEST_KEY=test_value\nANOTHER_KEY=another_value';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.TEST_KEY).toBe('test_value');
            expect(process.env.ANOTHER_KEY).toBe('another_value');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Variables d\'environnement chargées'));
        });

        test('doit ignorer lignes vides et commentaires', () => {
            const envContent = '# Comment\n\nKEY=value\n# Another comment';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.KEY).toBe('value');
        });

        test('doit gérer guillemets doubles', () => {
            const envContent = 'QUOTED="value with spaces"';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.QUOTED).toBe('value with spaces');
        });

        test('doit gérer guillemets simples', () => {
            const envContent = 'SINGLE=\'single value\'';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.SINGLE).toBe('single value');
        });

        test('doit remplacer \\n par newline dans guillemets doubles', () => {
            const envContent = 'MULTILINE="line1\\nline2"';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.MULTILINE).toBe('line1\nline2');
        });

        test('ne doit pas écraser variables existantes', () => {
            process.env.EXISTING = 'original';
            const envContent = 'EXISTING=new_value';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.EXISTING).toBe('original');
        });

        test('doit afficher warning pour ligne mal formatée', () => {
            const envContent = 'VALID=value\ninvalid line without equals\nANOTHER=value2';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Ligne 2 ignorée'));
        });

        test('doit gérer erreur de lecture', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            envLoader.loadEnv();

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors du chargement du fichier .env'),
                'Read error'
            );
        });

        test('doit accepter chemin personnalisé', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('KEY=value');

            envLoader.loadEnv('.env.custom');

            expect(fs.readFileSync).toHaveBeenCalled();
        });

        test('doit gérer valeur vide', () => {
            const envContent = 'EMPTY_KEY=';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(envContent);

            envLoader.loadEnv();

            expect(process.env.EMPTY_KEY).toBe('');
        });
    });

    describe('saveEnv', () => {
        test('doit créer nouveau fichier si absent', () => {
            fs.existsSync.mockReturnValue(false);
            fs.writeFileSync.mockImplementation(() => {});

            envLoader.saveEnv('NEW_KEY', 'new_value');

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('NEW_KEY=new_value'),
                'utf8'
            );
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Variable NEW_KEY sauvegardée'));
        });

        test('doit mettre à jour variable existante', () => {
            const existingContent = 'KEY1=value1\nKEY2=value2\nKEY3=value3';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(existingContent);
            fs.writeFileSync.mockImplementation(() => {});

            envLoader.saveEnv('KEY2', 'updated_value');

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('KEY2=updated_value'),
                'utf8'
            );
        });

        test('doit ajouter nouvelle variable si non existante', () => {
            const existingContent = 'KEY1=value1';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(existingContent);
            fs.writeFileSync.mockImplementation(() => {});

            envLoader.saveEnv('KEY2', 'value2');

            const written = fs.writeFileSync.mock.calls[0][1];
            expect(written).toContain('KEY1=value1');
            expect(written).toContain('KEY2=value2');
        });

        test('doit gérer clé avec espaces avant =', () => {
            const existingContent = 'KEY1 = value1';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(existingContent);
            fs.writeFileSync.mockImplementation(() => {});

            envLoader.saveEnv('KEY1', 'new_value');

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('KEY1=new_value'),
                'utf8'
            );
        });

        test('doit gérer erreur d\'écriture', () => {
            fs.existsSync.mockReturnValue(false);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            envLoader.saveEnv('KEY', 'value');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la sauvegarde'),
                'Write error'
            );
        });

        test('doit accepter chemin personnalisé', () => {
            fs.existsSync.mockReturnValue(false);
            fs.writeFileSync.mockImplementation(() => {});

            envLoader.saveEnv('KEY', 'value', '.env.test');

            expect(fs.writeFileSync).toHaveBeenCalled();
        });
    });
});
