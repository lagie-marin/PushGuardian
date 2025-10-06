const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(process.cwd(), 'pushguardian.config.json');

if (!CONFIG_PATH.startsWith(process.cwd())) {
    console.error('❌ Le fichier de configuration doit être situé à la racine du projet.');
    process.exit(1);
}

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error('❌ Fichier de configuration introuvable.');
        process.exit(1);
    }

    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
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
