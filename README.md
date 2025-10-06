# **PushGuardian 🛡️**

**PushGuardian** est un outil complet de validation CI/CD conçu pour garantir la qualité du code et automatiser les vérifications avant les pushs Git. Il intègre des outils comme ESLint, Prettier et des contraintes personnalisées pour analyser, formater et valider votre code selon les meilleures pratiques.

---

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Configuration](#configuration)
- [Sections de Configuration](#sections-de-configuration)
- [Contraintes Disponibles](#contraintes-disponibles)
- [Architecture](#architecture)
- [Flux de Validation](#flux-de-validation)
- [Développement](#développement)
- [Dépannage](#dépannage)
- [Contribution](#contribution)
- [Licence](#licence)
- [Auteurs](#auteurs)
---

## **Fonctionnalités**

### **🔧 Validation de Code Automatique**
- **Analyse statique** avec ESLint pour multiples langages (JavaScript, TypeScript, JSON, Markdown, CSS, YAML, HTML)
- **Formatage automatique** avec Prettier
- **Correction automatique** des erreurs fixables
- **Mode strict** pour échouer sur les warnings

### **🔗 Hooks Git Intelligents**
- **Pre-push** : Validation du code avant le push
- **Commit-msg** : Validation du format des messages de commit
- **Post-checkout** : Validation des noms de branches

### **🎯 Contraintes Personnalisables**
- **Messages de commit** : Format [TYPE]: description avec types personnalisables
- **Noms de branches** : Validation selon des patterns définis
- **Contraintes avancées** : longueur, caractères spéciaux, mots interdits, etc.

### **📊 Multi-Langages Supportés**
- **JavaScript/TypeScript** avec configuration ESLint avancée
- **CSS/SCSS** avec Stylelint
- **Markdown, JSON, YAML, HTML** avec plugins dédiés
- **Détection automatique** des langages utilisés dans le projet

---

## **Installation**

### **Prérequis**

- **Node.js** version 16 ou supérieure
- **npm** ou **yarn**
- **Git** (pour les hooks)

### **Installation Globale**

```bash
npm install -g pushguardian
```
### **Installation Locale dans un Projet**

```bash
cd votre-projet
npx pushguardian install
```

### **Développement**
```bash
git clone <repository>
cd pushguardian
npm install
npm link  # Pour l'utiliser en développement
```

## **Utilisation**
### **Commandes Principales**

### **1. Installation Interactive**
```bash
npx pushguardian install
```

Lance un menu interactif pour installer :

* **Hooks Git** : Configure les hooks Git automatiquement
* **Code Quality Tools** : Installe et configure ESLint, Prettier, etc.

Options:
* `--force`: Force l'installation même si les hooks existent déjà

### **2. Validation du Code**
```bash
npx pushguardian validate
```
Valide le code selon la configuration établie.

Options :

* `**--fix**` : Corrige automatiquement les erreurs fixables
* `**--strict**` : Échoue si des warnings sont détectés
* `**--verbose**` : Affiche plus de détails
* `**--hooks <hook>**` : Valide spécifiquement certains hooks

### **3. Gestion de Configuration**
```bash
npx pushguardian config [clé] [valeur]
```
Gère la configuration de PushGuardian.

Options :

* `--list` : Affiche toute la configuration actuelle
* `[clé] [valeur]` : Modifie une valeur spécifique

Exemples :
```bash
npx pushguardian config --list
npx pushguardian config validate.directories '["src/", "lib/"]'
```

## **Configuration**
### **Fichier de Configuration Principal**
PushGuardian utilise un fichier `pushguardian.config.json` à la racine de votre projet :
```json
{
  "validate": {
    "directories": ["./"],
    "onMissing": "ignore",
    "activateCQT": true
  },
  "hooks": {
    "commit-msg": {
      "type": ["ADD", "UPDATE", "DELETE", "FIX", "MERGE", "CHORE"], 
      "constraints": {
        "maxLength": 80,
        "mustStartWith": "[",
        "mustEndWith": "]"
      }
    },
    "post-checkout": {
      "type": ["main", "develop", "feat", "fix", "chore"],
      "constraints": {
        "noUppercase": true,
        "noSpecialChars": true
      }
    },
    "pre-push": {}
  }
}
```
## **Sections de Configuration**
## **🔍 Validation (validate)**
* `directories` : Tableau des répertoires à analyser
* `onMissing` : Comportement si répertoire manquant (ignore ou error)
* `activateCQT` : Active/désactive les outils de qualité de code

## 🔗 Hooks Git (`hooks`)
### **Commit Message (`commit-msg`)**

* `type` : Types de commits autorisés
* `constraints` : Contraintes supplémentaires

### **Post Checkout (`post-checkout`)**
* `type` : Types de branches autorisés
* `constraints` : Contraintes sur les noms de branches
### **Pre Push (`pre-push`)**
* Validation automatique du code avant push
## **Contraintes Disponibles**

Voici les contraintes prédéfinies que vous pouvez utiliser dans la configuration des hooks :

| Contrainte       | Description              | Exemple                          |
|------------------|--------------------------|----------------------------------|
| maxLength       | Longueur maximale       | `"maxLength": 80`               |
| minLength       | Longueur minimale       | `"minLength": 10`               |
| mustStartWith   | Doit commencer par      | `"mustStartWith": "["`          |
| mustEndWith     | Doit terminer par       | `"mustEndWith": "]"`            |
| autoStartWith   | Mis automatiquement si manquant | `"autoStartWith": "["`          |
| noUppercase     | Pas de majuscules       | `"noUppercase": true`           |
| noDigits        | Pas de chiffres         | `"noDigits": true`              |
| noSpecialChars  | Pas de caractères spéciaux | `"noSpecialChars": true`        |
| disallowedWords | Mots interdits           | `"disallowedWords": ["test", "tmp"]` |
| mustMatchPattern| Doit matcher un regex   | `"mustMatchPattern": "^\\[.*\\]:"` |

## **Architecture**
### **Structure des Fichiers**
```text
pushguardian/
├── src/
│   ├── cli/                          # Interface en ligne de commande
│   │   ├── command/                  # Commandes principales
│   │   │   ├── config.js             # Gestion configuration
│   │   │   ├── install.js            # Installation système
│   │   │   └── validate.js           # Validation manuelle
│   │   ├── index.js                  # Point d'entrée CLI
│   │   └── install/                  # Sous-commandes installation
│   │       ├── codeQualityTools.js   # Installation outils qualité
│   │       └── hooks.js              # Installation hooks Git
│   │
│   ├── core/                         # Cœur métier de l'application
│   │   ├── codeQualityTools/         # Gestion outils qualité code
│   │   │   ├── configAnalyzer.js     # Analyse configurations existantes
│   │   │   ├── configGenerator.js    # Génération configurations
│   │   │   ├── configManager.js      # Gestion configurations CQT
│   │   │   ├── fileDetector.js       # Détection types de fichiers
│   │   │   ├── languageTools.js      # Outils par langage
│   │   │   └── toolInstaller.js      # Installation outils
│   │   │
│   │   ├── configManager.js          # Gestion configuration globale
│   │   ├── createPushGuardianConfig.js # Création config PushGuardian
│   │   ├── errorCMD.js               # Gestion centralisée des erreurs
│   │   ├── interactiveMenu/          # Système de menus interactifs
│   │   │   └── interactiveMenu.js    # Menu de sélection
│   │   └── validator.js              # Moteur de validation principal
│   │
│   ├── hooks/                        # Gestion des hooks Git
│   │   └── constrains/               # Système de contraintes
│   │       ├── constrains.js         # Définition des contraintes
│   │       └── constraintEngine.js   # Moteur d'exécution contraintes
│   │
│   └── utils/                        # Utilitaires partagés
│       └── exec-wrapper.js           # Wrapper pour exécution commandes
└── tests/                            # Tests automatisés
    └── unit/
```
## **Flux de Validation**
1. **Détection** : Scan du projet pour identifier les langages utilisés
2. **Configuration** : Génération automatique des fichiers de config ESLint
3. **Installation** : Setup des hooks Git et dépendances npm
4. **Validation** : Exécution des vérifications selon les hooks déclenchés
5. **Rapport** : Affichage clair des erreurs et suggestions

## **🔧 Développement**
### **Ajouter une Nouvelle Contrainte**
1. **Dans** `votre_fichier.js` :
```js
const { constraintEngine } = require('./constraintEngine');

constraintEngine.addConstraint(
  'maNouvelleContrainte',
  (value, param) => {
    // Logique de validation
    return value.includes(param);
  },
  (param) => `Le message doit contenir "${param}"`
);
```
2. **Utilisation dans la config (en cours de développement) :**
```json
{
  "constraints": {
    "maNouvelleContrainte": "valeur-requise"
  }
}
```
## **Ajouter un Support de Langage**
1. **Dans** `codeQualityTools.js` :
```js
const LANGUAGE_TOOLS = {
  'Nouveau Langage': {
    packages: ['package-eslint', 'autre-package'],
    setup: setupNouveauLangage
  }
};
```
2. **Implémenter la fonction setup :**
```js
async function setupNouveauLangage() {
  // Configuration spécifique au langage
}
```
## **Dépannage**
## **Problèmes Courants**
### **❌ "Hook existe déjà"**
```bash
npx pushguardian install --force
```
### **❌ "Répertoire .git/hooks non trouvé"**
Assurez-vous d'être dans un dépôt Git initialisé :
```bash
git init
```
### **❌ "Erreurs ESLint"**
Vérifiez la configuration dans `eslint.config.js` et ajustez selon votre projet.

### **❌ "Permissions denied sur les hooks"**
```bash
chmod +x .git/hooks/*
```
## **Logs de Débogage**
Activez le mode verbeux :
```bash
npx pushguardian validate --verbose
```
## **Réinitialisation**
Pour tout réinitialiser :
```bash
rm -f pushguardian.config.json
rm -f eslint.config.js
rm -f .git/hooks/pre-push .git/hooks/commit-msg .git/hooks/post-checkout
```
## **Contribution**
Les contributions sont bienvenues ! Voici comment contribuer :
1. **Fork** le repository
2. **Créez** une branche : git checkout -b feature/ma-fonctionnalite
3. **Commitez** vos changements : git commit -am 'Ajout ma fonctionnalité'
4. **Push** : git push origin feature/ma-fonctionnalite
5. **Ouvrez** une Pull Request

## **Standards de Code**
* Suivez le style de code existant
* Ajoutez des tests pour les nouvelles fonctionnalités
* Mettez à jour la documentation

## **Licence**
Ce projet est sous licence ISC.

# **Auteurs**

![AUTHORS](https://img.shields.io/badge/AUTHORS:-gray?style=for-the-badge)
![https://github.com/lagie-marin](https://img.shields.io/badge/Marin%20Lagie-yellow?style=for-the-badge&logo=undertale&logoColor=E71D29)