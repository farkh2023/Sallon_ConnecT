# Guide d'installation PWA

Sallon-ConnecT peut etre installe comme application web progressive depuis un navigateur compatible.

## Installer depuis Chrome ou Edge

1. Demarrez Sallon-ConnecT.
2. Ouvrez http://localhost:3001.
3. Dans la barre d'adresse, cherchez l'icone d'installation.
4. Cliquez sur `Installer`.
5. Confirmez l'installation.

Selon le navigateur, l'option peut aussi se trouver dans le menu principal sous `Installer cette application`.

## Bouton Installer

Le dashboard peut afficher un bouton `Installer` quand le navigateur autorise l'installation PWA. Si le bouton n'apparait pas, utilisez le menu du navigateur.

## Fonctionnement offline limite

La PWA peut afficher une page offline et certains elements caches. Les fonctions qui interrogent l'API locale ont besoin du backend actif.

## Page offline

Si le frontend est ouvert mais que le reseau local ou le backend est indisponible, une page offline peut s'afficher. Elle indique que les fonctions dynamiques ne sont pas disponibles.

## Limites importantes

- Les API locales necessitent le backend actif sur http://localhost:3000.
- Les actions sensibles restent cote backend.
- La PWA ne remplace pas les scripts de demarrage.
- La PWA ne stocke pas de secret.
- Un cache ancien peut afficher une version obsolete de l'interface. Voir [Depannage](TROUBLESHOOTING.md).
