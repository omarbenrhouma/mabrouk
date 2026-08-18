# Plateforme de gestion du personnel et des affectations boutique

## Objectif

Créer une plateforme dédiée aux administrateurs et aux employés de magasin pour gérer les affectations, les emplois du temps, les changements horaires, le suivi de présence et la traçabilité des décisions.

La plateforme doit aider à :

- Optimiser les plannings du personnel.
- Suivre les présences, absences, retards et départs anticipés.
- Gérer les affectations des employés aux boutiques.
- Historiser les changements de planning et d'affectation.
- Donner une visibilité claire aux administrateurs et aux employés.

## Utilisateurs

### Administrateur

L'administrateur peut :

- Créer et gérer les boutiques.
- Créer et gérer les employés.
- Affecter un employé à une ou plusieurs boutiques.
- Créer, modifier et valider les emplois du temps.
- Suivre la présence du personnel.
- Consulter l'historique des changements.
- Gérer les demandes de changement d'horaire ou d'absence.
- Exporter les rapports.

### Employé de magasin

L'employé peut :

- Consulter son planning.
- Voir sa boutique d'affectation.
- Pointer son arrivée et son départ.
- Demander un changement d'horaire.
- Demander une absence.
- Consulter l'état de ses demandes.
- Voir son historique de présence.

## Modules principaux

## Contraintes terrain à intégrer

- Les boutiques existent déjà dans la réalité et doivent pouvoir être importées ou saisies avant l'utilisation opérationnelle.
- Chaque boutique peut avoir ses propres horaires, sa ville, son responsable, son statut et son effectif cible.
- Un employé peut avoir une boutique principale, mais être affecté temporairement à une autre boutique.
- Les changements d'affectation doivent conserver une période de validité, un motif et l'utilisateur qui a créé le changement.
- Les plannings doivent éviter les conflits entre boutiques, surtout quand un employé remplace dans un autre point de vente.
- Le pointage réel peut différer du planning : retard, absence, départ anticipé ou correction manuelle.
- Toute correction manuelle doit être justifiée et historisée.
- Les responsables doivent pouvoir vérifier rapidement les anomalies du jour.
- L'interface administrateur doit être dense et professionnelle, proche d'un outil de pilotage.
- L'interface employé doit rester simple, utilisable rapidement sur mobile.

## Besoins fonctionnels vendeurs et shifts

### Gestion des vendeurs et vendeuses

- Créer une fiche vendeur/vendeuse.
- Identifier le type de contrat : CDI, CDD, temps partiel, saisonnier, stagiaire.
- Définir la boutique principale.
- Définir les disponibilités et contraintes horaires.
- Suivre le statut : actif, absent, suspendu, en remplacement, mobile entre boutiques.
- Voir l'historique des affectations et des changements de planning.

### Gestion des shifts par boutique

- Définir les modèles de shift par boutique : matin, journée, soir, renfort, inventaire, repos.
- Configurer les horaires possibles selon les horaires d'ouverture de chaque boutique.
- Définir le nombre minimum de vendeurs nécessaires par shift.
- Identifier les shifts couverts, incomplets ou à risque.
- Empêcher l'affectation d'un vendeur sur deux shifts incompatibles.
- Permettre les affectations temporaires entre boutiques.

### Consultation employé

- Chaque vendeur doit consulter uniquement son propre emploi du temps.
- L'employé doit voir :
  - sa boutique principale ;
  - ses affectations temporaires ;
  - ses shifts de la semaine ;
  - ses jours de repos ;
  - l'état des demandes envoyées ;
  - son historique de présence.
- L'interface employé doit être pensée mobile-first.

### Services métier à prévoir

- Service vendeurs : fiches, contrats, disponibilité, statut.
- Service boutiques : horaires, effectif cible, responsable, besoins par créneau.
- Service affectations : boutique principale, affectation temporaire, historique.
- Service planning : génération, modification, publication, conflit.
- Service shifts : modèles de créneaux par boutique, couverture, besoin minimum.
- Service présence : pointage, retard, absence, correction.
- Service demandes : changement horaire, absence, remplacement.
- Service traçabilité : audit de toutes les actions sensibles.

### 1. Authentification et rôles

- Connexion sécurisée.
- Rôles : administrateur, responsable boutique, employé.
- Gestion des permissions selon le rôle.

### 2. Gestion des boutiques

- Création d'une boutique.
- Adresse, ville, responsable, horaires d'ouverture.
- Statut actif/inactif.

### 3. Gestion des employés

- Fiche employé.
- Informations personnelles et professionnelles.
- Type de contrat.
- Statut actif/inactif.
- Boutique principale.
- Affectations secondaires éventuelles.

### 4. Affectations

