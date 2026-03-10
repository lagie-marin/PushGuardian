# Guide de Performance push-guardian

## Introduction

Le module de performance de push-guardian permet d'analyser et d'optimiser les temps d'exécution des validations, hooks et autres opérations.

## Collecte de métriques

### Activation

La collecte de métriques est activée par défaut. Pour la désactiver:

```javascript
// push-guardian.config.json
{
  "performance": {
    "enabled": false
  }
}
```

### Métriques collectées

Le système collecte automatiquement:

- **Validation**: Durée des validations ESLint/Prettier
- **Hooks**: Temps d'exécution des hooks Git
- **Linting**: Performance du linting par fichier
- **Tests**: Durée des tests unitaires

## Utilisation

### Analyse en ligne de commande

```bash
# Analyser les performances actuelles
npx push-guardian performance --analyze

# Comparer avec un rapport précédent
npx push-guardian performance --compare performance-report.json

# Réinitialiser les métriques
npx push-guardian performance --reset
```

### Analyse programmatique

```javascript
const performanceAnalyzer = require('push-guardian/core/performance/performanceAnalyzer');

// Lancer une analyse
const report = await performanceAnalyzer.analyze();

console.log(report.summary);
// {
//   totalDuration: 15234,
//   totalOperations: 42
// }
```

## Interprétation des résultats

### Rapport d'analyse

```
Rapport de Performance
==================================================

Resume:
  Duree totale: 15.23s
  Operations: 42

Validation:
  Nombre: 10
  Duree moyenne: 450ms
  Taux de succes: 90.0%

Hooks:
  Nombre: 20
  Duree moyenne: 123ms
  Taux de succes: 100.0%

Recommandations:
  Validation lente (>30s). Considerez l'utilisation du cache.
  Performances optimales !

==================================================

Rapport sauvegarde: performance-report.json
```

### Seuils de performance

| Métrique | Optimal | Acceptable | Lent |
|----------|---------|------------|------|
| Validation totale | <10s | 10-30s | >30s |
| Hook individuel | <1s | 1-5s | >5s |
| Linting | <5s | 5-10s | >10s |
| Taux de succès | >95% | 80-95% | <80% |

## Optimisation

### 1. Utilisation du cache

Le cache peut réduire significativement les temps de validation:

```javascript
// push-guardian.config.json
{
  "cache": {
    "enabled": true,
    "strategy": "LRU",
    "maxSize": 200,
    "ttl": 3600000
  }
}
```

**Gain attendu**: 30-70% de réduction sur les fichiers non modifiés

### 2. Exclusion de fichiers

Exclure les fichiers non pertinents:

```javascript
// eslint.config.js
module.exports = [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '**/*.min.js',
      'coverage/'
    ]
  }
];
```

**Gain attendu**: 20-50% selon le nombre de fichiers exclus

### 3. Parallélisation

Activer la parallélisation des validations:

```javascript
// push-guardian.config.json
{
  "codeQualityTools": {
    "parallel": true,
    "maxWorkers": 4
  }
}
```

**Gain attendu**: 40-60% sur machines multi-cœurs

### 4. Validation incrémentale

Valider uniquement les fichiers modifiés:

```bash
# Git hook pre-commit
npx push-guardian validate --staged
```

**Gain attendu**: 80-95% sur les commits partiels

### 5. Optimisation des hooks

```javascript
class OptimizedPlugin extends BasePlugin {
    async initialize() {
        this.registerHook('pre-validate', async (data) => {
            // Éviter les opérations lourdes
            // Utiliser le cache
            const cached = cache.get('my-key');
            if (cached) return cached;
            
            // Calculer uniquement si nécessaire
            const result = await heavyOperation();
            cache.set('my-key', result);
            
            return result;
        });
    }
}
```

## Benchmarking

### Comparer les performances

```bash
# Baseline
npx push-guardian performance --analyze
mv performance-report.json baseline.json

# Après optimisation
npx push-guardian performance --analyze
npx push-guardian performance --compare baseline.json
```

### Résultat de comparaison

```
Comparaison avec le rapport precedent:

  Duree: -5.34s
  Operations: +2
```

## Métriques avancées

### Enregistrement manuel

```javascript
const metricsCollector = require('push-guardian/core/performance/metricsCollector');

metricsCollector.start();

// Votre opération
const startTime = Date.now();
await myOperation();
const duration = Date.now() - startTime;

metricsCollector.recordValidation({
    name: 'my-operation',
    duration,
    success: true
});

const stats = metricsCollector.getStatistics();
```

### Hooks personnalisés

```javascript
metricsCollector.recordHook('pre-commit', 1234, true);
metricsCollector.recordLinting({
    file: 'src/app.js',
    duration: 456,
    errors: 0
});
```

## Profiling détaillé

### Analyse par fichier

```javascript
const report = await performanceAnalyzer.analyze();

report.linting.forEach(metric => {
    console.log(`${metric.file}: ${metric.duration}ms`);
});
```

### Top des fichiers lents

```javascript
const slowFiles = report.linting
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

console.log('Fichiers les plus lents:');
slowFiles.forEach(f => {
    console.log(`  ${f.file}: ${f.duration}ms`);
});
```

## Monitoring en production

### Intégration CI/CD

```yaml
# .github/workflows/performance.yml
name: Performance Monitoring

on: [push]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Analyse performance
        run: |
          npx push-guardian performance --analyze
          
      - name: Upload rapport
        uses: actions/upload-artifact@v2
        with:
          name: performance-report
          path: performance-report.json
```

### Alertes

```javascript
class PerformanceAlertPlugin extends BasePlugin {
    async initialize() {
        this.registerHook('post-validate', async (data) => {
            if (data.duration > 30000) {
                await this.sendAlert('Validation lente detectee');
            }
            return data;
        });
    }

    async sendAlert(message) {
        // Envoyer email, Slack, etc.
    }
}
```

## Bonnes pratiques

### 1. Mesurer régulièrement

```bash
# Ajouter à votre workflow quotidien
npx push-guardian performance --analyze
```

### 2. Établir des baselines

Sauvegarder des rapports de référence après chaque release:

```bash
npx push-guardian performance --analyze
cp performance-report.json baselines/v2.0.0.json
```

### 3. Surveiller les régressions

Comparer automatiquement avec la baseline:

```bash
npx push-guardian performance --analyze
npx push-guardian performance --compare baselines/v2.0.0.json
```

### 4. Optimiser progressivement

Identifier et corriger les problèmes un par un, en mesurant l'impact:

1. Identifier le goulot d'étranglement
2. Appliquer une optimisation
3. Mesurer l'amélioration
4. Valider en production

## Dépannage

### Performance dégradée

**Symptôme**: Validations lentes (>30s)

**Solutions**:
1. Activer le cache
2. Exclure node_modules et dist
3. Utiliser la validation incrémentale
4. Vérifier les plugins lents

### Hooks lents

**Symptôme**: Hooks >5s

**Solutions**:
1. Profiler le hook
2. Optimiser les opérations I/O
3. Utiliser le cache
4. Réduire les appels externes

### Cache inefficace

**Symptôme**: Peu de cache hits

**Solutions**:
1. Augmenter la taille du cache
2. Ajuster le TTL
3. Vérifier les clés de cache
4. Utiliser la stratégie LRU

## Ressources

- [Guide d'architecture](./architecture.md)
- [Guide des plugins](./plugins-guide.md)
- [Documentation du cache](../cache.md)
