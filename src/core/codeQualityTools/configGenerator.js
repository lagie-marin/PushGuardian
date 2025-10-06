const { default: chalk } = require('chalk');

function shouldSkipConfigUpdate(selectedTools, existingPlugins, existingFilesPatterns) {
    const allToolsConfigured = selectedTools.every((tool) => {
        const pluginName = getPluginNameForTool(tool);
        const filePatterns = getFilePatternsForTool(tool);

        if (!pluginName) return true;

        const hasPlugin = existingPlugins.has(pluginName);
        const hasFilePattern = filePatterns.some((pattern) => existingFilesPatterns.has(pattern));

        return hasPlugin || hasFilePattern;
    });

    if (allToolsConfigured) {
        console.log(chalk.blue('ℹ️  Tous les outils sélectionnés sont déjà configurés'));
        return true;
    }

    return false;
}

function generateImports(selectedTools, existingPlugins) {
    let imports = `const js = require('@eslint/js');\nconst prettier = require('eslint-plugin-prettier');\n`;

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
        }
    };

    selectedTools.forEach((tool) => {
        const mapping = importMappings[tool];
        if (mapping && mapping.condition) {
            imports += mapping.code;
        }
    });

    return imports;
}

function buildConfigContent(selectedTools, existingConfig, existingPlugins, existingFilesPatterns, imports) {
    const hasExistingConfig = existingConfig.length > 0;
    const newConfigs = generateNewConfigs(selectedTools, existingPlugins, existingFilesPatterns);

    if (newConfigs.length === 0) {
        return null;
    }

    if (hasExistingConfig) {
        return buildMergedConfigContent(imports, existingConfig, newConfigs);
    } else {
        return buildNewConfigContent(imports, newConfigs);
    }
}

function generateNewConfigs(selectedTools, existingPlugins, existingFilesPatterns) {
    const configGenerators = {
        'JavaScript (ESLint)': generateJavaScriptCode,
        'TypeScript (TypeScript ESLint)': generateTypeScriptCode,
        'JSON (ESLint Plugin)': generateJSONCode,
        'Markdown (ESLint Plugin)': generateMarkdownCode,
        'YAML (ESLint Plugin)': generateYAMLCode,
        'HTML (ESLint Plugin)': generateHTMLCode
    };

    const newConfigs = [];

    selectedTools.forEach((tool) => {
        const generator = configGenerators[tool];
        if (generator) {
            const config = generator(existingPlugins, existingFilesPatterns);
            if (config) {
                newConfigs.push(config);
            }
        }
    });

    return newConfigs;
}

function buildMergedConfigContent(imports, existingConfig, newConfigs) {
    return `${imports}

const baseConfig = require('./eslint.config.js');

const additionalConfigs = [
${newConfigs.join(',\n')}
];

module.exports = [
  ...baseConfig,
  ...additionalConfigs
];
`;
}

function buildNewConfigContent(imports, newConfigs) {
    return `${imports}

module.exports = [
  js.configs.recommended,
  {
    ignores: ['node_modules/', 'dist/', 'build/', '**/*.json', '**/*.md'],
  },
${newConfigs.join(',\n')}
];
`;
}

function serializeConfig(config) {
    const seen = new WeakSet();

    return JSON.stringify(
        config,
        (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]';
                seen.add(value);
            }

            if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
            if (key === 'plugins' && typeof value === 'object') {
                const simplifiedPlugins = {};
                Object.keys(value).forEach((pluginName) => {
                    simplifiedPlugins[pluginName] = {};
                });
                return simplifiedPlugins;
            }

            return value;
        },
        4
    );
}

function generateJavaScriptCode(existingPlugins, existingFilesPatterns) {
    if (
        Array.from(existingFilesPatterns).some(
            (pattern) => pattern.includes('*.js') || pattern.includes('**/*.js') || pattern.includes('*.jsx')
        )
    ) {
        return null;
    }

    return `{
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                ...require('globals').node,
                test: 'readonly',
                describe: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly'
            }
        },
        plugins: { prettier },
        rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': 'warn'
        }
    }`;
}

