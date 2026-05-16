Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 5 sont terminées.



Le projet contient :

\- frontend HTML/CSS/JS modulaire

\- backend Node.js Express

\- API locale

\- fallback JSON

\- centre multimédia

\- orchestrateur de scénarios

\- historique local

\- connecteurs préparés :

&nbsp; - YouTube embed actif

&nbsp; - galerie locale configurable

&nbsp; - ADB préparé mais désactivé

&nbsp; - DLNA préparé mais désactivé

&nbsp; - SmartThings préparé mais désactivé



Objectif de la Phase 6 :

Activer progressivement le connecteur ADB en lecture seule pour le Samsung Galaxy S23 Ultra.



Cette phase doit permettre à Sallon-ConnecT de détecter un appareil Android autorisé et d’afficher uniquement des métadonnées générales non sensibles.



Important :

Ne pas copier de fichiers.

Ne pas lire les photos.

Ne pas supprimer de données.

Ne pas installer d’application.

Ne pas modifier le téléphone.

Ne pas exécuter de commande destructive.

Ne pas stocker de numéro de série réel dans Git.

Ne pas afficher d’identifiants sensibles complets.



1\. Variables d’environnement



Mettre à jour `.env.example` :



ADB\_ENABLED=false

ADB\_PATH=

ADB\_DEVICE\_ID=

ADB\_READ\_ONLY=true

ADB\_COMMAND\_TIMEOUT\_MS=5000

ADB\_MASK\_DEVICE\_ID=true



Explication :

\- ADB\_ENABLED=false par défaut

\- ADB\_READ\_ONLY=true obligatoire

\- ADB\_DEVICE\_ID facultatif

\- ADB\_MASK\_DEVICE\_ID=true masque les IDs dans les réponses API et les logs



2\. Sécurité centrale ADB



Créer ou compléter :



server/src/services/media/adbSafety.js



Ce module doit contenir :



\- une allowlist stricte des commandes autorisées

\- une fonction validateAdbCommand(command)

\- une fonction maskDeviceId(value)

\- une fonction sanitizeAdbOutput(output)

\- une fonction buildSafeError(error)



Commandes autorisées uniquement :

\- adb devices

\- adb shell getprop ro.product.model

\- adb shell getprop ro.product.manufacturer

\- adb shell getprop ro.build.version.release

\- adb shell dumpsys battery

\- adb shell df /sdcard

\- adb shell content query pour MediaStore uniquement si non sensible

\- adb shell find sur dossiers médias publics uniquement si explicitement configuré



Commandes interdites :

\- adb pull

\- adb push

\- adb install

\- adb uninstall

\- adb shell rm

\- adb shell mv

\- adb shell cp

\- adb shell input

\- adb shell am

\- adb shell pm

\- adb reboot

\- adb root

\- adb remount

\- toute commande contenant /data/data

\- toute commande contenant des chemins privés Android



3\. Connecteur ADB



Compléter :



server/src/services/media/adbConnector.js



Fonctions attendues :



\- getStatus()

\- listDevices()

\- getDeviceModel()

\- getBatteryInfo()

\- getStorageInfo()

\- getAndroidVersion()

\- getMediaSummary()

\- getSafeDiagnostics()

\- runSafeAdbCommand(command)



Comportement attendu :



Si ADB\_ENABLED=false :

retourner status: "disabled"



Si adb introuvable :

retourner status: "unavailable"



Si aucun appareil :

retourner status: "no\_device"



Si appareil non autorisé :

retourner status: "unauthorized"



Si appareil autorisé :

retourner status: "available"



Tous les retours doivent masquer l’ID réel si ADB\_MASK\_DEVICE\_ID=true.



4\. Endpoints API ADB



Créer ou compléter :



server/src/routes/adb.js



Ajouter :



GET /api/adb/status

Retourne l’état ADB.



GET /api/adb/devices

Liste les appareils Android visibles, IDs masqués.



GET /api/adb/diagnostics

Retourne :

\- modèle

\- fabricant

