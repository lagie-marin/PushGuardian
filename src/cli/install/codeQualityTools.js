const { default: chalk } = require('chalk');
const interactiveMenu = require('../../core/interactiveMenu/interactiveMenu');
const configAnalyzer = require('../../core/codeQualityTools/configAnalyzer');
const fileDetector = require('../../core/codeQualityTools/fileDetector');
const toolInstaller = require('../../core/codeQualityTools/toolInstaller');
const languageTools = require('../../core/codeQualityTools/languageTools');
const fs = require('fs');

function createCodeQualityConfig(installedTools) {
    const config = {
        validate: {
            directories: ['src/'],
            onMissing: 'ignore',
            activateCQT: true
        }
    };

    const configFilePath = 'pushguardian.config.json';

    try {
        let existingConfig = {};

        if (fs.existsSync(configFilePath)) {
            try {
                const existingContent = fs.readFileSync(configFilePath, 'utf8');
                existingConfig = JSON.parse(existingContent);
            } catch (error) {}
        }

        existingConfig.validate = config.validate;

        if (!existingConfig.install) existingConfig.install = {};
        existingConfig.install.CQT = installedTools;

        fs.writeFileSync(configFilePath, JSON.stringify(existingConfig, null, 4));
        console.log(chalk.green('📄 Configuration des outils de qualité de code mise à jour avec succès.'));
    } catch (error) {
        console.log(
            chalk.red('❌ Erreur lors de la création de la configuration des outils de qualité de code:'),
            error.message
        );
    }
}

async function installCodeQualityTools(all = false, preselectedTools = []) {
    try {
        const existingAnalysis = await configAnalyzer.analyzeExistingConfig();
        const detectedFiles = await fileDetector.detectFileTypes();
        const allTools = Object.keys(languageTools.LANGUAGE_TOOLS);

        const configuredTools = allTools.filter((tool) => {
            const pluginName = getPluginNameForTool(tool);
            const isConfigured = pluginName ? existingAnalysis.plugins.has(pluginName) : false;
            return isConfigured;
        });

        const detectedTools = allTools.filter((tool) => {
            const langKey = tool.split(' ')[0].toLowerCase();
            const isDetected = detectedFiles[langKey];
            return isDetected;
        });

        if (configuredTools.length === allTools.length) {
            return [];
        }

        const availableTools = allTools.filter((tool) => !configuredTools.includes(tool));

        availableTools.forEach((tool) => {
            console.log(chalk.blue(`  - ${tool}`));
        });

        if (availableTools.length === 0) {
            return [];
        }

        const preselected = availableTools
            .map((tool, index) => (detectedTools.includes(tool) ? index : -1))
            .filter((index) => index !== -1);
        let selected = preselected;

        if (preselectedTools.length > 0) {
            selected = preselectedTools.filter((tool) => availableTools.includes(tool));
        } else if (all) {
            selected = availableTools;
        } else if (!all) {
            selected = await interactiveMenu(
                'Choisissez les langages à analyser avec ESLint:',
                availableTools,
                selected
            );
        }
        console.log(chalk.blue('\n📦 Installation des outils de base...'));
        await toolInstaller.installBaseTools();

        const toolNamesToInstall =
            selected.length > 0 && typeof selected[0] === 'string'
                ? selected
                : selected.map((index) => availableTools[index]);

        for (const toolName of toolNamesToInstall) {
            const toolConfig = languageTools.LANGUAGE_TOOLS[toolName];

            if (toolConfig) {
                console.log(chalk.blue(`\n📦 Installation pour ${toolName}...`));
                await toolInstaller.installLanguageTools(toolConfig);
            }
        }

        const fs = require('fs');
        const path = require('path');
        const eslintConfigPath = path.join(process.cwd(), 'eslint.config.js');

        if (!fs.existsSync(eslintConfigPath)) {
            console.log(chalk.blue('\n📝 Création du fichier ESLint...'));
            const configGenerator = require('../../core/codeQualityTools/configGenerator');

            const imports = configGenerator.generateImports(selected, new Set());
            const newConfigs = configGenerator.generateNewConfigs(selected, new Set(), new Set());
            const configContent = configGenerator.buildNewConfigContent(imports, newConfigs);

            fs.writeFileSync(eslintConfigPath, configContent);
            console.log(chalk.green('📄 Fichier ESLint créé avec les configurations des plugins'));
        }

        await configAnalyzer.updateEslintConfig(toolNamesToInstall, existingAnalysis);

        createCodeQualityConfig(toolNamesToInstall);

        console.log(chalk.green('\n✅ Configuration de Code Quality Tools terminée!'));
        return toolNamesToInstall;
    } catch (error) {
        console.log(chalk.red('❌ Erreur during setup:'), error.message);
        throw error;
    }
}

function getPluginNameForTool(tool) {
    const pluginMap = {
        'JavaScript (ESLint)': null,
        'TypeScript (TypeScript ESLint)': '@typescript-eslint',
        'JSON (ESLint Plugin)': 'eslint-plugin-json',
        'Markdown (ESLint Plugin)': '@eslint/markdown',
        'CSS/SCSS (Stylelint)': 'stylelint',
        'YAML (ESLint Plugin)': 'eslint-plugin-yaml',
        'HTML (ESLint Plugin)': 'eslint-plugin-html',
        'Nuxt (ESLint Plugin)': 'eslint-plugin-nuxt'
    };

    return pluginMap[tool];
}
module.exports = { installCodeQualityTools };
