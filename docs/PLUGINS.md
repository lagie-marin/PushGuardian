# Système de Plugins push-guardian v2

Le système de plugins push-guardian v2 permet d'étendre les fonctionnalités via des commandes personnalisées.

## Caractéristiques

- **Commandes uniquement** : Les plugins enregistrent des commandes CLI (pas de hooks Git)
- **Gestion locale** : Plugins créés et gérés localement dans le dossier `plugins/`
- **Enable/Disable** : Activation/désactivation sans suppression

## Utilisation

### Lister les plugins installés

```bash
push-guardian plugin list
```

### Activer/Désactiver un plugin

```bash
push-guardian plugin enable <nom-du-plugin>
push-guardian plugin disable <nom-du-plugin>
```

### Lister les commandes disponibles

```bash
push-guardian plugin commands
```

### Exécuter une commande de plugin

```bash
push-guardian plugin run <nom-du-plugin> <commande> [args...]
```

Exemple avec le plugin d'exemple :
```bash
push-guardian plugin run example-plugin hello
push-guardian plugin run example-plugin greet "John"
push-guardian plugin run example-plugin info
```

## Créer un plugin

### Structure du plugin

```
mon-plugin/
├── plugin.json
└── index.js
```

### plugin.json

```json
{
  "name": "mon-plugin",
  "version": "1.0.0",
  "description": "Description de mon plugin",
  "author": "Votre Nom",
  "main": "index.js",
  "commands": ["ma-commande", "autre-commande"]
}
```

### index.js

```javascript
const BasePlugin = require('../../src/core/plugins/basePlugin');
const { getChalk } = require('../../src/utils/chalk-wrapper');
const chalk = getChalk();

class MonPlugin extends BasePlugin {
    constructor(manifest) {
        super(manifest);
        this.setupCommands();
    }

    setupCommands() {
        this.registerCommand('ma-commande', async (args, options) => {
            console.log(chalk.green('Ma commande s\'exécute!'));
            return 'Résultat de la commande';
        }, {
            description: 'Description de ma commande',
            args: []
        });

        this.registerCommand('autre-commande', async (args, options) => {
            const param = args[0];
            console.log(chalk.cyan(`Paramètre reçu: ${param}`));
            return `Traité: ${param}`;
        }, {
            description: 'Commande avec un argument',
            args: ['parametre']
        });
    }
}

module.exports = MonPlugin;
```

## Configuration locale

Le fichier `.push-guardian-plugins.json` stocke la configuration locale :

```json
{
  "plugins": {
    "example-plugin": {
      "path": "plugins/example-plugin",
      "version": "1.0.0",
      "enabled": true,
      "installedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Architecture

```
push-guardian
│
├── src/core/
│   └── plugins/
│       ├── basePlugin.js           # Classe de base
│       ├── pluginRegistry.js       # Registre local
│       └── pluginManager.js        # Gestionnaire d'exécution
│
├── src/cli/command/
│   └── plugin.js                   # Commande CLI
│
└── plugins/                        # Plugins créés localement
    └── example-plugin/
        ├── plugin.json
        └── index.js
```

## Notes importantes

- Les plugins sont des **extensions de commandes** uniquement
- Ils **ne s'exécutent pas automatiquement** lors des hooks Git
- Utilisez `push-guardian plugin run <plugin> <commande>` pour les exécuter
- La désactivation d'un plugin empêche l'exécution de ses commandes
- Le manifest (`plugin.json`) est obligatoire et doit contenir : name, version, description, author, main
- Les plugins sont créés localement dans le dossier `plugins/` à la racine du projet

### BasePlugin

Classe de base que tous les plugins doivent étendre.

**Constructeur**
- `constructor(manifest)` : Reçoit le manifest (plugin.json)

**Méthodes**
- `registerCommand(name, handler, options)` : Enregistre une commande
  - `name` : Nom de la commande
  - `handler` : Fonction async (args, options) => résultat
  - `options.description` : Description de la commande
  - `options.args` : Tableau des noms d'arguments
  
- `executeCommand(commandName, args, options)` : Exécute une commande
- `getManifest()` : Retourne le manifest du plugin
- `cleanup()` : Nettoie les ressources (appelé à la désinstallation)

**Propriétés**
- `name` : Nom du plugin
- `version` : Version du plugin
- `description` : Description du plugin
- `author` : Auteur du plugin
- `enabled` : État du plugin (actif/inactif)
- `commands` : Map des commandes enregistrées

## Configuration locale

Le fichier `.push-guardian-plugins.json` stocke la configuration locale :

```json
{
  "plugins": {
    "example-plugin": {
      "path": "example-plugin",
      "version": "1.0.0",
      "enabled": true,
      "installedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Architecture

```
push-guardian
│
├── src/core/
│   ├── api/
│   │   └── pluginApiClient.js      # Client API pour le dépôt
│   └── plugins/
│       ├── basePlugin.js           # Classe de base
│       ├── pluginRegistry.js       # Registre local
│       ├── pluginManager.js        # Gestionnaire d'exécution
│       ├── pluginInstaller.js      # Installation/désinstallation
│       └── pluginPublisher.js      # Publication
│
├── src/cli/command/
│   └── plugin.js                   # Commande CLI
│
└── plugins/                        # Plugins installés
    └── example-plugin/
        ├── plugin.json
        └── index.js
```

## Notes importantes

- Les plugins sont des **extensions de commandes** uniquement
- Ils **ne s'exécutent pas automatiquement** lors des hooks Git
- Utilisez `push-guardian plugin run <plugin> <commande>` pour les exécuter
- La désactivation d'un plugin empêche l'exécution de ses commandes
- Le manifest (`plugin.json`) est obligatoire et doit contenir : name, version, description, author, main
