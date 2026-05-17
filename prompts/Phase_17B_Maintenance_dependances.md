Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

La Phase 17 est terminée.

Les tests automatisés sont en place et npm run check passe correctement.



Objectif :

Faire une maintenance contrôlée des dépendances sans casser le projet.



Tâches :



1\. Vérifier versions

\- node -v

\- npm -v

\- npm outdated

\- cd frontend \&\& npm outdated



2\. Auditer

À la racine :

npm audit

npm audit --json > logs/npm-audit-root.json



Dans frontend :

npm audit

npm audit --json > ../logs/npm-audit-frontend.json



3\. Corriger prudemment

\- Ne pas utiliser npm audit fix --force.

\- Utiliser d’abord npm audit fix si cela ne provoque pas de breaking changes.

\- Si une correction impose un changement majeur, documenter sans appliquer automatiquement.



4\. Vérifier après correction

Lancer :

npm run test:backend

npm run test:frontend

npm run test:packaging

npm run test:windows

npm run build:frontend

npm run check



5\. Documentation

Créer :

docs/PHASE17B.md



Mettre à jour README.md avec :

\- état audit

\- dépendances corrigées

\- vulnérabilités restantes si non corrigées

\- justification des vulnérabilités non corrigées



6\. Rapport final attendu

Fournir :

\- versions Node/npm

\- vulnérabilités avant/après

\- dépendances modifiées

\- commandes lancées

\- résultats npm run check

\- recommandations restantes



Contraintes :

\- Ne pas casser package-lock.json.

\- Ne pas utiliser --force sans justification.

\- Ne pas supprimer les tests.

\- Ne pas activer d’action sensible.

\- Ne jamais afficher de secret.

