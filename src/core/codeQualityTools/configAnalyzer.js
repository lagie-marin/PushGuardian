const fs = require('fs');
<<<<<<< HEAD
const { default: chalk } = require('chalk');
=======
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();
>>>>>>> feat/tests
const {
    generateHTMLCode,
    generateYAMLCode,
    generateMarkdownCode,
    generateTypeScriptCode,
    generateJSONCode,
    generateJavaScriptCode,
    generateNuxtCode
} = require('./configGenerator');

async function analyzeExistingConfig() {
    const eslintConfigPath = 'eslint.config.js';
    const plugins = new Set();
    const filePatterns = new Set();
    const configContent = [];

    if (fs.existsSync(eslintConfigPath)) {
        try {
            const content = fs.readFileSync(eslintConfigPath, 'utf8');
            const pluginRequires = content.match(/require\('([^']+)'\)/g) || [];
            pluginRequires.forEach((req) => {
                const match = req.match(/require\('([^']+)'\)/);
                if (match) {
                    const pkg = match[1];
                    if (pkg.includes('eslint-plugin')) {
                        plugins.add(pkg.split('/').pop().replace('eslint-plugin-', ''));
                    }
                }
            });

            const fileMatches = content.match(/files:\s*\[[^\]]*\]/g) || [];
            fileMatches.forEach((match) => {
                const files = match.match(/['"]([^'"]+)['"]/g) || [];
                files.forEach((file) => {
                    filePatterns.add(file.replace(/['"]/g, ''));
                });
            });

            console.log(chalk.green(`📊 Analyse terminée: ${plugins.size} plugins détectés`));
        } catch {
            console.log(chalk.yellow("⚠️  Impossible d'analyser la configuration existante"));
        }
    }

    return { plugins, filePatterns, configContent };
}

async function updateEslintConfig(selectedTools, existingAnalysis) {
    const eslintConfigPath = 'eslint.config.js';

    if (!fs.existsSync(eslintConfigPath)) {
        return await createNewConfig(selectedTools);
    }

    let content = fs.readFileSync(eslintConfigPath, 'utf8');

    fs.writeFileSync('eslint.config.backup.js', content);

    content = addMissingImports(content, selectedTools, existingAnalysis.plugins);
    content = addMissingConfigs(content, selectedTools, existingAnalysis);

    fs.writeFileSync(eslintConfigPath, content);
    console.log(chalk.green('📄 Configuration ESLint mise à jour'));
}

async function createNewConfig(selectedTools) {
    const configGenerator = require('./configGenerator');

    const existingAnalysis = {
        plugins: new Set(),
        filePatterns: new Set(),
        configContent: []
    };

    const imports = configGenerator.generateImports(selectedTools, existingAnalysis.plugins);
    const newConfigs = configGenerator.generateNewConfigs(
        selectedTools,
        existingAnalysis.plugins,
        existingAnalysis.filePatterns
    );

    const configContent = `${imports}

module.exports = [
  js.configs.recommended,
  {
    ignores: ['node_modules/', 'dist/', 'build/', '**/*.json', '**/*.md'],
  },
${newConfigs.join(',\n')}
];
`;

    fs.writeFileSync('eslint.config.js', configContent);
    console.log(chalk.green('📄 Nouvelle configuration ESLint créée avec les plugins sélectionnés'));
}

function addMissingConfigs(content, selectedTools, existingAnalysis) {
    const configGenerators = {
        'JavaScript (ESLint)': generateJavaScriptCode,
        'TypeScript (TypeScript ESLint)': generateTypeScriptCode,
        'JSON (ESLint Plugin)': generateJSONCode,
        'Markdown (ESLint Plugin)': generateMarkdownCode,
        'YAML (ESLint Plugin)': generateYAMLCode,
        'HTML (ESLint Plugin)': generateHTMLCode,
        'Nuxt (ESLint Plugin)': generateNuxtCode
    };

    let newConfigsCode = [];

    selectedTools.forEach((tool) => {
        const generator = configGenerators[tool];
        if (generator) {
            const configCode = generator(existingAnalysis.plugins, existingAnalysis.filePatterns);
            if (configCode) {
                const configKey = configCode.split('files:')[1].split(']')[0];
                if (!content.includes(configKey)) {
                    newConfigsCode.push(configCode);
                }
            }
        }
    });

    if (newConfigsCode.length === 0) return content;

    const moduleExportsIndex = content.indexOf('module.exports = [');
    if (moduleExportsIndex === -1) return content;

    const arrayStartIndex = moduleExportsIndex + 'module.exports = ['.length;
    let arrayEndIndex = content.indexOf('];', arrayStartIndex);

    if (arrayEndIndex === -1) return content;

    let bracketCount = 0;

    for (let i = arrayEndIndex - 1; i >= arrayStartIndex; i--) {
        if (content[i] === '}') bracketCount++;
        if (content[i] === '{') bracketCount--;

        if (bracketCount === 0 && content[i] === ',') {
            break;
        }
    }

    const configString = newConfigsCode.map((code) => `,\n    ${code}`).join('');
    content = content.slice(0, arrayEndIndex) + configString + content.slice(arrayEndIndex);

    return content;
}

function addMissingImports(content, selectedTools, existingPlugins) {
    let newImports = '';

    const importMappings = {
        'TypeScript (TypeScript ESLint)': {
            condition: !existingPlugins.has('typescript'),
            code: `const typescriptParser = require('@typescript-eslint/parser');\nconst typescriptPlugin = require('@typescript-eslint/eslint-plugin');\n`
        },
        'JSON (ESLint Plugin)': {
            condition: !existingPlugins.has('json'),
            code: `const json = require('eslint-plugin-json');\n`
        },
        'Markdown (ESLint Plugin)': {
            condition: !existingPlugins.has('markdown'),
            code: `const markdown = require('@eslint/markdown');\n`
        },
        'YAML (ESLint Plugin)': {
            condition: !existingPlugins.has('yaml'),
            code: `const yaml = require('eslint-plugin-yaml');\n`
        },
        'HTML (ESLint Plugin)': {
            condition: !existingPlugins.has('html'),
            code: `const html = require('eslint-plugin-html');\n`
        },
        'Nuxt (ESLint Plugin)': {
            condition: !existingPlugins.has('nuxt'),
            code: `const nuxt = require('eslint-plugin-nuxt');\n`
        }
    };

    selectedTools.forEach((tool) => {
        const mapping = importMappings[tool];
        if (mapping && mapping.condition) {
            const pluginName = mapping.code.split("require('")[1].split("')")[0];
            if (!content.includes(pluginName)) {
                newImports += mapping.code;
            }
        }
    });

    if (newImports) {
        const requireMatches = [...content.matchAll(/const\s+(\w+)\s*=\s*require\(/g)];

        if (requireMatches.length > 0) {
            const lastRequire = requireMatches[requireMatches.length - 1];
            const afterLastRequire = content.indexOf('\n', lastRequire.index) + 1;
            content = content.slice(0, afterLastRequire) + newImports + content.slice(afterLastRequire);
        } else {
            const moduleExportsIndex = content.indexOf('module.exports');
            if (moduleExportsIndex !== -1) {
                content = content.slice(0, moduleExportsIndex) + newImports + content.slice(moduleExportsIndex);
            }
        }
    }

    return content;
}

module.exports = {
    analyzeExistingConfig,
    updateEslintConfig,
    addMissingImports,
    addMissingConfigs
};
