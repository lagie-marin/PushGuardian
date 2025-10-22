const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(process.cwd(), 'pushguardian.config.json');

if (!CONFIG_PATH.startsWith(process.cwd())) {
    console.error('❌ Le fichier de configuration doit être situé à la racine du projet.');
    process.exit(1);
}

function loadConfig(configPath = CONFIG_PATH) {
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {};

        try {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
            return defaultConfig;
        } catch (error) {
            console.error('❌ Erreur lors de la création du fichier de configuration:', error.message);
            process.exit(1);
        }
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config;
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la configuration:', error.message);
        process.exit(1);
    }
}

function saveConfig(newConfig) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
        console.log('✅ Configuration mise à jour avec succès.');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la configuration:', error.message);
        process.exit(1);
    }
}

module.exports = { loadConfig, saveConfig };
