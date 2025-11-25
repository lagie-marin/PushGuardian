const fs = require('fs');
<<<<<<< HEAD
const { default: chalk } = require('chalk');
=======
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();
>>>>>>> feat/tests

const LANGUAGE_TOOLS = {
    'JavaScript (ESLint)': {
        packages: ['eslint', 'eslint-plugin-prettier'],
        setup: setupESLint
    },
    'TypeScript (TypeScript ESLint)': {
        packages: ['@typescript-eslint/parser', '@typescript-eslint/eslint-plugin', 'typescript'],
        setup: setupTypeScript
    },
    'JSON (ESLint Plugin)': {
        packages: ['eslint', 'eslint-plugin-json'],
        setup: setupJSON
    },
    'Markdown (ESLint Plugin)': {
        packages: ['eslint', '@eslint/markdown'],
        setup: setupMarkdown
    },
    'CSS/SCSS (Stylelint)': {
        packages: ['stylelint', 'stylelint-config-standard'],
        setup: setupCSS
    },
    'YAML (ESLint Plugin)': {
        packages: ['eslint-plugin-yaml'],
        setup: setupYAML
    },
    'HTML (ESLint Plugin)': {
        packages: ['eslint-plugin-html'],
        setup: setupHTML
    },
    'Nuxt (ESLint Plugin)': {
        packages: ['eslint-plugin-nuxt'],
        setup: setupNuxt
    }
};

async function setupESLint() {
    console.log(chalk.green('   ⚙️  Configuration JavaScript complète'));
}

async function setupTypeScript() {
    if (!fs.existsSync('tsconfig.json')) {
        const tsConfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true
            }
        };
        fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 2));
        console.log(chalk.green('   ⚙️  Fichier tsconfig.json créé'));
    }
}

async function setupJSON() {
    console.log(chalk.green('   ⚙️  Plugin JSON configuré'));
}

async function setupMarkdown() {
    console.log(chalk.green('   ⚙️  Plugin Markdown configuré'));
}

async function setupCSS() {
    const stylelintConfig = {
        extends: 'stylelint-config-standard',
        rules: {
            'color-hex-case': 'lower'
        }
    };

    if (!fs.existsSync('.stylelintrc.json')) {
        fs.writeFileSync('.stylelintrc.json', JSON.stringify(stylelintConfig, null, 2));
        console.log(chalk.green('   ⚙️  Configuration Stylelint créée'));
    }
}

async function setupYAML() {
    console.log(chalk.green('   ⚙️  Plugin YAML configuré'));
}

async function setupHTML() {
    console.log(chalk.green('   ⚙️  Plugin HTML configuré'));
}

async function setupNuxt() {
    console.log(chalk.green('   ⚙️  Plugin Nuxt configuré'));
}

module.exports = {
    LANGUAGE_TOOLS,
    setupESLint,
    setupTypeScript,
    setupJSON,
    setupMarkdown,
    setupCSS,
    setupYAML,
    setupHTML,
    setupNuxt
};
