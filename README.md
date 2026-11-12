# Orthophoniste Platform

Plateforme composée de six services Spring Boot et d'une application React.
Java 21, Spring Boot 3.5.16, Spring Cloud 2025.0.3, Maven 3.9.15 et Node.js 24 LTS.
Les versions Java sont centralisées dans le `pom.xml` racine et celles du frontend sont verrouillées dans `package-lock.json`.

## Lancer sous Windows

Prérequis : JDK 21, Node.js 24 LTS et MongoDB disponible sur localhost:27017. Maven est fourni par le wrapper.
Depuis la racine du projet :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
```

Le script compile et teste les six services, installe le frontend avec `npm ci`, vérifie son lint et son build, télécharge Keycloak 26.8.0 depuis sa publication officielle si nécessaire, importe le realm et démarre les composants. Il attend que chaque composant réponde avant de poursuivre. Le premier lancement nécessite Internet. Les processus tournent en arrière-plan et leurs journaux se trouvent dans `.runtime`.

Ouvrir **http://localhost:5180**. La connexion redirige vers Keycloak.
Compte de démonstration : **admin@orthophoniste.local**, mot de passe initial **ChangeMe-Admin-123!**. Keycloak impose de changer ce mot de passe à la première connexion.
Ces identifiants et les secrets de clients fournis sont réservés au développement local.
Console Keycloak : http://localhost:8180, compte technique local `admin` / `admin`.

Après une compilation réussie, redémarrer plus rapidement :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -SkipBuild
```

Arrêter les processus démarrés par le script :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\stop.ps1
```

Pour compiler uniquement :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Les scripts ne modifient pas la stratégie PowerShell globale. `build.ps1` utilise les certificats Windows pour Maven, utile lorsque le JDK ne connaît pas le certificat du proxy HTTPS de la machine.

## Archive exécutable

L'archive `releases/orthophoniste-platform-1.0.0.zip` contient les sources, les six JAR et le frontend compilé. Extraire l'archive, puis lancer `launch-release.cmd` avec Java 21, Node.js 24 et MongoDB disponibles. Le premier lancement installe les paquets frontend et télécharge Keycloak ; il ne recompile pas les JAR. Les limites de vérification sont dans RAPPORT_ANALYSE.md.

Pour régénérer l'archive : `powershell -ExecutionPolicy Bypass -File .\package.ps1`.

## Configuration

Les valeurs par défaut suffisent au développement local. Pour les personnaliser, copier `.env.example` en `.env`. `start.ps1` charge ce fichier ; `spring-boot:run` lancé directement dans IntelliJ ne le charge pas automatiquement.
L'authentification utilise uniquement Keycloak. Les anciens `JWT_SECRET` et `INTERNAL_JWT_SECRET` ne sont plus requis.
Twilio est désactivé par défaut : une demande d'envoi retourne un statut d'échec explicite sans contacter Twilio. Pour l'activer, renseigner ses quatre paramètres et `TWILIO_ENABLED=true`.

| Composant | Port |
|---|---:|
| Keycloak | 8180 |
| Eureka | 8761 |
| Gateway | 8888 |
| Auth | 8081 |
| Rendez-vous | 8082 |
| Suivi | 8083 |
| Notification | 8084 |
| React/Vite | 5180 |

Le frontend relaie toutes les requêtes `/api` vers la gateway. Les bases MongoDB par défaut sont `auth_db`, `rdv_db` et `suivi_db`.
Keycloak stocke ses données locales dans `.tools/keycloak-26.8.0/data`. Un realm déjà existant n'est pas écrasé au redémarrage. Si un ancien realm existe, appliquer les comptes de service décrits dans `keycloak/realm-export.json` via la console d'administration avant d'utiliser les nouvelles fonctions.

## IntelliJ IDEA

Pour lancer uniquement le backend (MongoDB doit être démarré), sans installer Node.js ni compiler le frontend :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\run-all-backend-services.ps1 -ReuseRunningServices
```

Ce lancement compile et teste les six services, démarre Keycloak avec le realm fourni, puis les services manquants. Avec `-ReuseRunningServices`, les services déjà lancés dans IntelliJ sont réutilisés après vérification de leur état `UP`. Ils ne sont pas arrêtés par `stop.ps1`. Sans cette option, un port déjà occupé est signalé avant le lancement. Ajouter `-SkipBuild` seulement si les JAR sont déjà à jour. Une session gérée existante doit être arrêtée avec `stop.ps1` avant un nouveau lancement.

Vérifier les services, le routage RDV/Suivi et les comptes techniques Keycloak :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\check-backend.ps1
```

Ce contrôle n'enregistre aucun rendez-vous et n'envoie aucune notification. Il vérifie aussi le rejet des jetons absents ou invalides et la validation du rôle `ROLE_SERVICE` pour les notifications.

Après la migration vers Keycloak, les anciens fichiers `JwtAuthFilter.class`, `JwtService.class` et `UserDetailsServiceImpl.class` peuvent rester dans les répertoires de compilation d'IntelliJ. Les compilations Maven les nettoient désormais dès la phase `initialize`. Si une ancienne sortie IntelliJ est encore utilisée, recharger le projet Maven racine et effectuer **Build > Rebuild Project** avant de relancer. Keycloak (8180) et Eureka (8761) doivent rester démarrés pour que l'authentification et les appels entre services fonctionnent.

Ouvrir le `pom.xml` racine comme projet Maven, puis recharger tous les projets Maven. Choisir le JDK 21 pour le projet et pour Maven Runner. Les six modules héritent du même parent. La version d'IntelliJ n'impose pas les versions Spring ou React.
Utiliser les scripts racine pour lancer toute la plateforme ; on peut aussi lancer les classes `*Application` après avoir démarré MongoDB et Keycloak.

## Docker

Lorsque Docker Desktop est démarré :

```powershell
docker compose config --quiet
docker compose up --build -d
```

Ouvrir http://localhost:8080. Voir `DEPLOYMENT.md` pour les limites du mode de développement et les adaptations avant un déploiement.
