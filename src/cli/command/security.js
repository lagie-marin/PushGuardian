const fs = require('fs');
const path = require('path');
const execa = require('../../utils/exec-wrapper');
const { getChalk } = require('../../utils/chalk-wrapper');

function detectProjectTechnology() {
    const cwd = process.cwd();

    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        return 'nodejs';
    }

    if (
        fs.existsSync(path.join(cwd, 'requirements.txt')) ||
        fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
        fs.existsSync(path.join(cwd, 'Pipfile'))
    ) {
        return 'python';
    }

    if (fs.existsSync(path.join(cwd, 'composer.json'))) {
        return 'php';
    }

    if (fs.existsSync(path.join(cwd, 'Gemfile'))) {
        return 'ruby';
    }

    if (fs.existsSync(path.join(cwd, 'pom.xml')) || fs.existsSync(path.join(cwd, 'build.gradle'))) {
        return 'java';
    }

    if (fs.existsSync(path.join(cwd, '*.csproj')) || fs.existsSync(path.join(cwd, '*.fsproj'))) {
        return 'dotnet';
    }

    if (fs.existsSync(path.join(cwd, 'go.mod'))) {
        return 'go';
    }

    if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
        return 'rust';
    }
    return 'unknown';
}

function getSecurityCommands(technology) {
    const commands = {
        nodejs: {
            check: ['npm', 'audit'],
            fix: ['npm', 'audit', 'fix']
        },
        python: {
            check: ['pip-audit'],
            fix: ['pip', 'install', '--upgrade', '-r', 'requirements.txt']
        },
        php: {
            check: ['composer', 'audit'],
            fix: ['composer', 'update', '--with-dependencies']
        },
        ruby: {
            check: ['bundle', 'audit'],
            fix: ['bundle', 'update', '--conservative']
        },
        java: {
            check: ['mvn', 'dependency-check:check'],
            fix: ['mvn', 'versions:use-latest-releases']
        },
        dotnet: {
            check: ['dotnet', 'list', 'package', '--vulnerable'],
            fix: ['dotnet', 'list', 'package', '--outdated']
        },
        go: {
            check: ['govulncheck', './...'],
            fix: ['go', 'get', '-u', './...']
        },
        rust: {
            check: ['cargo', 'audit'],
            fix: ['cargo', 'update']
        }
    };

    /* istanbul ignore next */
    return commands[technology] || null;
}

module.exports = {
    name: 'security',
    description: 'Vérifier les vulnérabilités de sécurité dans les dépendances du projet',
    options: [
        {
            flags: '-f, --fix',
            description: 'Appliquer automatiquement les correctifs pour les vulnérabilités trouvées'
        }
    ],
    action: async (options) => {
        const chalk = getChalk();
        console.log(chalk.blue('🔍 Vérification des vulnérabilités de sécurité dans les dépendances du projet...'));

        try {
            const technology = detectProjectTechnology();

            if (technology === 'unknown') {
                console.log(
                    chalk.yellow(
                        '⚠️  Technologie non détectée. Les technologies supportées sont : Node.js, Python, PHP, Ruby, Java, .NET, Go, Rust'
                    )
                );
                return;
            }

            console.log(chalk.cyan(`📦 Technologie détectée : ${technology.toUpperCase()}`));

            const securityCommands = getSecurityCommands(technology);

            /* istanbul ignore next */
            if (!securityCommands) {
                console.log(chalk.yellow(`⚠️  Aucune commande de sécurité définie pour ${technology}`));
                return;
            }

            const command = options.fix ? securityCommands.fix : securityCommands.check;
            const action = options.fix ? 'correction' : 'vérification';

            console.log(chalk.blue(`🔧 Exécution de la ${action} de sécurité...`));

            try {
                const result = await execa(command[0], command.slice(1));
                console.log(chalk.green('✅ Vérification de sécurité terminée avec succès'));
                if (result.stdout) {
                    console.log(result.stdout);
                }
            } catch (error) {
                if (options.fix) {
                    console.log(chalk.red('❌ Échec de la correction automatique des vulnérabilités'));
                } else {
                    console.log(chalk.yellow('⚠️  Vulnérabilités détectées :'));
                }
                console.log(error.stdout || error.stderr || error.message);

                if (!options.fix && securityCommands.fix) {
                    console.log(chalk.cyan('💡 Utilisez --fix pour tenter une correction automatique'));
                }
            }
        } catch (error) {
            console.log(
                chalk.red('❌ Une erreur est survenue lors de la vérification des vulnérabilités :'),
                error.message
            );
        }
    }
};