- Affecter un employé à une boutique.
- Définir une période d'affectation.
- Historiser les changements.
- Empêcher les conflits d'affectation sur les mêmes créneaux.

### 5. Planning

- Création de planning par jour, semaine ou mois.
- Créneaux horaires par employé.
- Vue administrateur globale.
- Vue employé personnelle.
- Détection des conflits :
  - Employé affecté à deux boutiques au même moment.
  - Créneau hors horaires d'ouverture.
  - Dépassement d'heures autorisées.

### 6. Demandes de changement

- Demande de changement d'horaire.
- Demande d'absence.
- Motif de la demande.
- Statuts : en attente, approuvée, refusée, annulée.
- Historique de validation.

### 7. Suivi de présence

- Pointage arrivée.
- Pointage départ.
- Retards.
- Absences non justifiées.
- Comparaison entre planning prévu et présence réelle.

### 8. Traçabilité

Chaque action importante doit être historisée :

- Création ou modification d'un planning.
- Changement d'affectation.
- Validation ou refus d'une demande.
- Modification d'une fiche employé.
- Correction manuelle d'une présence.

L'historique doit contenir :

- Utilisateur ayant fait l'action.
- Date et heure.
- Type d'action.
- Ancienne valeur.
- Nouvelle valeur.
- Commentaire éventuel.

### 9. Rapports

- Heures planifiées par employé.
- Heures réellement travaillées.
- Retards et absences.
- Historique des affectations.
- Présence par boutique.
- Export Excel ou PDF.

## MVP recommandé

La première version doit rester simple et utile.

### Version 1

- Connexion administrateur/employé.
- Gestion des boutiques.
- Gestion des employés.
- Affectation employé-boutique.
- Planning hebdomadaire.
- Vue planning employé.
- Pointage arrivée/départ.
- Historique basique des modifications.

### Version 2

- Demandes de changement d'horaire.
- Demandes d'absence.
- Validation par administrateur ou responsable boutique.
- Rapports simples.

### Version 3

- Optimisation automatique des plannings.
- Notifications email/SMS/WhatsApp.
- Export avancé.
- Tableaux de bord.

## Modèle de données initial

### User

- id
- name
- email
- password_hash
- role
- is_active
- created_at
- updated_at

### Store

- id
- name
- address
- city
- opening_time
- closing_time
- manager_id
- is_active
- created_at
- updated_at

### EmployeeProfile

- id
- user_id
- phone
- contract_type
- hire_date
- primary_store_id
- is_active
- created_at
- updated_at

### Assignment

- id
- employee_id
- store_id
- start_date
- end_date
- created_by
- reason
- created_at

### ScheduleShift

- id
- employee_id
- store_id
- shift_date
- start_time
- end_time
- status
- created_by
- updated_by
- created_at
- updated_at

### Attendance

- id
- employee_id
- store_id
- shift_id
- check_in_at
- check_out_at
- status
- correction_reason
- corrected_by
- created_at
- updated_at

### ChangeRequest

- id
- employee_id
- request_type
- requested_date
- current_start_time
- current_end_time
- requested_start_time
- requested_end_time
- reason
- status
- reviewed_by
- reviewed_at
- review_comment
- created_at
- updated_at

### AuditLog

- id
- actor_id
- entity_type
- entity_id
- action
- old_value
- new_value
- comment
- created_at

## Architecture proposée

Pour démarrer rapidement avec une base moderne :

- Frontend : React + TypeScript.
- Backend : Node.js + NestJS ou Express.
- Base de données : PostgreSQL.
- ORM : Prisma.
- Authentification : JWT avec refresh token.
- UI : interface responsive web.

Alternative plus rapide pour un MVP :

- Next.js full-stack.
- PostgreSQL.
- Prisma.
- Auth.js ou JWT maison.

## Écrans prioritaires

### Administrateur

- Tableau de bord.
- Liste des boutiques.
- Liste des employés.
- Fiche employé.
- Affectations.
- Planning hebdomadaire.
- Présences.
- Historique.

### Employé

- Mon planning.
- Ma boutique.
- Pointer arrivée/départ.
- Mes demandes.
- Mon historique de présence.

## Règles métier importantes

- Un employé ne peut pas être planifié dans deux boutiques au même moment.
- Un pointage doit être lié à une boutique et idéalement à un shift.
- Toute modification manuelle de présence doit avoir un motif.
- Toute modification de planning doit être historisée.
- Une affectation peut avoir une date de fin vide si elle est toujours active.
- Les demandes approuvées doivent mettre à jour le planning ou générer une action de suivi.

## Prochaine étape technique

Choisir la stack de démarrage :

1. Next.js + Prisma + PostgreSQL pour avancer vite avec une seule application.
2. React + NestJS + PostgreSQL pour séparer proprement frontend et backend.

