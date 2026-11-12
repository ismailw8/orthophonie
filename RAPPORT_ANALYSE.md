# Analyse et version corrigée — 6 octobre 2026

## Périmètre

Analyse des six modules Maven, de leurs sources Java et tests, des configurations Spring, du frontend React/Vite, de l'authentification Keycloak, des scripts Windows, de Docker Compose et de la CI. Les modifications déjà présentes dans le projet ont été conservées. Ce travail vérifie les versions, la compilation et les points de démarrage ; il ne constitue pas un audit fonctionnel exhaustif de chaque parcours métier.

## Versions retenues

| Composant | Avant | Version livrée |
|---|---|---|
| Java cible | 21 | 21 |
| Spring Boot | 3.2.4 dans chaque module | 3.5.16 dans le parent commun |
| Spring Cloud | 2023.0.1 dans chaque module | 2025.0.3 dans le parent commun |
| Maven Wrapper | 3.9.15, script Windows défaillant | 3.9.15, script corrigé |
| Twilio Java | 9.14.0 | 13.0.2 |
| Keycloak serveur | 26.0 dans Compose | 26.8.0 |
| Node.js Docker/CI | 20 | 24 |
| React/Vite | 19.2.6 / 8.0.12 | Versions conservées et verrouillées |

Spring Cloud 2025.0 correspond à Spring Boot 3.5 selon la [matrice officielle Spring](https://spring.io/projects/spring-cloud/). Java 21 est compatible avec les [prérequis Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html). Les versions Boot, Cloud et Twilio ont été confirmées dans les métadonnées Maven Central. Keycloak 26.8.0 a été téléchargé depuis sa publication officielle, et `kc.bat --version` a confirmé son fonctionnement avec Java 21.0.5.

## Corrections

- Parent Maven racine et import commun du BOM Spring Cloud : les six modules utilisent les mêmes versions et se compilent ensemble.
- Ajout du starter de test manquant dans Discovery Service et du LoadBalancer nécessaire au client Feign de RDV Service.
- Nouveau starter Gateway Server WebFlux et migration des propriétés sous `spring.cloud.gateway.server.webflux`.
- Correction du prédicat RDV : `predicates: ["Path=/api/rdv/**,/api/rdv"]`. La liste non citée faisait interpréter `/api/rdv` comme un second prédicat invalide et empêchait le chargement du contexte.
- Correction du type des autorités dans les quatre convertisseurs de rôles Spring Security.
- Suppression des anciens filtres HMAC JWT dans Suivi et Notification, et des dépendances JJWT devenues inutiles. Ces filtres entraient en concurrence avec les resource servers Keycloak.
- Jeton interservice obtenu auprès de Keycloak via `client_credentials`, mis en cache et renouvelé avant expiration. Notification exige le rôle `ROLE_SERVICE`.
- Comptes de service ajoutés au realm importé : permissions de gestion des utilisateurs pour Auth et rôle de service pour RDV.
- Twilio désactivé par défaut, paramètres optionnels au démarrage, échec explicite d'un envoi lorsque le fournisseur est désactivé.
- Tous les appels `/api` du frontend passent maintenant par la gateway. Variable inutilisée retirée du composant ProtectedRoute.
- Scripts de compilation, lancement, arrêt et création d'archive. Le lancement vérifie MongoDB et les ports, attend les réponses des composants et conserve les journaux dans `.runtime`.
- Correction du wrapper Windows qui indexait une propriété `Target` nulle. Normalisation des variables d'environnement héritées en double (`PATH`/`Path`) avant `Start-Process`.
- CI et Docker alignés sur Node 24 et le nouveau parent Maven ; configurations locales et documentation alignées sur Keycloak.

## Vérifications réalisées

| Vérification | Résultat |
|---|---|
| Six JAR Spring Boot exécutables | Générés ; manifestes et classes vérifiés |
| Tests backend | 13 réussis, aucune erreur ni échec |
| Discovery | 1 test réussi |
| Gateway | 3 tests réussis |
| Auth | 1 test réussi |
| RDV | 6 tests réussis : contexte, disponibilité, acquisition/cache/renouvellement de jeton |
| Suivi | 1 test réussi |
| Notification | 1 test réussi sans identifiants Twilio |
| Frontend | `npm run lint` et `npm run build` réussis |
| Compose | `docker compose config --quiet` réussi |
| Scripts PowerShell | Syntaxe vérifiée |

Les compilations ont utilisé le cache Maven existant, avec des répertoires de validation isolés. Dans le bac à sable Windows, `javac` a rencontré des refus d'accès lors de la fermeture des archives JAR ; la compilation externe et l'exécution séparée des tests ont permis de vérifier les classes et de produire les artefacts. Ces difficultés d'environnement ne sont pas masquées dans les journaux.

## Limites restant à vérifier

Le démarrage complet et le parcours de connexion dans un navigateur n'ont pas été confirmés. Keycloak démarre son outil de version, mais son lancement serveur dans le bac à sable échoue avec `AccessDeniedException` sur la lecture de son archive. Les tentatives de lancement hors du bac à sable ont été bloquées par expiration du contrôle automatique d'autorisation. Docker Desktop est arrêté sur cette machine ; les images n'ont donc pas été construites ni démarrées ici.

L'audit npm disponible signale **31 vulnérabilités : 27 élevées, 2 modérées et 2 faibles**, comprenant des dépendances de développement et des paquets applicatifs. La mise à jour des paquets n'a pas pu être autorisée avant l'expiration du contrôle automatique ; le réseau du bac à sable refuse la résolution de registry.npmjs.org. Le fichier de verrouillage est conservé pour une installation reproductible, mais les vulnérabilités ne sont pas annoncées comme corrigées. Cette version doit rester destinée à la validation locale tant que ces mises à jour et le parcours complet ne sont pas vérifiés.

## Utilisation

Dans le projet actuel, lancer `launch-release.cmd` pour utiliser les JAR déjà construits, puis ouvrir http://localhost:5180. Java 21, Node 24 et MongoDB doivent être disponibles. Le compte applicatif et les instructions d'arrêt sont dans README.md.

L'archive `releases/orthophoniste-platform-1.0.0.zip` contient les sources, les JAR, le frontend compilé, le realm et les scripts. Elle exclut les données locales, les caches, les journaux et les fichiers `.env` privés. Sur une nouvelle machine, le premier lancement télécharge Keycloak et installe les paquets frontend.
