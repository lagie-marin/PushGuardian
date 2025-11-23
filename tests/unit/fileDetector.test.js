const fs = require('fs');
const path = require('path');
const { detectFileTypes, detectFileType } = require('../../src/core/codeQualityTools/fileDetector');

jest.mock('fs');

describe('Core CodeQualityTools - fileDetector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('detectFileType', () => {
        test('doit détecter les fichiers JavaScript', () => {
            const detected = { javascript: false };
            detectFileType('app.js', detected);
            expect(detected.javascript).toBe(true);
        });

        test('doit détecter les fichiers TypeScript', () => {
            const detected = { typescript: false };
            detectFileType('app.ts', detected);
            expect(detected.typescript).toBe(true);
        });

        test('doit détecter les fichiers JSON', () => {
            const detected = { json: false };
            detectFileType('package.json', detected);
            expect(detected.json).toBe(true);
        });

        test('doit détecter les fichiers Markdown', () => {
            const detected = { markdown: false };
            detectFileType('README.md', detected);
            expect(detected.markdown).toBe(true);
        });

        test('doit détecter les fichiers CSS', () => {
            const detected = { css: false };
            detectFileType('styles.css', detected);
            expect(detected.css).toBe(true);
        });

        test('doit détecter les fichiers SCSS comme CSS', () => {
            const detected = { css: false };
            detectFileType('styles.scss', detected);
            expect(detected.css).toBe(true);
        });

        test('doit détecter les fichiers YAML', () => {
            const detected = { yaml: false };
            detectFileType('config.yaml', detected);
            expect(detected.yaml).toBe(true);
        });

        test('doit détecter les fichiers YML comme YAML', () => {
            const detected = { yaml: false };
            detectFileType('config.yml', detected);
            expect(detected.yaml).toBe(true);
        });

        test('doit détecter les fichiers HTML', () => {
            const detected = { html: false };
            detectFileType('index.html', detected);
            expect(detected.html).toBe(true);
        });

        test('ne doit pas détecter les fichiers inconnus', () => {
            const detected = { javascript: false, typescript: false };
            detectFileType('file.txt', detected);
            expect(detected.javascript).toBe(false);
            expect(detected.typescript).toBe(false);
        });

        test('doit être insensible à la casse', () => {
            const detected = { javascript: false };
            detectFileType('APP.JS', detected);
            expect(detected.javascript).toBe(true);
        });
    });

    describe('detectFileTypes', () => {
        test('doit détecter les types de fichiers dans le répertoire', async () => {
            const mockFiles = [
                { name: 'app.js', isDirectory: () => false },
                { name: 'index.ts', isDirectory: () => false },
                { name: 'package.json', isDirectory: () => false }
            ];

            fs.promises = {
                readdir: jest.fn().mockResolvedValue(mockFiles)
            };

            const result = await detectFileTypes();

            expect(result.javascript).toBe(true);
            expect(result.typescript).toBe(true);
            expect(result.json).toBe(true);
        });

        test('doit ignorer node_modules', async () => {
            const mockFiles = [
                { name: 'node_modules', isDirectory: () => true },
                { name: 'app.js', isDirectory: () => false }
            ];

            fs.promises = {
                readdir: jest.fn().mockResolvedValue(mockFiles)
            };

            const result = await detectFileTypes();

            expect(fs.promises.readdir).toHaveBeenCalledTimes(1);
        });

        test('doit ignorer .git', async () => {
            const mockFiles = [
                { name: '.git', isDirectory: () => true },
                { name: 'app.js', isDirectory: () => false }
            ];

            fs.promises = {
                readdir: jest.fn().mockResolvedValue(mockFiles)
            };

            const result = await detectFileTypes();

            expect(fs.promises.readdir).toHaveBeenCalledTimes(1);
        });

        test('doit gérer les erreurs de lecture', async () => {
            fs.promises = {
                readdir: jest.fn().mockRejectedValue(new Error('Permission denied'))
            };

            const result = await detectFileTypes();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Erreur lors de la lecture du répertoire'),
                expect.anything()
            );
            expect(result).toBeDefined();
        });

        test('doit scanner les sous-répertoires', async () => {
            const mockRootFiles = [
                { name: 'src', isDirectory: () => true },
                { name: 'app.js', isDirectory: () => false }
            ];
            const mockSrcFiles = [
                { name: 'index.ts', isDirectory: () => false }
            ];

            fs.promises = {
                readdir: jest
                    .fn()
                    .mockResolvedValueOnce(mockRootFiles)
                    .mockResolvedValueOnce(mockSrcFiles)
            };

            const result = await detectFileTypes();

            expect(result.javascript).toBe(true);
            expect(result.typescript).toBe(true);
        });
    });
});