\- version Android

\- batterie

\- stockage

\- résumé média non sensible

\- statut autorisation



POST /api/adb/refresh

Relance une lecture ADB non destructive.



GET /api/adb/safety

Retourne :

\- readOnly: true

\- allowedCommands

\- blockedPatterns

\- sensitiveDataMasking: true



5\. Intégration avec /api/integrations/status



Mettre à jour l’endpoint existant pour inclure :



adb: {

&nbsp; status,

&nbsp; readOnly,

&nbsp; available,

&nbsp; masked,

&nbsp; lastCheckedAt

}



6\. Frontend



Dans `index.html`, ajouter une section dans le Centre multimédia ou Diagnostic :



“Diagnostic smartphone Android”



La section doit afficher :

\- état ADB

\- appareil détecté ou non

\- modèle

\- version Android

\- batterie

\- stockage

\- résumé média non sensible

\- avertissement sécurité

\- bouton “Actualiser diagnostic ADB”



Dans `assets/js/app.js`, ajouter :

\- loadAdbStatus()

\- loadAdbDiagnostics()

\- refreshAdbDiagnostics()

\- renderAdbPanel()

\- gestion claire des cas :

&nbsp; - disabled

&nbsp; - unavailable

&nbsp; - no\_device

&nbsp; - unauthorized

&nbsp; - available



Dans `assets/css/styles.css`, ajouter :

\- carte diagnostic ADB

\- badges disabled / unavailable / unauthorized / available

\- bloc sécurité lecture seule

\- affichage clair des données masquées



7\. Scénarios intelligents



Mettre à jour les scénarios :



Mode Famille :

\- peut utiliser ADB diagnostics pour vérifier disponibilité smartphone

\- ne lit pas les photos

\- propose seulement “smartphone disponible pour future galerie”



Mode Diagnostic réseau :

\- ajoute diagnostic Android si ADB activé

\- affiche statut ADB sans action destructive



8\. Documentation



Créer :



docs/PHASE6.md



Contenu :

\- objectif Phase 6

\- fonctionnement ADB

\- activation contrôlée

\- variables .env

\- commandes autorisées

\- commandes bloquées

\- sécurité lecture seule

\- endpoints ajoutés

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 6

\- procédure d’activation ADB

\- avertissement sécurité

\- commandes de test



9\. Commandes de test



Ajouter dans README :



Installation ADB :

\- installer Android SDK Platform Tools

\- activer les options développeur sur le téléphone

\- activer le débogage USB

\- connecter le téléphone

\- accepter l’autorisation sur l’écran du téléphone



Tests backend :



npm start



curl http://localhost:3000/api/adb/status

curl http://localhost:3000/api/adb/devices

curl http://localhost:3000/api/adb/diagnostics

curl http://localhost:3000/api/adb/safety

curl -X POST http://localhost:3000/api/adb/refresh



10\. Critères d’acceptation



La Phase 6 est réussie si :



\- ADB est désactivé par défaut

\- l’application fonctionne sans ADB

\- l’application fonctionne avec ADB activé

\- aucun identifiant sensible complet n’est affiché

\- aucun fichier du téléphone n’est copié

\- aucune commande destructive n’est possible

\- les commandes interdites sont bloquées

\- les diagnostics lecture seule fonctionnent

\- les scénarios Famille et Diagnostic réseau utilisent le statut ADB sans lire de contenu privé

\- README.md et docs/PHASE6.md sont mis à jour



11\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- commandes ADB autorisées

\- commandes ADB bloquées

\- comportement ADB désactivé

\- comportement ADB sans téléphone

\- comportement ADB non autorisé

\- comportement ADB autorisé

\- comportement frontend

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas supprimer le fallback JSON.

\- Ne jamais ajouter de vraies données personnelles.

\- Ne jamais copier de fichiers depuis le téléphone.

\- Ne jamais lire de photos réelles.

\- Ne jamais exécuter d’action destructive.

\- Garder le projet local, simple, stable et sécurisé.

