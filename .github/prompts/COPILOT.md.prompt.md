---
agent: agent
---
Pour chaque fichier source du projet qui n'a pas de fichier de test associé (.test.js, .spec.js), crée des tests unitaires complets avec Jest.

Processus à suivre :

Identification : Analyse la structure du projet et identifie tous les fichiers JavaScript/TypeScript sans tests correspondants.

Création des tests : Pour chaque fichier identifié, crée un fichier de test qui couvre :

Les cas nominaux (fonctionnement normal)

Les cas limites (valeurs extrêmes, null, undefined, etc.)

La gestion d'erreurs

Les différentes branches conditionnelles

Exécution et analyse :

Lance la commande : npm run test:coverage

Cette commande affichera directement le tableau de couverture avec les pourcentages par fichier

Note le taux de couverture global et les fichiers les moins couverts

Itération :

Si le taux de couverture global est inférieur à 80%, identifie les fichiers/fonctions non couverts

Crée des tests supplémentaires pour ces zones manquantes

Relance npm run test:coverage pour vérifier l'amélioration

Finalisation :

Continue jusqu'à atteindre au moins 80% de couverture sur l'ensemble du projet

Assure-toi que les tests sont pertinents et ne testent pas uniquement pour "gonfler" le pourcentage

Le but est d'obtenir un rapport de couverture complet où chaque fichier affiche un pourcentage satisfaisant, visible directement dans le tableau généré par Jest.