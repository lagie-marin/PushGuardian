# Système de Persistance des Plugins

## Problème résolu

Avant, les plugins chargés avec `--load` n'étaient pas sauvegardés et disparaissaient après la fermeture de la session.

## Solution implémentée

Les plugins sont maintenant **automatiquement sauvegardés** et **rechargés** à chaque nouvelle session.

## Comment ça fonctionne

### 1. Fichier de configuration

Quand vous chargez des plugins, leurs chemins sont sauvegardés dans `.push-guardian-plugins.json` :

```json
{
  "pluginPaths": [
    "/home/user/push-guardian/examples",
    "/home/user/push-guardian/plugins"
  ],
  "plugins": [
    {
      "name": "example-plugin",
      "version": "1.0.0",
      "enabled": true,
      "config": {
        "enabled": true,
        "verbose": true,
        "logLevel": "info"
      }
    }
  ]
}
```

### 2. Chargement automatique

Au démarrage de chaque commande, le `PluginRegistry` :
1. Lit `.push-guardian-plugins.json`
2. Recharge tous les plugins depuis les chemins sauvegardés
3. Restaure leur configuration et état (activé/désactivé)

## Utilisation

### Charger des plugins

```bash
# Charger des plugins depuis un répertoire
npx push-guardian plugin --load ./examples
npx push-guardian plugin --load ./plugins

# Les plugins sont automatiquement sauvegardés
```

### Lister les plugins

```bash
# Dans n'importe quelle session, même après redémarrage
npx push-guardian plugin --list
```

Résultat :
```
Plugins installés:

  [Actif] example-plugin v1.0.0
  [Actif] mon-plugin v2.0.0
```

### Obtenir des informations

```bash
npx push-guardian plugin --info example-plugin
```

Résultat :
```
example-plugin v1.0.0

Status: Activé
Hooks: pre-validate, post-validate, pre-commit
Configuration: { enabled: true, verbose: true }
```

### Activer/Désactiver

```bash
# Désactiver un plugin (reste chargé mais inactif)
npx push-guardian plugin --disable example-plugin

# Réactiver
npx push-guardian plugin --enable example-plugin
```

## Fichiers générés

- `.push-guardian-plugins.json` : Configuration et chemins des plugins
- `.push-guardian-cache/` : Cache du système
- `.review-apps/` : Déploiements des Review Apps
- `performance-report.json` : Rapports de performance

**Note** : Ces fichiers sont dans `.gitignore` et ne sont pas versionnés.

## Fonctionnalités avancées

### Rechargement à chaud

Les plugins sont rechargés (cache vidé) à chaque chargement pour permettre les modifications :

```bash
# Modifier votre plugin
vim examples/example-plugin.js

# Recharger
npx push-guardian plugin --load ./examples

# Les modifications sont prises en compte
```

### Gestion des erreurs

Si un plugin ne peut pas être chargé (erreur de syntaxe, dépendance manquante), il est ignoré silencieusement au démarrage mais l'erreur s'affiche lors du `--load`.

### Désinstallation manuelle

Pour supprimer tous les plugins :

```bash
rm .push-guardian-plugins.json
```

Puis redémarrer une commande - aucun plugin ne sera chargé.

## Exemple complet

```bash
# 1. Charger des plugins
npx push-guardian plugin --load ./examples
# > Plugin example-plugin enregistré
# > 1 plugin(s) chargé(s) depuis ./examples

# 2. Fermer le terminal, en rouvrir un nouveau

# 3. Lister les plugins (ils sont toujours là !)
npx push-guardian plugin --list
# > Plugins installés:
# >   [Actif] example-plugin v1.0.0

# 4. Utiliser le plugin dans une validation
npx push-guardian validate
# > [Example Plugin] Pre-validation hook execute
# > ...

# 5. Désactiver temporairement
npx push-guardian plugin --disable example-plugin

# 6. Réactiver
npx push-guardian plugin --enable example-plugin
```

## Avantages

✅ **Persistance** : Les plugins restent chargés entre les sessions
✅ **Configuration sauvegardée** : État et config restaurés automatiquement  
✅ **Rechargement à chaud** : Modifications prises en compte immédiatement
✅ **Multi-répertoires** : Support de plusieurs dossiers de plugins
✅ **Gestion d'erreurs** : Échec de chargement n'empêche pas les autres plugins
