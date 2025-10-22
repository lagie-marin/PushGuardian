const fs = require('fs');
const path = require('path');

/**
 * Charge les variables d'environnement depuis un fichier .env
 * @param {string} envPath - Chemin vers le fichier .env (par défaut: '.env')
 */
function loadEnv(envPath = '.env') {
    try {
        const absolutePath = path.resolve(process.cwd(), envPath);

        if (!fs.existsSync(absolutePath)) {
            console.warn('⚠️  Fichier .env non trouvé, utilisation des variables système');
            return;
        }

        const content = fs.readFileSync(absolutePath, 'utf8');
        let lines = content.split('\n');

        lines.forEach((line, index) => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;

            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (!match) {
                console.warn(`⚠️  Ligne ${index + 1} ignorée (format invalide): ${line}`);
                return;
            }

            const key = match[1];
            let value = match[2] || '';

            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/\\n/g, '\n');
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }

            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        });

        console.log('✅ Variables d\'environnement chargées depuis .env');

    } catch (error) {
        console.error('❌ Erreur lors du chargement du fichier .env:', error.message);
    }
}

/**
 * Récupère une variable d'environnement avec validation
 * @param {string} key - Clé de la variable
 * @param {*} defaultValue - Valeur par défaut si non trouvée
 * @returns {string}
 */
function getEnv(key, defaultValue = null, werror = false) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        if (defaultValue === null) {
            if (werror) {
                throw new Error(`Variable d'environnement manquante: ${key}`);
            } else {
                return '';
            }
        }
        return defaultValue;
    }
    return value;
}

/**
 * Sauvegarde une variable d'environnement dans le fichier .env
 * @param {string} key - Clé de la variable
 * @param {string} value - Valeur de la variable
 * @param {string} envPath - Chemin vers le fichier .env (par défaut: '.env')
 */
function saveEnv(key, value, envPath = '.env') {
    try {
        const absolutePath = path.resolve(process.cwd(), envPath);
        let content = '';

        if (fs.existsSync(absolutePath)) {
            content = fs.readFileSync(absolutePath, 'utf8');
        }

        const lines = content.split('\n');
        let updated = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith(`${key}=`) || line.startsWith(`${key} =`)) {
                lines[i] = `${key}=${value}`;
                updated = true;
                break;
            }
        }

        if (!updated) {
            lines.push(`${key}=${value}`);
        }

        fs.writeFileSync(absolutePath, lines.join('\n'), 'utf8');
        console.log(`✅ Variable ${key} sauvegardée dans .env`);

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la variable:', error.message);
    }
}

module.exports = { loadEnv, getEnv, saveEnv };