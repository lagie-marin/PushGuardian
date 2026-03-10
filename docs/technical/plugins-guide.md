# Guide des Plugins push-guardian

## Introduction

Le système de plugins permet d'étendre les fonctionnalités de push-guardian sans modifier le code source principal.

## Création d'un plugin

### Structure de base

```javascript
const BasePlugin = require('push-guardian/core/plugins/basePlugin');

class MonPlugin extends BasePlugin {
    constructor() {
        super('mon-plugin', '1.0.0');
    }

    async initialize() {
        // Code d'initialisation
        console.log('Mon plugin est initialise');
    }

    async cleanup() {
        // Nettoyage des ressources
    }
}

module.exports = MonPlugin;
```

### Enregistrement de hooks

```javascript
class MonPlugin extends BasePlugin {
    async initialize() {
        // Hook avant validation
        this.registerHook('pre-validate', async (data) => {
            console.log('Avant validation:', data);
            return data;
        });

        // Hook après validation
        this.registerHook('post-validate', async (data) => {
            console.log('Apres validation:', data);
            return data;
        });

        // Hook personnalisé
        this.registerHook('custom-event', async (data) => {
            // Votre logique
            return data;
        });
    }
}
```

## Hooks disponibles

### Hooks de validation

| Hook | Description | Données reçues |
|------|-------------|----------------|
| `pre-validate` | Avant la validation du code | `{ files: [], config: {} }` |
| `post-validate` | Après la validation | `{ result: {}, duration: 0 }` |
| `validation-error` | En cas d'erreur | `{ error: Error }` |

### Hooks Git

| Hook | Description | Données reçues |
|------|-------------|----------------|
| `pre-commit` | Avant un commit | `{ stagedFiles: [] }` |
| `post-commit` | Après un commit | `{ sha: '', message: '' }` |
| `pre-push` | Avant un push | `{ branch: '', remote: '' }` |

### Hooks de mirroring

| Hook | Description | Données reçues |
|------|-------------|----------------|
| `pre-sync` | Avant synchronisation | `{ source: '', target: '' }` |
| `post-sync` | Après synchronisation | `{ success: true, branches: [] }` |

## Configuration

### Configuration du plugin

```javascript
class MonPlugin extends BasePlugin {
    constructor() {
        super('mon-plugin', '1.0.0');
        
        // Configuration par défaut
        this.config = {
            enabled: true,
            level: 'info',
            customOption: 'value'
        };
    }

    configure(newConfig) {
        super.configure(newConfig);
        // Logique de configuration personnalisée
        this.applyConfig();
    }

    applyConfig() {
        if (this.config.enabled) {
            // Activer des fonctionnalités
        }
    }
}
```

### Configuration via CLI

```bash
# Configurer un plugin
npx push-guardian plugin --config mon-plugin '{"level": "debug"}'
```

## Exemples de plugins

### Plugin de notification Slack

```javascript
const BasePlugin = require('push-guardian/core/plugins/basePlugin');
const https = require('https');

class SlackNotificationPlugin extends BasePlugin {
    constructor() {
        super('slack-notifications', '1.0.0');
        this.config = {
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channel: '#dev'
        };
    }

    async initialize() {
        this.registerHook('post-validate', async (data) => {
            await this.sendNotification(data);
            return data;
        });
    }

    async sendNotification(data) {
        const message = {
            channel: this.config.channel,
            text: `Validation terminee: ${data.result.success ? 'Succes' : 'Echec'}`
        };

        return new Promise((resolve, reject) => {
            const req = https.request(this.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, resolve);

            req.on('error', reject);
            req.write(JSON.stringify(message));
            req.end();
        });
    }
}

module.exports = SlackNotificationPlugin;
```

### Plugin de statistiques

```javascript
const BasePlugin = require('push-guardian/core/plugins/basePlugin');
const fs = require('fs');

class StatsPlugin extends BasePlugin {
    constructor() {
        super('stats-collector', '1.0.0');
        this.stats = {
            validations: 0,
            successes: 0,
            failures: 0
        };
    }

    async initialize() {
        this.registerHook('post-validate', async (data) => {
            this.stats.validations++;
            if (data.result.success) {
                this.stats.successes++;
            } else {
                this.stats.failures++;
            }
            this.saveStats();
            return data;
        });
    }

    saveStats() {
        fs.writeFileSync(
            'stats.json',
            JSON.stringify(this.stats, null, 2)
        );
    }
}

module.exports = StatsPlugin;
```

