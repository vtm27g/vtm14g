VIRALTECH MARKET — VTM14 — BUILD OFFLINE ET LICENCE (GITHUB)

INSTALLATION
1. Décompresser l'archive.
2. Ouvrir le dossier afterglow-web-main.
3. Publier TOUT son contenu à la racine du dépôt GitHub Pages.
4. Ne publier aucun fichier de codes privés, secret ou clé d'administration.
5. Ouvrir une première fois le site avec Internet et attendre le chargement complet
   des ressources. La première activation nécessite Internet.
6. Après réponse positive du serveur, la licence est enregistrée dans IndexedDB et
   localStorage. Le code en clair n'est pas conservé.
7. Fermer et rouvrir le site, puis tester hors connexion.

LICENCE
- Une activation déjà enregistrée démarre sans appel réseau et sans redemander
  le code, même hors connexion.
- L'ancien code stocké dans vtm14.license.code est revalidé une dernière fois en
  ligne, puis remplacé par un état local sans code.
- La licence locale est liée à l'identifiant persistant de ce profil navigateur.
- Effacer les données du site, changer de profil, réinitialiser la console ou
  copier le profil peut faire perdre ou dupliquer cet état. Ce n'est pas une
  identité matérielle inviolable.

CACHE
- service-worker.js précache les pages, scripts, images et fichiers binaires pour
  les navigateurs modernes compatibles.
- cache.appcache est conservé pour les navigateurs anciens de console qui le
  prennent en charge. AppCache est obsolète sur les navigateurs modernes.
- Il faut visiter le site en ligne et attendre la fin du premier chargement avant
  le test hors connexion.
- Aucun navigateur ne garantit 100 % de conservation : quotas, manque d'espace,
  effacement des données, réinitialisation, éviction du cache ou panne peuvent
  supprimer les ressources. Garder une copie du ZIP.
- Le cache conserve les ressources du site ; il ne crée pas une connexion Internet.

API
L'API configurée dans launch.js est :
https://vtm27-activation-api.vtm27market.workers.dev
Elle doit réellement être déployée et retourner explicitement un succès JSON
({ "activated": true }, { "valid": true } ou { "success": true }).
Cette archive ne déploie pas le serveur Cloudflare et ne transfère pas les codes.
Le serveur doit réserver atomiquement chaque code à un seul deviceId.

MISE À JOUR
Après modification d'un fichier :
- incrémenter CACHE_NAME dans service-worker.js (vtm14-static-v4, etc.) ;
- exécuter ./make-manifest.sh ;
- republier tous les fichiers et attendre le déploiement GitHub Pages.

VÉRIFICATIONS DE CETTE ARCHIVE
Contrôle ZIP, présence des fichiers du cache et syntaxe JavaScript Node.js.
Ces contrôles statiques ne remplacent pas un test sur la console/firmware réel
et ne garantissent pas l'absence absolue de crash.