function generateJSONCode(existingPlugins, existingFilesPatterns) {
    const hasPlugin = existingPlugins.has('json');
    const hasConfig = existingFilesPatterns.has('**/*.json');

    if (hasPlugin || hasConfig) {
        return null;
    }

    return `{
        files: ['**/*.json'],
        plugins: { json, prettier }
    }`;
}

function generateTypeScriptCode(existingPlugins, existingFilesPatterns) {
    const hasPlugin = existingPlugins.has('typescript');
    const hasConfig = Array.from(existingFilesPatterns).some(
        (pattern) => pattern.includes('*.ts') || pattern.includes('**/*.ts') || pattern.includes('*.tsx')
    );

    if (hasPlugin || hasConfig) {
        return null;
    }

    return `{
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
        },
        plugins: { typescript: typescriptPlugin },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn'
        }
    }`;
}

function generateMarkdownCode(existingPlugins, existingFilesPatterns) {
    const hasPlugin = existingPlugins.has('markdown');
    const hasConfig = existingFilesPatterns.has('**/*.md');

    if (hasPlugin || hasConfig) {
        return null;
    }

    return `{
        files: ['**/*.md'],
        plugins: { markdown },
        processor: 'markdown/markdown'
    }`;
}

function generateYAMLCode(existingPlugins, existingFilesPatterns) {
    const hasPlugin = existingPlugins.has('yaml');
    const hasConfig = Array.from(existingFilesPatterns).some(
        (pattern) => pattern.includes('*.yaml') || pattern.includes('*.yml')
    );

    if (hasPlugin || hasConfig) {
        return null;
    }

    return `{
        files: ['**/*.yaml', '**/*.yml'],
        plugins: { yaml }
    }`;
}

function generateHTMLCode(existingPlugins, existingFilesPatterns) {
    const hasPlugin = existingPlugins.has('html');
    const hasConfig = existingFilesPatterns.has('**/*.html');

    if (hasPlugin || hasConfig) {
        return null;
    }

    return `{
        files: ['**/*.html'],
        plugins: { html }
    }`;
}

function analyzeExistingConfig(configItem, existingPlugins, existingFilesPatterns) {
    if (configItem.plugins) {
        Object.keys(configItem.plugins).forEach((plugin) => existingPlugins.add(plugin));
    }

    if (configItem.files) {
        const filesPatterns = Array.isArray(configItem.files) ? configItem.files : [configItem.files];
        filesPatterns.forEach((pattern) => existingFilesPatterns.add(pattern));
    }
}

function getPluginNameForTool(tool) {
    const pluginMap = {
        'JavaScript (ESLint)': null,
        'TypeScript (TypeScript ESLint)': 'typescript',
        'JSON (ESLint Plugin)': 'json',
        'Markdown (ESLint Plugin)': 'markdown',
        'YAML (ESLint Plugin)': 'yaml',
        'HTML (ESLint Plugin)': 'html'
    };

    return pluginMap[tool];
}

function getFilePatternsForTool(tool) {
    const patternMap = {
        'JavaScript (ESLint)': ['**/*.js', '**/*.jsx'],
        'TypeScript (TypeScript ESLint)': ['**/*.ts', '**/*.tsx'],
        'JSON (ESLint Plugin)': ['**/*.json'],
        'Markdown (ESLint Plugin)': ['**/*.md'],
        'YAML (ESLint Plugin)': ['**/*.yaml', '**/*.yml'],
        'HTML (ESLint Plugin)': ['**/*.html']
    };

    return patternMap[tool] || [];
}

module.exports = {
    shouldSkipConfigUpdate,
    generateImports,
    buildConfigContent,
    generateNewConfigs,
    buildMergedConfigContent,
    buildNewConfigContent,
    generateHTMLCode,
    generateYAMLCode,
    generateMarkdownCode,
    generateTypeScriptCode,
    generateJSONCode,
    generateJavaScriptCode,
    analyzeExistingConfig,
    getPluginNameForTool,
    getFilePatternsForTool,
    serializeConfig
};
