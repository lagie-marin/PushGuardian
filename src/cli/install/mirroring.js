const fs = require('fs');
const interactiveMenu = require('../../core/interactiveMenu/interactiveMenu');
const readline = require('readline');
const { loadEnv, getEnv, saveEnv } = require('../../core/module/env-loader');
const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

function askCredentials(platform) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const credentials = {};

        const questions = {
            github: [{ key: 'token', question: 'Entrez votre token GitHub: ' }],
            gitlab: [{ key: 'token', question: 'Entrez votre token GitLab: ' }],
            azure: [
                {
                    key: 'url',
                    question: "Entrez l'URL de votre organisation Azure DevOps (ex: https://dev.azure.com/org): "
                },
                { key: 'token', question: 'Entrez votre token Azure DevOps: ' }
            ]
        };

        const platformKey = platform.toLowerCase().replace(' ', '');
        const qList = questions[platformKey];

        if (!qList) {
            rl.close();
            resolve(credentials);
            return;
        }

        let index = 0;

        function askNext() {
            if (index >= qList.length) {
                rl.close();
                resolve(credentials);
                return;
            }

            const q = qList[index];
            rl.question(q.question, (answer) => {
                credentials[q.key] = answer;
                index++;
                askNext();
            });
        }

        askNext();
    });
}

function getCredentialsFromEnv(platform) {
    const platformKey = platform.toLowerCase().replace(' ', '');
    const credentials = {};

    try {
        if (platformKey === 'github') {
            credentials.token = getEnv('GITHUB_TOKEN', null, true);
            console.log('✅ Token GitHub chargé depuis .env');
        } else if (platformKey === 'gitlab') {
            credentials.token = getEnv('GITLAB_TOKEN', null, true);
            console.log('✅ Token GitLab chargé depuis .env');
        } else if (platformKey === 'azure') {
            credentials.url = getEnv('AZURE_DEVOPS_URL', null, true);
            credentials.token = getEnv('AZURE_DEVOPS_TOKEN', null, true);
            console.log('✅ Credentials Azure DevOps chargés depuis .env');
        }
    } catch (error) {
        console.log(chalk.yellow(`⚠️  Variable d'environnement manquante pour ${platform}: ${error.message}`));
        console.log(chalk.blue(`💡 Vous pouvez créer un fichier .env avec vos tokens, ou les saisir maintenant:`));
        console.log(chalk.gray(`   Exemple de fichier .env:`));
        console.log(chalk.gray(`   GITHUB_TOKEN=votre_token_ici`));
        console.log(chalk.gray(`   GITLAB_TOKEN=votre_token_ici`));
        console.log(chalk.gray(`   AZURE_DEVOPS_URL=https://dev.azure.com/votre_org`));
        console.log(chalk.gray(`   AZURE_DEVOPS_TOKEN=votre_token_ici`));
        console.log('');

        return askCredentials(platform);
    }

    return credentials;
}

function createMirroringConfig(selectedPlatforms, credentials, defaultSettings) {
    const mirroringConfig = {
        mirroring: {
            enabled: true,
            defaultSettings: {
                autoSync: defaultSettings.autoSync || false,
                syncInterval: defaultSettings.syncInterval || 24,
                includeBranches: defaultSettings.includeBranches !== false,
                includeTags: defaultSettings.includeTags !== false
            },
            platforms: {}
        }
    };
    const allPlatforms = {
        github: { enabled: false },
        gitlab: { enabled: false },
        azure: { enabled: false }
    };

    selectedPlatforms.forEach((platform) => {
        const key = platform.toLowerCase().replace(' ', '');
        if (allPlatforms[key]) {
            mirroringConfig.mirroring.platforms[key] = {
                ...allPlatforms[key],
                enabled: true
            };
        }
    });

    Object.keys(allPlatforms).forEach((key) => {
        if (!mirroringConfig.mirroring.platforms[key]) {
            mirroringConfig.mirroring.platforms[key] = allPlatforms[key];
        }
    });

    const configFilePath = 'pushguardian.config.json';

    try {
        let existingConfig = {};

        if (fs.existsSync(configFilePath)) {
            try {
                const existingContent = fs.readFileSync(configFilePath, 'utf8');
                existingConfig = JSON.parse(existingContent);
            } catch {
                existingConfig = {};
            }
        }

        existingConfig.mirroring = mirroringConfig.mirroring;

        if (!existingConfig.install) existingConfig.install = {};
        existingConfig.install.mirroring = true;

        fs.writeFileSync(configFilePath, JSON.stringify(existingConfig, null, 4));
        console.log(chalk.green('📄 Configuration du système de mirroring mise à jour avec succès.'));
    } catch (error) {
        console.log(chalk.red('❌ Erreur lors de la création de la configuration du mirroring:'), error.message);
    }
}

