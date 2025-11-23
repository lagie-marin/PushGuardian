const fs = require('fs');
const path = require('path');
const configGenerator = require('./configGenerator');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

async function createGlobalConfig(selectedTools) {
    const eslintConfigPath = 'eslint.config.js';

    const { existingPlugins, existingFilesPatterns } = await loadExistingConfig(eslintConfigPath);

    if (configGenerator.shouldSkipConfigUpdate(selectedTools, existingPlugins, existingFilesPatterns)) {
        return;
    }

    const imports = configGenerator.generateImports(selectedTools, existingPlugins);
    const newConfigs = configGenerator.generateNewConfigs(selectedTools, existingPlugins, existingFilesPatterns);

    if (newConfigs.length === 0) {
        return;
    }

    const configContent = `${imports}

const baseConfig = require('./eslint.config.js');
const additionalConfigs = [
${newConfigs.join(',\n')}
];

module.exports = [...baseConfig, ...additionalConfigs];
`;

    if (fs.existsSync(eslintConfigPath)) {
        fs.renameSync(eslintConfigPath, 'eslint.config.old.js');
    }

    fs.writeFileSync(eslintConfigPath, configContent);
    console.log(chalk.green('📄 Configuration ESLint mise à jour'));
}

async function loadExistingConfig(eslintConfigPath) {
    const existingConfig = [];
    const existingPlugins = new Set();
    const existingFilesPatterns = new Set();

    if (fs.existsSync(eslintConfigPath)) {
        try {
            const config = require(path.resolve(process.cwd(), eslintConfigPath));
            const configArray = Array.isArray(config) ? config : [config];

            configArray.forEach((item) => {
                configGenerator.analyzeExistingConfig(item, existingPlugins, existingFilesPatterns);
            });

            existingConfig.push(...configArray);
            console.log(chalk.green('📄 Configuration ESLint existante détectée'));
        } catch {
            console.log(chalk.yellow('⚠️  Erreur lors de la lecture de la configuration existante'));
        }
    }

    return { existingConfig, existingPlugins, existingFilesPatterns };
}

module.exports = { createGlobalConfig, loadExistingConfig };
