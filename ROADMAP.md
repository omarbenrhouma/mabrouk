# Roadmap produit

## État actuel

Le frontend possède deux expériences connectées à PostgreSQL. L'administrateur suit les indicateurs réseau et dispose de formulaires opérationnels pour créer boutiques, vendeurs et shifts. Le backend expose les CRUD boutiques/employés/shifts, affectations temporaires, corrections de présence, pauses, demandes et notifications. Le vendeur consulte sa journée et son planning, pointe, consulte son historique et crée une demande. Les décisions et pointages sensibles génèrent un audit.

## Lot 1 — MVP exploitable

- Refresh token sécurisé et révocation de session.
- Écrans d’édition et de désactivation pour compléter les formulaires de création déjà connectés.
- Édition visuelle des shifts existants par glisser-déposer.
- Interface de correction manuelle justifiée des présences.
- Périmètre strict des responsables par boutique.
- Audit automatique de toutes les mutations restantes.
- Tests d'intégration avec une base PostgreSQL isolée.

Critère de sortie : un responsable peut créer une boutique et un vendeur, l'affecter, publier un shift sans conflit, puis le vendeur peut le consulter et pointer.

## Lot 2 — Exploitation magasin

- Demandes d'absence, remplacement et changement de shift.
- Validation à deux niveaux configurable.
- Détection des heures supplémentaires et repos minimal.
- Tableau des anomalies du jour.
- Import CSV des boutiques et employés avec rapport d'erreurs.
- Exports CSV/Excel et rapports imprimables.
- Notifications email.

## Lot 3 — Industrialisation

- Tests end-to-end des parcours critiques.
- CI : lint, tests, build, audit des dépendances et migrations.
- Observabilité et alertes.
- Sauvegardes, restauration, rétention et plan de reprise.
- Analyse RGPD : minimisation, durée de conservation, droit d'accès.
- Test de charge, audit de sécurité et pilote sur une boutique.

## Règles métier à préciser avec l'enseigne

- Durée minimale de repos entre deux shifts.
- Maximum hebdomadaire par type de contrat.
- Tolérance de retard et règles d'arrondi.
- Autorisation du pointage hors boutique et éventuelle géolocalisation.
- Processus de correction et responsables habilités.
- Jours fériés, pauses, heures de nuit et heures supplémentaires en Tunisie.
- Politique d'échange de shifts entre vendeurs.

Ces règles doivent devenir des paramètres, pas des constantes dispersées dans le code.
