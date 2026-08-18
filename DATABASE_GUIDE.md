# Accéder et modifier la base PostgreSQL

## Option recommandée : Prisma Studio

Vérifier que PostgreSQL fonctionne :

```powershell
docker compose up -d db
docker compose ps
```

Depuis la racine du projet :

```powershell
npm --workspace backend run db:studio
```

Ouvrir ensuite <http://localhost:5555>. Prisma Studio permet de consulter, filtrer, créer et modifier les lignes avec leurs relations.

Tables principales :

- `User` : identité, connexion et rôle ;
- `EmployeeProfile` : contrat, poste, boutique principale et disponibilité ;
- `Store` : boutiques et responsables ;
- `Assignment` : affectations temporaires ;
- `ScheduleShift` : planning ;
- `Attendance` : pointages et anomalies ;
- `ChangeRequest` : demandes vendeur ;
- `Notification` : centre d’activité ;
- `AuditLog` : traçabilité.

Ne modifiez jamais directement `passwordHash`. Utilisez l’application ou le seed pour créer un compte avec un mot de passe correctement haché.

## Accès SQL avec `psql`

Ouvrir un terminal SQL dans le conteneur :

```powershell
docker compose exec db psql -U ayouta -d ayouta
```

Commandes utiles dans `psql` :

```sql
\dt
\d "EmployeeProfile"
SELECT id, name, email, role FROM "User" ORDER BY name;
SELECT code, name, city, "targetStaff" FROM "Store" WHERE "isActive";
SELECT status, COUNT(*) FROM "ScheduleShift" GROUP BY status;
\q
```

Exemple de modification prudente :

```sql
BEGIN;

UPDATE "Store"
SET "targetStaff" = 10
WHERE code = 'MBK-TM';

SELECT code, name, "targetStaff"
FROM "Store"
WHERE code = 'MBK-TM';

COMMIT;
```

Remplacer `COMMIT` par `ROLLBACK` si le résultat n’est pas correct.

## Régénérer les données de démonstration

Le seed est idempotent : il actualise ses propres données sans supprimer les données ajoutées manuellement.

```powershell
npm --workspace backend run db:seed
npm --workspace backend run db:verify
```

`db:verify` contrôle les volumes et refuse la validation si deux shifts actifs du même employé se chevauchent.

## Sauvegarde avant modifications importantes

```powershell
docker compose exec -T db pg_dump -U ayouta -d ayouta -Fc -f /tmp/ayouta.backup
docker compose cp db:/tmp/ayouta.backup .\ayouta.backup
```

Le fichier `ayouta.backup` contient potentiellement des données personnelles. Ne le commitez pas et conservez-le dans un emplacement protégé.

## Règles de sécurité

- Utiliser Prisma Studio uniquement en local ou derrière un tunnel sécurisé.
- Ne jamais exposer le port PostgreSQL ou Prisma Studio à Internet.
- Passer par des migrations Prisma pour modifier la structure des tables.
- Préférer l’application pour les opérations auditées : une modification SQL directe ne crée pas automatiquement d’entrée dans `AuditLog`.
- Sauvegarder avant une mise à jour massive.

## Test depuis un téléphone sur le réseau local

L’adresse utilisée dans Safari doit être explicitement autorisée dans `backend/.env` :

```env
CORS_ORIGIN=http://localhost:5180,http://127.0.0.1:5180,http://192.168.1.105:5180
```

Après toute modification de cette ligne, redémarrer le backend. Si l’adresse IPv4 du PC change, remplacer `192.168.1.105` par la nouvelle valeur donnée par `ipconfig`.

Si la page s’ouvre mais que la connexion échoue depuis un autre appareil du réseau, le plus probable est :

- le frontend n’est pas lancé avec `npm run dev:frontend` ;
- le backend n’est pas lancé avec `npm run dev:backend` ;
- le pare-feu Windows bloque le port `5180` pour le frontend ou `3000` pour l’API ;
- `CORS_ORIGIN` n’inclut pas l’origine exacte du navigateur qui charge le frontend.

Le front est maintenant configuré pour parler à une API distante via `VITE_API_URL` en production. En local, il continue de passer par le proxy Vite.
