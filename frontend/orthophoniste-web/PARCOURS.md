# Parcours du cabinet

## Administration

- `/admin` : rendez-vous du jour, demandes à confirmer, séances à venir et accès rapides.
- `/admin/agenda` : recherche, filtres de statut et de dates, vues liste et calendrier. Les rendez-vous et séances restent deux événements distincts. Les périodes d'indisponibilité sont visibles et leur gestion reste accessible depuis l'agenda.
- `/admin/patients` : répertoire, recherche par nom/e-mail/téléphone et filtre avec/sans bilan.
- `/admin/comptes-patients` : création du compte, copie des accès temporaires et ouverture directe du dossier créé.
- `/admin/patients/:patientId` : dossier avec les rubriques Résumé, Bilan, Séances et Rendez-vous. Les rubriques sont accessibles par `?onglet=resume`, `bilan`, `seances` ou `rendez-vous`.
- `/admin/bilans` : recherche des suivis et ouverture du bilan dans le dossier.
- `/admin/statistics` : semaine, mois, historique et période personnalisée. Un graphique en anneau et son tableau présentent les statuts des rendez-vous. Un histogramme compare rendez-vous et séances par jour, mois ou année ; un tableau paginé en fournit les chiffres et les totaux de toute la période. Les séances disposent d'un graphique et d'un tableau par état. La période utilise la date confirmée du rendez-vous, sinon la date souhaitée. Les séances utilisent leur date planifiée. Le nombre de patients avec bilan représente la situation actuelle, indépendamment de la période. Les graphiques sont chargés à l'ouverture de cette page.

## Espace patient

- `/dashboard` : prochain rendez-vous confirmé, demandes en attente, séances à venir, objectifs, note du cabinet et export PDF.
- `/mes-rendez-vous` : dates confirmées, demande initiale si elle a changé, statuts et annulation avec confirmation.
- `/rendez-vous` : trois étapes, coordonnées préremplies pour le patient connecté, récapitulatif et statut « En attente de confirmation » après envoi.

Les formulaires administrateur avertissent avant de quitter une saisie non enregistrée. Les erreurs de chargement conservent leur bouton Réessayer, et les pages distinguent un échec de chargement d'une liste vide.

## Données et démarrage

Le suivi-service expose désormais `GET /api/suivi/admin/seances`, réservé aux administrateurs, pour l'agenda et le tableau de bord. Redémarrer ce service après recompilation. Les compteurs de séances sont calculés côté serveur à partir des séances enregistrées, y compris à l'enregistrement d'un bilan.

Le frontend utilise les API existantes pour les patients, bilans et rendez-vous. Les recherches et statistiques sont calculées sur les listes retournées ; une pagination côté serveur sera une évolution distincte si le volume augmente. Les rendez-vous d'un dossier sont associés à l'e-mail du compte patient, selon le modèle actuel du backend.

Dans ce répertoire :

```powershell
npm.cmd install
npm.cmd run dev
```

Adresse de développement : `http://localhost:5180`. Les API passent par la gateway sur le port 8888.

## Vérifications

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:loading
npm.cmd run test:workflow
npm.cmd run test:ui
npm.cmd run test:statistics
```

Les tests UI utilisent une simulation DOM et des données fictives, sans appels aux comptes ou données réels. Ils vérifient les parcours et les interactions ; ils ne remplacent pas une inspection visuelle sur ordinateur et mobile.

À vérifier visuellement : menu mobile, calendrier avec une journée chargée, fenêtres de confirmation, barre d'enregistrement du bilan, dossier avec de longues notes et récapitulatif de demande.
