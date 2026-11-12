# Double authentification des administrateurs

## Accéder à son compte dans l'application

Ouvrir **http://localhost:5180/login**, puis cliquer sur **Se connecter avec
Keycloak**. La connexion de l'application utilise le realm `orthophoniste` et
le client `orthophoniste-web`. Après connexion, un administrateur est redirigé
vers son espace d'administration dans l'application.

La console **http://localhost:8180/admin/master/console/** sert à administrer
le serveur Keycloak. Elle utilise le realm `master` et ses propres comptes
techniques. Un compte administrateur de l'application ne donne pas accès à
cette console. Y saisir les identifiants de l'application peut donc afficher
« Identifiant ou mot de passe invalide », même si ces identifiants sont corrects
pour l'application.

Si cette erreur apparaît, revenir à **http://localhost:5180/login** et lancer
une nouvelle connexion depuis cette page.

## Mode de développement temporaire

L'obligation MFA est actuellement désactivée pour les administrateurs. Le parcours
actif est `orthophoniste-browser-development` : les administrateurs se connectent
avec leur mot de passe, même s'ils possèdent déjà un authentificateur OTP.
Les credentials OTP et le parcours MFA sont conservés pour une réactivation.
L'OTP facultatif déjà configuré par un patient reste pris en compte.

```powershell
# Désactiver temporairement l'obligation MFA et synchroniser l'export
node keycloak/configure-admin-mfa.mjs --disable

# Réactiver l'obligation MFA et synchroniser l'export
node keycloak/configure-admin-mfa.mjs --enable
```

Ces commandes mettent à jour l'instance locale et `realm-export.json`. Une simple
modification du fichier d'export ne change pas un realm déjà présent dans Keycloak.

## Fonctionnement lorsque la MFA est activée

Les rôles `ROLE_ADMIN` et `ROLE_SUPER_ADMIN` héritent de `ROLE_MFA_REQUIRED`.
Le parcours navigateur `orthophoniste-browser-admin-mfa` impose un mot de passe
puis un code TOTP. Il demande la configuration de l'OTP si le compte n'en possède
pas encore. Cette règle s'applique également aux futurs comptes administrateurs.
Les patients peuvent conserver un OTP déjà configuré sans être obligés d'en créer un.

## Première connexion

1. Se connecter avec les identifiants habituels.
2. Dans l'écran Keycloak de configuration OTP, scanner le QR code avec son
   application d'authentification (par exemple Google Authenticator).
3. Saisir le code à six chiffres et valider.
4. Fournir le code de l'application lors des prochaines connexions complètes.

Les codes changent toutes les 30 secondes. Les sessions SSO authentifiées restent
utilisables sans demander un nouveau code à chaque changement de page.

## Application à une instance locale déjà existante

Un import au démarrage ne met pas à jour un realm déjà présent. Pour synchroniser
la politique avec le Keycloak local sur le port 8180 :

```powershell
node keycloak/configure-admin-mfa.mjs --apply
```

Cette commande synchronise le mode indiqué par l'export. Lorsque ce mode impose
la MFA, elle ferme les sessions Keycloak des administrateurs. La vérification
seule ne modifie pas leur configuration :

```powershell
node keycloak/configure-admin-mfa.mjs
```

Le script utilise les identifiants d'administration locaux définis dans
`KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` ou
`KEYCLOAK_ADMIN_USERNAME` / `KEYCLOAK_ADMIN_PASSWORD`, lus depuis l'environnement
ou le fichier `.env`. Le parcours du realm `master` reste indépendant.
Une sauvegarde des paramètres précédents est conservée dans
`.runtime/keycloak-admin-mfa-before.json`.

## Téléphone perdu

Après vérification de l'identité, un administrateur Keycloak du realm `master`
peut supprimer le credential OTP du compte concerné et fermer ses sessions.
Le compte devra configurer son nouvel authentificateur à la connexion suivante,
car son rôle continue à imposer le second facteur.