### Plugin de validation personnalisée

```javascript
const BasePlugin = require('push-guardian/core/plugins/basePlugin');

class CustomValidationPlugin extends BasePlugin {
    constructor() {
        super('custom-validation', '1.0.0');
        this.config = {
            rules: {
                noConsoleLog: true,
                maxFileSize: 1000000 // 1 MB
            }
        };
    }

    async initialize() {
        this.registerHook('pre-validate', async (data) => {
            const errors = [];

            for (const file of data.files) {
                // Vérifier console.log
                if (this.config.rules.noConsoleLog) {
                    const content = fs.readFileSync(file, 'utf8');
                    if (content.includes('console.log')) {
                        errors.push(`${file}: console.log detecte`);
                    }
                }

                // Vérifier taille
                const stats = fs.statSync(file);
                if (stats.size > this.config.rules.maxFileSize) {
                    errors.push(`${file}: fichier trop volumineux`);
                }
            }

            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }

            return data;
        });
    }
}

module.exports = CustomValidationPlugin;
```

## Chargement des plugins

### Depuis un répertoire

```bash
npx push-guardian plugin --load ./plugins
```

### Programmatiquement

```javascript
const pluginRegistry = require('push-guardian/core/plugins/pluginRegistry');
const MonPlugin = require('./mon-plugin');

const plugin = new MonPlugin();
pluginRegistry.register(plugin);
```

## Gestion des plugins

### Lister les plugins

```bash
npx push-guardian plugin --list
```

### Activer/Désactiver

```bash
# Activer
npx push-guardian plugin --enable mon-plugin

# Désactiver
npx push-guardian plugin --disable mon-plugin
```

### Informations sur un plugin

```bash
npx push-guardian plugin --info mon-plugin
```

## Bonnes pratiques

### 1. Gestion des erreurs

```javascript
async executeHook(hookName, data) {
    try {
        // Votre logique
        return data;
    } catch (error) {
        console.error(`Erreur dans ${this.name}:`, error);
        // Ne pas bloquer les autres plugins
        return data;
    }
}
```

### 2. Configuration

```javascript
constructor() {
    super('mon-plugin', '1.0.0');
    
    // Valeurs par défaut
    this.config = {
        enabled: true,
        timeout: 5000
    };
}

configure(config) {
    // Valider la configuration
    if (config.timeout && config.timeout < 0) {
        throw new Error('Timeout doit etre positif');
    }
    super.configure(config);
}
```

### 3. Nettoyage

```javascript
async cleanup() {
    // Fermer les connexions
    if (this.connection) {
        await this.connection.close();
    }
    
    // Sauvegarder l'état
    this.saveState();
    
    super.cleanup();
}
```

### 4. Tests

```javascript
const MonPlugin = require('./mon-plugin');

describe('MonPlugin', () => {
    let plugin;

    beforeEach(() => {
        plugin = new MonPlugin();
    });

    test('doit initialiser correctement', async () => {
        await plugin.initialize();
        expect(plugin.hooks['pre-validate']).toBeDefined();
    });

    test('doit traiter les données', async () => {
        const data = { files: [] };
        const result = await plugin.executeHook('pre-validate', data);
        expect(result).toEqual(data);
    });
});
```

## Déploiement

### Package npm

```json
{
  "name": "push-guardian-plugin-mon-plugin",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "push-guardian": "^2.0.0"
  }
}
```

### Installation

```bash
npm install push-guardian-plugin-mon-plugin
```

## Limitations

- Un plugin ne peut pas modifier le core
- Timeout de 30 secondes par hook
- Pas d'accès direct au système de fichiers en dehors du workspace
- Les plugins s'exécutent de manière séquentielle (pas de parallélisation)

## Support

Pour toute question ou problème:
- GitHub Issues: https://github.com/lagie-marin/push-guardian/issues
- Documentation: https://push-guardian.dev/docs/plugins
