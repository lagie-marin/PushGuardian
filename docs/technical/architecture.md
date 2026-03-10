# Architecture push-guardian

## Vue d'ensemble

push-guardian est un outil de validation de code et de gestion de workflow Git structuré en modules indépendants.

## Structure du projet

```
push-guardian/
├── src/
│   ├── cli/                    # Interface en ligne de commande
│   │   ├── index.js           # Point d'entrée CLI
│   │   ├── command/           # Commandes CLI
│   │   └── install/           # Scripts d'installation
│   ├── core/                  # Logique métier
│   │   ├── cache/            # Système de cache
│   │   ├── codeQualityTools/ # Outils de qualité de code
│   │   ├── interactiveMenu/  # Menus interactifs
│   │   ├── mirroring/        # Système de mirroring
│   │   ├── performance/      # Analyse de performance
│   │   ├── plugins/          # Système de plugins
│   │   └── reviewApps/       # Review apps pour PR
│   ├── hooks/                 # Hooks Git
│   └── utils/                 # Utilitaires
├── tests/                     # Tests unitaires
└── docs/                      # Documentation

```

## Modules principaux

### 1. CLI (Command Line Interface)

Le module CLI fournit l'interface utilisateur en ligne de commande.

**Fichiers clés:**
- `src/cli/index.js` - Point d'entrée principal
- `src/cli/command/*.js` - Commandes disponibles

**Commandes disponibles:**
- `config` - Gestion de la configuration
- `install` - Installation des modules
- `mirror` - Gestion du mirroring
- `security` - Analyse de sécurité
- `validate` - Validation du code
- `plugin` - Gestion des plugins
- `performance` - Analyse de performance

### 2. Code Quality Tools

Module de gestion de la qualité du code (ESLint, Prettier, etc.).

**Composants:**
- `configAnalyzer.js` - Analyse des configurations existantes
- `configGenerator.js` - Génération de configurations
- `configManager.js` - Gestion globale des configs
- `fileDetector.js` - Détection de fichiers
- `languageTools.js` - Outils par langage
- `toolInstaller.js` - Installation d'outils

### 3. Mirroring

Système de synchronisation multi-plateformes (GitHub, GitLab, BitBucket, Azure).

**Composants:**
- `branchSynchronizer.js` - Synchronisation de branches
- `generate.js` - Génération de workflows
- `repoManager.js` - Gestion des dépôts
- `syncManager.js` - Orchestration de la synchro

### 4. Plugins

Architecture modulaire permettant l'extension des fonctionnalités.

**Composants:**
- `basePlugin.js` - Classe de base pour plugins
- `pluginRegistry.js` - Registre central
- `pluginManager.js` - Gestionnaire de plugins

**Hooks disponibles:**
- `pre-validate` - Avant validation
- `post-validate` - Après validation
- `pre-commit` - Avant commit
- `post-commit` - Après commit

### 5. Performance

Système d'analyse et de collecte de métriques de performance.

**Composants:**
- `metricsCollector.js` - Collecte de métriques
- `performanceAnalyzer.js` - Analyse et rapports
- `performanceReporter.js` - Génération de rapports

### 6. Cache

Système de cache multiniveau (mémoire + disque).

**Composants:**
- `cacheManager.js` - Gestionnaire principal
- `cacheStrategy.js` - Stratégies (LRU, TTL)

**Stratégies:**
- LRU (Least Recently Used) - Cache en mémoire
- TTL (Time To Live) - Cache avec expiration

### 7. Review Apps

Système de déploiement temporaire pour les Pull Requests.

**Composants:**
- `reviewAppManager.js` - Gestion des déploiements
- `prIntegration.js` - Intégration GitHub/GitLab

**Providers supportés:**
- Local
- Docker
- Vercel
- Netlify

## Flux de données

### Validation de code

```
Commit Git
  ↓
Hook pre-commit
  ↓
Validation push-guardian
  ↓
├─ Cache check
├─ Plugin hooks (pre-validate)
├─ ESLint/Prettier
├─ Tests
├─ Contraintes
└─ Plugin hooks (post-validate)
  ↓
Métriques de performance
  ↓
Résultat (success/failure)
```

### Mirroring

```
Push sur GitHub
  ↓
GitHub Action (workflow)
  ↓
SyncManager
  ↓
├─ BranchSynchronizer
├─ RepoManager
└─ API calls (GitLab, etc.)
  ↓
Synchronisation complète
```

### Review Apps

```
Pull Request créée
  ↓
PR Integration détecte la PR
  ↓
ReviewAppManager
  ↓
├─ Création du déploiement
├─ Build de l'app
├─ Déploiement (Vercel/Netlify/Docker)
└─ Commentaire sur PR avec URL
  ↓
Review App accessible
```

## Configuration

### Fichier principal: `push-guardian.config.json`

```json
{
  "codeQualityTools": {
    "enabled": true,
    "tools": ["JavaScript (ESLint)", "TypeScript (TypeScript ESLint)"]
  },
  "mirroring": {
    "enabled": true,
    "platforms": {
      "github": { "enabled": true },
      "gitlab": { "enabled": true }
    }
  },
  "plugins": {
    "enabled": true,
    "paths": ["./plugins"]
  },
  "cache": {
    "enabled": true,
    "strategy": "LRU",
    "maxSize": 200
  },
  "performance": {
    "enabled": true,
    "collectMetrics": true
  }
}
```

## Variables d'environnement

```bash
# Tokens
GITHUB_TOKEN=xxx
GITLAB_TOKEN=xxx
BITBUCKET_TOKEN=xxx

# Mirroring
push-guardian_MIRROR_SOURCE_PLATFORM=github
push-guardian_MIRROR_TARGET_PLATFORM=gitlab

# Review Apps
VERCEL_TOKEN=xxx
NETLIFY_AUTH_TOKEN=xxx

# Performance
push-guardian_ENABLE_METRICS=true
```

## Extensibilité

### Créer un plugin

```javascript
const BasePlugin = require('./src/core/plugins/basePlugin');

class MyPlugin extends BasePlugin {
    constructor() {
        super('my-plugin', '1.0.0');
    }

    async initialize() {
        this.registerHook('pre-validate', async (data) => {
            console.log('Pre-validation personnalisée');
            return data;
        });
    }
}

module.exports = MyPlugin;
```

### Enregistrer le plugin

```bash
npx push-guardian plugin --load ./plugins
```

## Tests

```bash
# Tous les tests
npm test

# Tests avec couverture
npm test -- --coverage

# Tests d'un module spécifique
npm test -- tests/unit/configAnalyzer.test.js
```

## Performance

Le système de performance collecte automatiquement:
- Durée des validations
- Durée des hooks
- Durée du linting
- Taux de succès

Analyse:
```bash
npx push-guardian performance --analyze
```

## Sécurité

- Tokens stockés dans `.env` (non versionné)
- Validation des entrées utilisateur
- Sandboxing des plugins
- Permissions limitées pour les hooks

## Limites connues

- Cache disque limité à 1 Go par défaut
- Review Apps limitées à 10 déploiements simultanés
- Plugins ne peuvent pas modifier le core
- Métriques conservées 30 jours maximum
