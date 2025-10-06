const { default: chalk } = require('chalk');
const interactiveMenu = require('../../core/interactiveMenu/interactiveMenu');
const createPushGuardianConfig = require('../../core/createPushGuardianConfig');
const { saveConfig, loadConfig } = require('../../core/configManager');
const configAnalyzer = require('../../core/codeQualityTools/configAnalyzer');
const fileDetector = require('../../core/codeQualityTools/fileDetector');
const toolInstaller = require('../../core/codeQualityTools/toolInstaller');
const languageTools = require('../../core/codeQualityTools/languageTools');

async function installCodeQualityTools() {
    try {
        console.log(chalk.blue('🔍 Analyse de la configuration existante...'));

        const existingAnalysis = await configAnalyzer.analyzeExistingConfig();

        console.log(chalk.yellow('🔧 DEBUG - Plugins détectés:'), Array.from(existingAnalysis.plugins));
        console.log(chalk.yellow('🔧 DEBUG - Fichiers patterns détectés:'), Array.from(existingAnalysis.filePatterns));

        const detectedFiles = await fileDetector.detectFileTypes();
        console.log(chalk.yellow('🔧 DEBUG - Fichiers détectés:'), detectedFiles);

        const allTools = Object.keys(languageTools.LANGUAGE_TOOLS);
        console.log(chalk.yellow('🔧 DEBUG - Tous les outils:'), allTools);

        const configuredTools = allTools.filter((tool) => {
            const pluginName = getPluginNameForTool(tool);
            const isConfigured = pluginName ? existingAnalysis.plugins.has(pluginName) : false;
            console.log(chalk.yellow(`🔧 DEBUG - ${tool}: plugin=${pluginName}, configuré=${isConfigured}`));
            return isConfigured;
        });

        const detectedTools = allTools.filter((tool) => {
            const langKey = tool.split(' ')[0].toLowerCase();
            const isDetected = detectedFiles[langKey];
            console.log(chalk.yellow(`🔧 DEBUG - ${tool}: langKey=${langKey}, détecté=${isDetected}`));
            return isDetected;
        });

        console.log(chalk.blue(`📊 Outils déjà configurés: ${configuredTools.join(', ') || 'Aucun'}`));
        console.log(chalk.blue(`📊 Langages détectés dans le projet: ${detectedTools.join(', ') || 'Aucun'}`));

        if (configuredTools.length === allTools.length) {
            console.log(chalk.green('✅ Tous les outils sont déjà configurés !'));
            return [];
        }

        const availableTools = allTools.filter((tool) => !configuredTools.includes(tool));

        console.log(
            chalk.blue(`📋 Outils disponibles pour installation (${availableTools.length}/${allTools.length}):`)
        );
        availableTools.forEach((tool) => {
            console.log(chalk.blue(`  - ${tool}`));
        });

        if (availableTools.length === 0) {
            console.log(chalk.yellow('ℹ️  Aucun outil à installer.'));
            return [];
        }

        const preselected = availableTools
            .map((tool, index) => (detectedTools.includes(tool) ? index : -1))
            .filter((index) => index !== -1);

        const selected = await interactiveMenu(
            'Choisissez les langages à analyser avec ESLint:',
            availableTools,
            preselected
        );

        if (selected.length === 0) {
            console.log(chalk.yellow('ℹ️  Aucun outil sélectionné.'));
            return [];
        }

        console.log(chalk.blue('\n📦 Installation des outils de base...'));
        await toolInstaller.installBaseTools();

        for (const choiceIndex of selected) {
            const toolName = availableTools[choiceIndex];
            const toolConfig = languageTools.LANGUAGE_TOOLS[toolName];

            if (toolConfig) {
                console.log(chalk.blue(`\n📦 Installation pour ${toolName}...`));
                await toolInstaller.installLanguageTools(toolConfig);
            }
        }

        const selectedToolNames = selected.map((index) => availableTools[index]);
        await configAnalyzer.updateEslintConfig(selectedToolNames, existingAnalysis);

        createPushGuardianConfig();

        const config = loadConfig();
        config.validate.activateCQT = true;
        saveConfig(config);

        console.log(chalk.green('\n✅ Configuration de Code Quality Tools terminée!'));
        return selectedToolNames;
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
        'HTML (ESLint Plugin)': 'eslint-plugin-html'
    };

    return pluginMap[tool];
}
module.exports = { installCodeQualityTools };