function saveCredentialsToEnv(credentials) {
    const envPath = '.env';

    Object.keys(credentials).forEach((platformKey) => {
        const creds = credentials[platformKey];
        console.log(`🔐 Sauvegarde des credentials pour ${platformKey} dans .env, creds: ${JSON.stringify(creds)}`);
        if (platformKey === 'github' && creds.token && !getEnv('GITHUB_TOKEN')) {
            saveEnv('GITHUB_TOKEN', creds.token, envPath);
        } else if (platformKey === 'gitlab' && creds.token && !getEnv('GITLAB_TOKEN')) {
            saveEnv('GITLAB_TOKEN', creds.token, envPath);
        } else if (platformKey === 'azure' && !getEnv('AZURE_DEVOPS_URL') && !getEnv('AZURE_DEVOPS_TOKEN')) {
            if (creds.url) saveEnv('AZURE_DEVOPS_URL', creds.url, envPath);
            if (creds.token) saveEnv('AZURE_DEVOPS_TOKEN', creds.token, envPath);
        }
    });
    console.log(chalk.green('🔐 Credentials sauvegardés dans le fichier .env'));
}

async function installMirroringTools() {
    console.log(chalk.blue('🔄 Installation du système de mirroring...'));

    loadEnv();

    const configFilePath = 'pushguardian.config.json';
    if (fs.existsSync(configFilePath)) {
        const existingContent = fs.readFileSync(configFilePath, 'utf8');
        const existingConfig = JSON.parse(existingContent);
        if (existingConfig.install && existingConfig.install.mirroring) {
            console.log(chalk.yellow('⚠️  Le système de mirroring est déjà installé.'));
            return;
        }
    }

    const availablePlatforms = ['GitHub', 'GitLab', 'Azure DevOps'];
    const selectedPlatforms = await interactiveMenu(
        'Choisissez les plateformes à activer pour le mirroring:',
        availablePlatforms
    );

    if (selectedPlatforms.length === 0) {
        console.log(chalk.yellow('⚠️  Aucune plateforme sélectionnée. Installation annulée.'));
        return;
    }

    console.log(chalk.blue(`📦 Plateformes sélectionnées: ${selectedPlatforms.join(', ')}`));

    const credentials = {};
    for (const platform of selectedPlatforms) {
        console.log(chalk.cyan(`\n🔑 Configuration pour ${platform}:`));
        const creds = await getCredentialsFromEnv(platform);
        const key = platform.toLowerCase().replace(' ', '');
        credentials[key] = creds;
    }

    const defaultSettings = {
        autoSync: false,
        syncInterval: 24,
        includeBranches: true,
        includeTags: true
    };

    saveCredentialsToEnv(credentials);

    const defaults = await askForDefaults();

    Object.keys(defaults).forEach((key) => {
        const envKey = `${key.toUpperCase()}`;
        /* istanbul ignore next */
        if (defaults[key]) {
            saveEnv(envKey, defaults[key]);
        }
    });

    createMirroringConfig(selectedPlatforms, credentials, defaultSettings);
    console.log(chalk.green('✅ Installation du système de mirroring terminée!'));
    console.log(
        chalk.blue('💡 Utilisez la commande "pushguardian mirror" pour effectuer des opérations de mirroring.')
    );
    console.log(
        chalk.blue('💡 Les valeurs par défaut ont été sauvegardées dans .env (variables PUSHGUARDIAN_MIRROR_*).')
    );
}

/* istanbul ignore next */
async function askForDefaults() {
    const supportedPlatforms = ['github', 'gitlab', 'azure'];

    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const defaults = {};

        function ask(question, key, validator = null, callback) {
            rl.question(question, (answer) => {
                if (answer.trim()) {
                    if (validator && !validator(answer.trim())) {
                        console.log(`❌ Valeur invalide. Plateformes supportées: ${supportedPlatforms.join(', ')}`);
                        ask(question, key, validator, callback);
                        return;
                    }
                    defaults[key] = answer.trim();
                }
                callback();
            });
        }

        ask(
            'Entrez la plateforme source par défaut (github, gitlab, bitbucket, azure): ',
            'source_Platform',
            (val) => supportedPlatforms.includes(val.toLowerCase()),
            () => {
                ask(
                    'Entrez la plateforme cible par défaut (github, gitlab, bitbucket, azure): ',
                    'target_Platform',
                    (val) => supportedPlatforms.includes(val.toLowerCase()),
                    () => {
                        ask('Entrez le repo source par défaut (optionnel): ', 'source_Repo', null, () => {
                            ask('Entrez le propriétaire source par défaut (optionnel): ', 'source_Owner', null, () => {
                                ask('Entrez le repo cible par défaut (optionnel): ', 'target_Repo', null, () => {
                                    ask(
                                        'Entrez le propriétaire cible par défaut (optionnel): ',
                                        'target_Owner',
                                        null,
                                        () => {
                                            rl.close();
                                            resolve(defaults);
                                        }
                                    );
                                });
                            });
                        });
                    }
                );
            }
        );
    });
}

module.exports = {
    installMirroringTools,
    askCredentials,
    getCredentialsFromEnv,
    saveCredentialsToEnv,
    createMirroringConfig
};
