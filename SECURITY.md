# Authentification

L'application utilise Keycloak avec le flux Authorization Code et PKCE côté navigateur. Le SDK Keycloak conserve les jetons en mémoire. Les services Spring valident les jetons via l'issuer et le jeu de clés publiques Keycloak, puis lisent les rôles dans realm_access.roles.
RDV Service obtient un jeton de compte de service avec le flux client_credentials ; Notification Service exige ROLE_SERVICE. Les anciens secrets HMAC JWT ne sont plus utilisés.
Les mots de passe temporaires sont remplacés dans le parcours Keycloak. Les identifiants du realm fourni servent uniquement au développement local.

Pour une installation publique, utiliser TLS, adapter les origines et redirections autorisées, remplacer les secrets locaux et configurer Keycloak en production. La limitation de débit de la gateway est locale à chaque instance ; la connexion Keycloak doit disposer de sa propre protection contre les tentatives répétées. Voir DEPLOYMENT.md.

Les journaux et sauvegardes doivent être protégés et les durées de conservation des données patient définies pour le déploiement concerné. Ce projet ne constitue pas à lui seul une validation de conformité pour l'hébergement de données de santé.