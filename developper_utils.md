# **Documentation Développeur PushGuardian**

PushGuardian est un outil CLI basé sur Node.js pour la validation automatisée de la qualité du code et la gestion des hooks Git. Ce document explique son architecture, ses composants et comment l'étendre.

## **Vue d'ensemble de l'architecture**

PushGuardian suit une architecture modulaire avec une séparation claire des préoccupations :

- **Couche CLI** : Analyse des commandes et interaction utilisateur
- **Couche Core** : Logique métier et moteurs de validation
- **Couche Hooks** : Intégration Git et validation des contraintes
- **Couche Utils** : Utilitaires partagés

## **Composants principaux**

Point d'entrée CLI
Le point d'entrée principal est index.js, qui utilise Commander.js pour définir les commandes. Les commandes sont chargées dynamiquement depuis command.

Structure d'exemple de commande :

```js
module.exports = {
    name: 'example',
    description: 'Commande exemple',
    options: [{ flags: '-v, --verbose', description: 'Sortie verbeuse' }],
    action: async (options) => {
        // Logique de commande
    }
};
```

Gestion de la configuration
La configuration est gérée par configManager.js, qui charge/sauvegarde `pushguardian.config.json.`

Fonctions clés :

- **loadConfig()** : Charge la configuration avec des valeurs par défaut
- **saveConfig(config)** : Sauvegarde la configuration mise à jour

Moteur de validation
La logique de validation principale est dans validator.js, qui orchestre les exécutions ESLint et les validations de hooks.

Moteur de contraintes
Les contraintes sont gérées par constraintEngine.js, un système flexible pour valider les messages et les branches.

Pour ajouter une nouvelle contrainte :

```js
this.constraints.set('newConstraint', (value, param) => {
    // Logique de validation
    return value.length > param;
});
this.errorMessages.newConstraint = (param) => `Le message doit être plus long que ${param} caractères`;
```
Intégration des hooks Git
Les hooks sont définis dans constrains.js, supportant les hooks commit-msg, post-checkout et pre-push.

Flux de validation des hooks :

1. Charger la config pour le hook
2. Appliquer les contraintes via constraintEngine.validate()
3. Quitter avec une erreur si la validation échoue

Pour ajouter un nouveau langage :

```js
const LANGUAGE_TOOLS = {
    'Nouveau Langage': {
        packages: ['eslint-plugin-newlang'],
        setup: setupNewLanguage
    }
};
```

Utilitaires
Utilitaires partagés incluent :

- **exec-wrapper.js** : Wrapper d'exécution de commandes asynchrones
- **chalk-wrapper.js** : Sortie colorisée avec fallback

## **Tests**
Les tests sont dans unit utilisant Jest. Lancez avec `npm test`.

Exemple de test pour le moteur de contraintes :

```js
describe('Moteur de Contraintes', () => {
    test('valide correctement', () => {
        // Logique de test
    });
});
```
## **Étendre PushGuardian**

Ajouter une nouvelle commande

1. Créer un nouveau fichier dans command
2. Exporter l'objet commande comme montré ci-dessus
3. Il sera automatiquement chargé par index.js

Ajouter un nouveau type de hook

1. Mettre à jour constrains.js pour gérer le nouveau hook
2. Ajouter le support de configuration dans configManager.js

Contraintes personnalisées
Utilisez constraintEngine.addConstraint() pour enregistrer de nouveaux validateurs.

## **Gestion des erreurs**
Les erreurs sont centralisées dans errorCMD.js, qui formate et quitte avec les traces de pile.

## **Workflow de développement**

1. Installer les dépendances : npm install
2. Lancer les tests : npm test
3. Lier pour le développement : npm link
4. Construire/vérifier : Utiliser ESLint via npx pushguardian validate

Pour plus de détails, voir le `README.md` principal et `TECHNO.md`.