Recommandation : commencer avec Next.js + Prisma + PostgreSQL, puis séparer le backend plus tard seulement si le produit grandit.

---

## Complément de spécification technique et production

### Architecture retenue

Le projet conserve le frontend React/TypeScript existant et adopte une API Node.js/Express séparée. PostgreSQL 16 est la source de vérité et Prisma gère le schéma et les migrations. Cette séparation permet de faire évoluer indépendamment l’interface mobile employé, l’administration et de futurs terminaux de pointage.

### Exigences non fonctionnelles

- Disponibilité cible initiale : 99,5 % mensuel, hors maintenance planifiée.
- Temps de réponse cible : 95 % des lectures sous 500 ms hors réseau utilisateur.
- Toutes les communications de production passent par HTTPS.
- Les mots de passe sont hachés avec bcrypt et ne sont jamais journalisés.
- Les jetons d’accès expirent rapidement ; les sessions longues utiliseront des refresh tokens rotatifs et révocables.
- Les autorisations sont contrôlées côté API, jamais uniquement dans l’interface.
- Les données personnelles et journaux d’audit ont des durées de conservation documentées.
- La base est sauvegardée quotidiennement et une restauration est testée régulièrement.
- Les migrations sont versionnées, relues et exécutées automatiquement au déploiement.
- Chaque livraison passe le lint, les tests, la compilation et l’audit des dépendances.

### Critères d’acceptation du MVP

1. Un administrateur authentifié crée une boutique et un profil vendeur.
2. Il affecte le vendeur à une boutique principale ou temporaire.
3. Il crée puis publie un shift dans les heures d’ouverture.
4. L’API refuse tout chevauchement de shifts pour le même vendeur.
5. Le vendeur ne voit que son planning et ses propres demandes.
6. Le vendeur pointe son arrivée et son départ sur un shift publié.
7. Une correction de présence sans motif est refusée.
8. Chaque mutation sensible laisse une entrée d’audit non modifiable depuis l’interface.
9. Un responsable ne peut gérer que les boutiques de son périmètre.
10. Les principaux parcours sont utilisables sur mobile et clavier.

### Hors périmètre du premier MVP

- Optimisation automatique des plannings.
- Paie et calcul légal définitif des heures supplémentaires.
- Géolocalisation permanente des employés.
- Notifications WhatsApp/SMS.
- Fonctionnement hors ligne complet.
- Gestion de stock, caisse et catalogue vêtements.

### Stratégie de livraison

- Environnement local : Docker Compose et données de démonstration.
- Environnement de recette : données anonymisées, tests end-to-end et validation métier.
- Production : base managée, secrets externalisés, HTTPS, supervision et sauvegardes.
- Déploiement progressif : pilote dans une boutique, retour terrain, puis généralisation.

La feuille de route détaillée et les règles métier restant à arbitrer sont dans `ROADMAP.md`.

## Conception des expériences par rôle

### Cockpit administrateur

Le tableau de bord administrateur agrège les effectifs actifs, boutiques, shifts du jour, demandes en attente et anomalies. Il donne accès à un planning réseau, au référentiel des vendeurs, au suivi quotidien des présences, aux demandes à approuver ou refuser et à la couverture de chaque boutique.

### Espace vendeur

La page d’accueil vendeur met en avant le shift du jour et l’action de pointage. Le vendeur peut consulter ses prochains shifts, son historique de présence et envoyer une demande d’absence, de changement de shift ou de remplacement. Il n’accède jamais aux données des autres employés.

### Services API opérationnels

- `GET /api/v1/me` : identité et profil courant.
- `GET /api/v1/dashboard` : données adaptées au rôle.
- `GET /api/v1/employees` : équipe pour les rôles de gestion.
- `GET /api/v1/attendances` : présences filtrées selon le rôle.
- `POST /api/v1/attendances/check-in` et `check-out` : pointage vendeur.
- `GET|POST /api/v1/requests` : consultation et création de demandes.
- `PATCH /api/v1/requests/:id/review` : décision administrateur/responsable.

Les créations d’employés, boutiques et shifts sont connectées. Les prochaines interfaces à terminer concernent l’édition/désactivation, les affectations temporaires et les corrections de présence depuis le frontend.

### Complément issu de la référence « Rayon »

Le modèle couvre désormais le poste du jour, les pauses, l’écart de pointage, le shift concerné par une demande et un centre de notifications lu/non lu. La publication ou modification d’un shift notifie le vendeur. Une nouvelle demande notifie les décideurs et leur décision notifie le demandeur. Une demande approuvée peut annuler un shift pour absence ou appliquer les nouveaux horaires demandés.

La géolocalisation et le QR code ne sont pas activés par défaut. Leur mise en œuvre exige une décision métier sur la méthode de preuve, une analyse de proportionnalité et une politique explicite de conservation des données.
