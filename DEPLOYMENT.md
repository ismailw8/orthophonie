# Exécution avec Docker

Le fichier Compose fourni lance une installation de développement : Keycloak en `start-dev`, MongoDB et les six services, puis Nginx/React sur http://localhost:8080. Docker Desktop doit être démarré.

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --tail 100 api-gateway auth-service rdv-service keycloak
```

Les constructions backend utilisent le POM racine et les modules Maven. Keycloak et MongoDB conservent leurs données dans des volumes. Ne pas supprimer ces volumes pour résoudre un problème de version.
Le frontend utilise Node.js 24 pendant sa compilation. Nginx relaie `/api` vers la gateway.
Le compte applicatif initial est décrit dans README.md. Les secrets du realm importé et les identifiants de démonstration sont réservés au développement. Modifier un secret de client exige la même modification dans Keycloak et dans l'environnement du service correspondant.

## Avant un déploiement public

Adapter l'URL publique Keycloak, l'issuer attendu par les services, les URL de redirection et webOrigins du client, ainsi que VITE_KEYCLOAK_URL au moment du build frontend. Configurer ALLOWED_ORIGINS pour l'origine publique. Utiliser TLS, une base persistante adaptée à Keycloak et son mode `start` de production. Le Compose actuel n'est pas une configuration de production.
Les variables locales de `.env.example` servent au lancement Windows ; ne pas les recopier dans un `.env` Compose sans adapter les URL au réseau des conteneurs.
Configurer Twilio uniquement si l'envoi est nécessaire. Prévoir des sauvegardes des trois bases MongoDB et de la base Keycloak.

## Tests

`build.ps1` exécute les tests et les builds. La CI utilise Java 21 et Node.js 24. Les profils de test désactivent l'inscription Eureka des clients et la création des index MongoDB ; le registre Eureka conserve sa configuration nécessaire à son démarrage.