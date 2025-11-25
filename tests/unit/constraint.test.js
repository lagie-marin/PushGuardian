const { validateCommitMessage } = require('../../src/hooks/constrains/constrains');
const { ConstraintEngine, constraintEngine } = require('../../src/hooks/constrains/constraintEngine');

describe('Constraint Engine', () => {
    let engine;

    beforeEach(() => {
        engine = new ConstraintEngine();
    });

    describe('Constructor et setupDefaultConstraints', () => {
        test('doit initialiser avec contraintes par défaut', () => {
            expect(engine.constraints.size).toBeGreaterThan(0);
            expect(engine.constraints.has('noUppercase')).toBe(true);
            expect(engine.constraints.has('noDigits')).toBe(true);
            expect(engine.constraints.has('noSpecialChars')).toBe(true);
        });

        test('doit initialiser messages d\'erreur par défaut', () => {
            expect(engine.errorMessages).toBeDefined();
            expect(typeof engine.errorMessages.noUppercase).toBe('function');
            expect(typeof engine.errorMessages.minLength).toBe('function');
        });
    });

    describe('addConstraint', () => {
        test('doit ajouter nouvelle contrainte', () => {
            const customValidator = (value) => value.length > 5;
            const customErrorMsg = () => 'Custom error';

            engine.addConstraint('customLength', customValidator, customErrorMsg);

            expect(engine.constraints.has('customLength')).toBe(true);
            expect(engine.errorMessages.customLength).toBe(customErrorMsg);
        });

        test('doit ajouter contrainte sans message d\'erreur', () => {
            const customValidator = (value) => value.includes('test');

            engine.addConstraint('mustContainTest', customValidator);

            expect(engine.constraints.has('mustContainTest')).toBe(true);
        });
    });

    describe('getErrorMessage', () => {
        test('doit retourner message d\'erreur personnalisé', () => {
            const message = engine.getErrorMessage('minLength', 10);
            expect(message).toBe('Le message doit contenir au moins 10 caractères');
        });

        test('doit retourner message par défaut pour contrainte inconnue', () => {
            const message = engine.getErrorMessage('unknownConstraint');
            expect(message).toBe('Erreur de validation: unknownConstraint');
        });

        test('doit gérer contrainte sans message défini', () => {
            engine.constraints.set('noMessage', () => true);
            const message = engine.getErrorMessage('noMessage');
            expect(message).toBe('Erreur de validation: noMessage');
        });
    });

    describe('validate - gestion des contraintes inconnues', () => {
        test('doit détecter contrainte inconnue', async () => {
            const constraints = {
                constraints: {
                    unknownConstraint: true
                }
            };

            const result = await engine.validate('test', constraints);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Contrainte inconnue: unknownConstraint');
        });

        test('doit valider si aucune contrainte', async () => {
            const result = await engine.validate('test', {});

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Validation des messages de commit', () => {
        test('Doit valider un message de commit avec un type autorisé', async () => {
            const constraints = {
                type: ['feat', 'fix', 'chore'],
                constraints: {}
            };

            const result = await engine.validate(
                '[feat]: Add new feature',
                constraints,
                validateCommitMessage
            );
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('Doit rejeter un message de commit avec un type non autorisé', async () => {
            const constraints = {
                type: ['feat', 'fix', 'chore'],
                constraints: {}
            };

            const result = await engine.validate('[invalid]: Add new feature', constraints, validateCommitMessage);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le type "invalid" n\'est pas valide. Types autorisés: feat, fix, chore');
        });

        test('Doit rejeter un message de commit mal formaté', async () => {
            const constraints = {
                type: ['feat', 'fix', 'chore'],
                constraints: {}
            };

            const result = await engine.validate('feat Add new feature', constraints, validateCommitMessage);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Le message de commit n'est pas correctement formaté (ex: [TYPE]: message)\n\t\tVotre message: feat Add new feature"
            );
        });

        test('Doit valider le message après extraction du type', async () => {
            const constraints = {
                type: ['feat', 'fix'],
                constraints: {
                    minLength: 10,
                    noUppercase: true
                }
            };

            const result = await engine.validate(
                '[feat]: add new feature description',
                constraints,
                validateCommitMessage
            );
            expect(result.isValid).toBe(true);
        });

        test('Doit appliquer les contraintes au message après extraction du type', async () => {
            const constraints = {
                type: ['feat'],
                constraints: {
                    noUppercase: true,
                    minLength: 10
                }
            };

            const result = await engine.validate('[feat]: SHORT', constraints, validateCommitMessage);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le message ne doit pas contenir de lettres majuscules');
            expect(result.errors).toContain('Le message doit contenir au moins 10 caractères');
        });
    });

    describe('Contraintes de base', () => {
        test('noUppercase - doit rejeter les majuscules', async () => {
            expect((await engine.validate('hello', { constraints: { noUppercase: true } })).isValid).toBe(true);
            expect((await engine.validate('Hello', { constraints: { noUppercase: true } })).isValid).toBe(false);
            expect((await engine.validate('HELLO', { constraints: { noUppercase: true } })).isValid).toBe(false);
        });

        test('noDigits - doit rejeter les chiffres', async () => {
            expect((await engine.validate('hello', { constraints: { noDigits: true } })).isValid).toBe(true);
            expect((await engine.validate('hello123', { constraints: { noDigits: true } })).isValid).toBe(false);
            expect((await engine.validate('123', { constraints: { noDigits: true } })).isValid).toBe(false);
        });

        test('noSpecialChars - doit rejeter les caractères spéciaux', async () => {
            expect((await engine.validate('hello', { constraints: { noSpecialChars: true } })).isValid).toBe(true);
            expect((await engine.validate('hello!', { constraints: { noSpecialChars: true } })).isValid).toBe(false);
            expect((await engine.validate('hello@world', { constraints: { noSpecialChars: true } })).isValid).toBe(
                false
            );
            expect((await engine.validate('hello world', { constraints: { noSpecialChars: true } })).isValid).toBe(
                true
            );
        });

        test('noSpecialChars - doit autoriser les espaces', async () => {
            expect((await engine.validate('hello world', { constraints: { noSpecialChars: true } })).isValid).toBe(
                true
            );
            expect((await engine.validate('hello-world', { constraints: { noSpecialChars: true } })).isValid).toBe(
                true
            );
        });
    });

    describe('Contraintes de longueur', () => {
        test('maxLength - doit respecter la longueur maximale', async () => {
            expect((await engine.validate('hello', { constraints: { maxLength: 10 } })).isValid).toBe(true);
            expect((await engine.validate('hello world', { constraints: { maxLength: 10 } })).isValid).toBe(false);
            expect((await engine.validate('', { constraints: { maxLength: 10 } })).isValid).toBe(true);
        });

        test('minLength - doit respecter la longueur minimale', async () => {
            expect((await engine.validate('hello', { constraints: { minLength: 3 } })).isValid).toBe(true);
            expect((await engine.validate('hi', { constraints: { minLength: 3 } })).isValid).toBe(false);
            expect((await engine.validate('', { constraints: { minLength: 1 } })).isValid).toBe(false);
        });

        test('minLength et maxLength combinés', async () => {
            const constraints = { constraints: { minLength: 5, maxLength: 10 } };
            expect((await engine.validate('hello', constraints)).isValid).toBe(true);
            expect((await engine.validate('hi', constraints)).isValid).toBe(false);
            expect((await engine.validate('hello world', constraints)).isValid).toBe(false);
        });

        test('minLength = 0 doit autoriser les chaînes vides', async () => {
            expect((await engine.validate('', { constraints: { minLength: 0 } })).isValid).toBe(true);
        });
    });

    describe('Contraintes de préfixe/suffixe', () => {
        test('mustStartWith - doit commencer par le préfixe', async () => {
            expect(
                (await engine.validate('feat: new feature', { constraints: { mustStartWith: 'feat:' } })).isValid
            ).toBe(true);
            expect((await engine.validate('fix: bug', { constraints: { mustStartWith: 'feat:' } })).isValid).toBe(
                false
            );
            expect((await engine.validate(' feat: space', { constraints: { mustStartWith: 'feat:' } })).isValid).toBe(
                false
            );
        });

        test('mustEndWith - doit terminer par le suffixe', async () => {
            expect((await engine.validate('Hello!', { constraints: { mustEndWith: '!' } })).isValid).toBe(true);
            expect((await engine.validate('Hello', { constraints: { mustEndWith: '!' } })).isValid).toBe(false);
            expect((await engine.validate('Hello! ', { constraints: { mustEndWith: '!' } })).isValid).toBe(false);
        });

        test('mustStartWith avec chaîne vide doit toujours valider', async () => {
            expect((await engine.validate('hello', { constraints: { mustStartWith: '' } })).isValid).toBe(true);
        });

        test('mustStartWith et mustEndWith combinés', async () => {
            const constraints = { constraints: { mustStartWith: '[URGENT]', mustEndWith: '!' } };
            expect((await engine.validate('[URGENT] Important message!', constraints)).isValid).toBe(true);
            expect((await engine.validate('[URGENT] Important message', constraints)).isValid).toBe(false);
            expect((await engine.validate('Important message!', constraints)).isValid).toBe(false);
        });
    });

    describe('Contraintes de types et mots', () => {
        test('disallowedWords - doit rejeter les mots interdits', async () => {
            const forbidden = ['spam', 'WIP', 'temp'];
            expect(
                (await engine.validate('Hello world', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(true);
            expect(
                (await engine.validate('This is WIP', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(false);
            expect(
                (await engine.validate('This is a temp file', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(false);
            expect(
                (await engine.validate('No spam here', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(false);
        });

        test('disallowedWords - sensible à la casse', async () => {
            const forbidden = ['wip'];
            expect(
                (await engine.validate('This is wips', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(true);
            expect(
                (await engine.validate('This is wip', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(false);
        });

        test('disallowedWords - doit ignorer les mots partiels', async () => {
            const forbidden = ['temp'];
            expect(
                (await engine.validate('This is temperature', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(true);
            expect(
                (await engine.validate('This is temp file', { constraints: { disallowedWords: forbidden } })).isValid
            ).toBe(false);
        });
    });

    describe('Contraintes regex', () => {
        test('mustMatchPattern - doit correspondre au pattern', async () => {
            const pattern = '^\\[[A-Z]+\\]: .+';
            expect(
                (await engine.validate('[FEAT]: New feature', { constraints: { mustMatchPattern: pattern } })).isValid
            ).toBe(true);
            expect(
                (await engine.validate('feat: New feature', { constraints: { mustMatchPattern: pattern } })).isValid
            ).toBe(false);
            expect(
                (await engine.validate('[feat]: New feature', { constraints: { mustMatchPattern: pattern } })).isValid
            ).toBe(false);
        });

        test('mustNotMatchPattern - ne doit pas correspondre au pattern', async () => {
            const pattern = '\\bWIP\\b';
            expect(
                (await engine.validate('Work in progress', { constraints: { mustNotMatchPattern: pattern } })).isValid
            ).toBe(true);
            expect(
                (await engine.validate('This is WIP', { constraints: { mustNotMatchPattern: pattern } })).isValid
            ).toBe(false);
            expect(
                (await engine.validate('WIP: Not done', { constraints: { mustNotMatchPattern: pattern } })).isValid
            ).toBe(false);
        });

        test('mustMatchPattern avec pattern complexe', async () => {
            const pattern = '^(feat|fix|chore): [A-Z].+\\.$';
            expect(
                (await engine.validate('feat: Add new feature.', { constraints: { mustMatchPattern: pattern } }))
                    .isValid
            ).toBe(true);
            expect(
                (await engine.validate('fix: Fix bug.', { constraints: { mustMatchPattern: pattern } })).isValid
            ).toBe(true);
            expect(
                (await engine.validate('feat: add feature', { constraints: { mustMatchPattern: pattern } })).isValid
            ).toBe(false);
            expect(
                (await engine.validate('feat: Add feature', { constraints: { mustMatchPattern: pattern } })).isValid
            ).toBe(false);
        });

        test('mustMatchPattern avec regex invalide doit retourner false', async () => {
            const invalidPattern = 'invalid[regex';
            expect((await engine.validate('test', { constraints: { mustMatchPattern: invalidPattern } })).isValid).toBe(
                false
            );
        });
    });

    describe("Contraintes d'espacement", () => {
        test('noEmptyMessage - message non vide', async () => {
            expect((await engine.validate('Hello', { constraints: { noEmptyMessage: true } })).isValid).toBe(true);
            expect((await engine.validate('', { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
            expect((await engine.validate('   ', { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
            expect((await engine.validate('\t\n', { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
        });
    });

    describe('Combinaisons complexes', () => {
        test('Commit conventionnel complexe', async () => {
            const constraints = {
                constraints: {
                    maxLength: 50,
                    minLength: 15,
                    noEmptyMessage: true
                }
            };

            expect((await engine.validate('feat: add new authentication system', constraints)).isValid).toBe(true);
            expect((await engine.validate('fix: resolve memory leak', constraints)).isValid).toBe(true);
            expect((await engine.validate('docs: update documentation', constraints)).isValid).toBe(true);
            expect((await engine.validate('invalid:', constraints)).isValid).toBe(false);
            expect((await engine.validate('feat: short', constraints)).isValid).toBe(false);
            expect(
                (await engine.validate('feat: too long message that exceeds the maximum length limit', constraints))
                    .isValid
            ).toBe(false);
        });

        test('Message utilisateur avec multiples restrictions', async () => {
            const constraints = {
                constraints: {
                    noUppercase: true,
                    noDigits: true,
                    noSpecialChars: true,
                    maxLength: 50,
                    minLength: 5,
                    disallowedWords: ['spam', 'ads', 'promotion']
                }
            };

            expect((await engine.validate('hello this is a valid message', constraints)).isValid).toBe(true);
            expect((await engine.validate('Hello with uppercase', constraints)).isValid).toBe(false);
            expect((await engine.validate('message with 123', constraints)).isValid).toBe(false);
            expect((await engine.validate('message with spam word', constraints)).isValid).toBe(false);
            expect((await engine.validate('hi ', constraints)).isValid).toBe(false);
        });
    });

    describe('Gestion des erreurs', () => {
        test("Doit retourner les messages d'erreur appropriés", async () => {
            const result = await engine.validate('HELLO123!', {
                constraints: {
                    noUppercase: true,
                    noDigits: true,
                    noSpecialChars: true,
                    maxLength: 5
                }
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le message ne doit pas contenir de lettres majuscules');
            expect(result.errors).toContain('Le message ne doit pas contenir de chiffres');
            expect(result.errors).toContain('Le message ne doit pas contenir de caractères spéciaux');
            expect(result.errors).toContain('Le message ne doit pas dépasser 5 caractères');
        });

        test('Contrainte inconnue doit retourner une erreur', async () => {
            const result = await engine.validate('hello', { constraints: { unknownConstraint: true } });
            expect(result.errors).toContain('Contrainte inconnue: unknownConstraint');
        });

        test('Message vide avec contraintes multiples', async () => {
            const result = await engine.validate('', {
                constraints: {
                    noEmptyMessage: true,
                    minLength: 1,
                    mustStartWith: 'hello'
                }
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(3);
        });

        test('Doit retourner toutes les erreurs en une seule validation', async () => {
            const result = await engine.validate('HELLO123! ', {
                constraints: {
                    noUppercase: true,
                    noDigits: true,
                    noSpecialChars: true,
                    maxLength: 5
                }
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(4);
        });
    });

    describe('Contraintes personnalisées', () => {
        test('Ajout de contrainte personnalisée', async () => {
            engine.addConstraint(
                'noConsecutiveSpaces',
                (value) => !/\s{2,}/.test(value),
                () => "Le message ne doit pas contenir d'espaces consécutifs"
            );

            const result = await engine.validate('Hello  world', { constraints: { noConsecutiveSpaces: true } });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Le message ne doit pas contenir d'espaces consécutifs");
        });

        test('Contrainte personnalisée avec paramètre', async () => {
            engine.addConstraint(
                'maxWords',
                (value, max) => value.split(/\s+/).length <= max,
                (max) => `Le message ne doit pas dépasser ${max} mots`
            );

            const result = await engine.validate('hello world test', { constraints: { maxWords: 2 } });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le message ne doit pas dépasser 2 mots');
        });

        test("Contrainte personnalisée sans message d'erreur personnalisé", async () => {
            engine.addConstraint('simpleConstraint', (value) => value === 'valid');

            const result1 = await engine.validate('valid', { constraints: { simpleConstraint: true } });
            const result2 = await engine.validate('invalid', { constraints: { simpleConstraint: true } });

            expect(result1.isValid).toBe(true);
            expect(result2.isValid).toBe(false);
            expect(result2.errors).toContain('Erreur de validation: simpleConstraint');
        });
    });

    describe('Cas limites', () => {
        test('Chaîne vide selon différentes contraintes', async () => {
            expect((await engine.validate('', { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
            expect((await engine.validate('', { constraints: { minLength: 1 } })).isValid).toBe(false);
            expect((await engine.validate('', { constraints: { mustStartWith: 'hello' } })).isValid).toBe(false);
            expect((await engine.validate('', { constraints: { maxLength: 10 } })).isValid).toBe(true);
        });

        test('Chaîne avec seulement des espaces', async () => {
            expect((await engine.validate('   ', { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
        });

        test('Paramètres spéciaux', async () => {
            expect((await engine.validate('hello', { constraints: { maxLength: 0 } })).isValid).toBe(false);
            expect((await engine.validate('', { constraints: { minLength: 0 } })).isValid).toBe(true);
            expect((await engine.validate('hello', { constraints: { mustStartWith: '' } })).isValid).toBe(true);
        });

        test('Unicode et caractères spéciaux', async () => {
            expect((await engine.validate('café', { constraints: { noSpecialChars: true } })).isValid).toBe(true);
            expect((await engine.validate('hello 🎉', { constraints: { noSpecialChars: true } })).isValid).toBe(true);
            expect((await engine.validate('price: $100', { constraints: { noSpecialChars: true } })).isValid).toBe(
                false
            );
        });

        test('Chaîne null ou undefined', async () => {
            expect((await engine.validate(null, { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
            expect((await engine.validate(undefined, { constraints: { noEmptyMessage: true } })).isValid).toBe(false);
        });
    });
});

describe('Instance globale constraintEngine', () => {
    test('Doit fonctionner identiquement à une nouvelle instance', async () => {
        const result1 = await constraintEngine.validate('hello', { constraints: { noUppercase: true } });
        const result2 = await new ConstraintEngine().validate('hello', { constraints: { noUppercase: true } });

        expect(result1.isValid).toBe(result2.isValid);
    });

    test('Doit conserver les contraintes personnalisées ajoutées', () => {
        constraintEngine.addConstraint('testConstraint', () => true);
        expect(constraintEngine.constraints.has('testConstraint')).toBe(true);
    });

    test('Doit partager les mêmes contraintes par défaut entre instances', () => {
        const engine1 = new ConstraintEngine();
        const engine2 = new ConstraintEngine();

        expect(engine1.constraints.has('noUppercase')).toBe(true);
        expect(engine2.constraints.has('noUppercase')).toBe(true);
    });
});
