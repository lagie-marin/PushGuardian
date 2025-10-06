const { loadConfig } = require('./configManager');
const fs = require('fs');
const execa = require('../utils/exec-wrapper');
const { constrains } = require('../hooks/constrains/constrains');

async function validateCode(argument = {}, options = {}) {
    const config = loadConfig();
    try {
        if (config.validate.activateCQT) {
            const directories = config.validate.directories;
            const eslintArgs = ['eslint'];
            var dirNF = [];

            if (options.hooks) await constrains(options.hooks, argument);
            if (options.fix) eslintArgs.push('--fix');
            if (options.strict) eslintArgs.push('--max-warnings=0');

            if (directories.length === 0) {
                console.error('❌ Aucun dossier à valider. Vérifiez votre configuration.');
                process.exit(1);
            }

            for (const dir of directories) {
                if (!fs.existsSync(dir)) {
                    dirNF.push(dir);
                }
            }

            const validDirectories = directories.filter((dir) => !dirNF.includes(dir));

            if (validDirectories.length === 0) {
                if (config.validate.onMissing === 'error') {
                    console.error('❌ Aucun dossier valide à valider. Vérifiez votre configuration.');
                    process.exit(1);
                }
                return { success: true, errors: [] };
            }

            if (config.validate.config) {
                eslintArgs.push('--config', config.validate.config);
            }

            eslintArgs.push(...validDirectories);

            await execa('npx', eslintArgs);
        }
        return { success: true, errors: [] };
    } catch (error) {
        return { success: false, errors: [error.stdout || error.message] };
    }
}

module.exports = { validateCode };
