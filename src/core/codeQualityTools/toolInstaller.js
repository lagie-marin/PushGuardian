const fs = require('fs');
const { getChalk } = require('../../utils/chalk-wrapper');
const execa = require('../../utils/exec-wrapper');
const chalk = getChalk();
async function installBaseTools() {
    try {
        await execa(
            'npm',
            [
                'install',
                '-s',
                '--save-dev',
                'prettier',
                'eslint',
                '@eslint/markdown',
                'eslint-plugin-prettier',
                'globals'
            ],
            { stdio: 'inherit' }
        );

        const prettierConfig = {
            semi: true,
            singleQuote: true,
            printWidth: 120,
            tabWidth: 4,
            trailingComma: 'none'
        };

        fs.writeFileSync('.prettierrc', JSON.stringify(prettierConfig, null, 2));
        console.log(chalk.green('✅ Prettier et ESLint installés avec configuration par défaut.'));
    } catch (error) {
        console.log(chalk.yellow('⚠️  Warning during base tools installation:'), error.message);
    }
}

async function installLanguageTools(toolConfig) {
    try {
        if (toolConfig.packages && toolConfig.packages.length > 0) {
            await execa('npm', ['install', '-s', '--save-dev', ...toolConfig.packages], {
                stdio: 'inherit'
            });
        }

        if (toolConfig.setup) {
            await toolConfig.setup();
        }
    } catch (error) {
        console.log(chalk.yellow(`⚠️  Warning: ${error.message}`));
    }
}

module.exports = { installBaseTools, installLanguageTools };
