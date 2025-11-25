const fs = require('fs');
const path = require('path');
<<<<<<< HEAD
const { default: chalk } = require('chalk');
=======
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();
>>>>>>> feat/tests

async function detectFileTypes() {
    const detected = {
        javascript: false,
        typescript: false,
        json: false,
        markdown: false,
        css: false,
        yaml: false,
        html: false
    };

    const ignoredDirectories = ['node_modules', '.git', 'dist', 'build'];

    async function scanDirectory(directory) {
        try {
            const files = await fs.promises.readdir(directory, { withFileTypes: true });

            for (const file of files) {
                const filePath = path.join(directory, file.name);

                if (file.isDirectory()) {
                    if (!ignoredDirectories.includes(file.name)) {
                        await scanDirectory(filePath);
                    }
                } else {
                    detectFileType(file.name, detected);
                }
            }
        } catch (error) {
            console.log(chalk.yellow(`⚠️  Erreur lors de la lecture du répertoire ${directory}:`), error.message);
        }
    }

    await scanDirectory(process.cwd());
    return detected;
}

function detectFileType(filename, detected) {
    const fileTypes = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.json': 'json',
        '.md': 'markdown',
        '.css': 'css',
        '.scss': 'css',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.html': 'html'
    };

    const extension = path.extname(filename).toLowerCase();
    if (fileTypes[extension]) {
        detected[fileTypes[extension]] = true;
    }
}

module.exports = { detectFileTypes, detectFileType };
