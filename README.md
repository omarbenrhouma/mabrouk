# Mabrouk People · par Ayouta

Application full-stack de gestion des vendeurs, boutiques, affectations, plannings et présences, orientée pour l’exploitation interne de l’enseigne tunisienne Mabrouk.

## Stack

- Frontend : React 18, TypeScript, Vite.
- API : Node.js 20 LTS, Express 5, TypeScript, Zod.
- Données : PostgreSQL 16, Prisma ORM.
- Sécurité : Helmet, CORS limité, bcrypt, JWT court (15 minutes), validation d'entrée.
- Qualité : ESLint, Vitest, Supertest, TypeScript strict.
- Environnement local : Docker Compose pour PostgreSQL.

## Prérequis

- Node.js 20 LTS.
- npm 9 ou supérieur.
- Docker Desktop (recommandé) ou PostgreSQL 16 installé localement.

## Premier lancement

```bash
npm install
docker compose up -d db
```

Copier `backend/.env.example` vers `backend/.env`, puis remplacer `JWT_SECRET`.

```bash
npm --workspace backend run db:generate
npm --workspace backend run db:migrate -- --name init
npm --workspace backend run db:seed
```

Dans deux terminaux :

```bash
npm run dev:backend
npm run dev:frontend
```

- Interface locale : http://127.0.0.1:5180
- Interface sur le même réseau Wi-Fi : `http://ADRESSE_IP_DU_PC:5180`
- API : http://localhost:3000
- Santé API : http://localhost:3000/health

L'écran de connexion appelle réellement l'API et adapte entièrement l'expérience au rôle :

- administrateur : cockpit réseau, planning, équipe, présences, demandes et boutiques ;
- vendeur : journée, planning personnel, pointage, historique et demandes.

Les écrans sont alimentés par PostgreSQL. La création des boutiques, vendeurs et shifts est connectée ; le centre d’activité et la traçabilité administrateur utilisent également les services réels.

Le jeu de démonstration comprend plusieurs boutiques Mabrouk, dix profils, deux semaines de planning, des présences conformes et anormales, des demandes et des notifications. Vérification :

```bash
npm --workspace backend run db:verify
```

Comptes de démonstration (développement uniquement) :

- Administrateur : `admin@ayouta.tn`
- Employée : `vendeuse@ayouta.tn`
- Mot de passe initial : `ChangeMe123!`

Changez ces identifiants avant toute exposition réseau.

## Vérification

```bash
npm run lint
npm test
npm run build
```

Test manuel de connexion :

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ayouta.tn","password":"ChangeMe123!"}'
```

## Mise en production

La base est prête pour une livraison conteneurisée, mais les points suivants sont obligatoires avant ouverture publique :

- utiliser une base PostgreSQL managée avec sauvegardes et restauration testée ;
- injecter les secrets depuis le gestionnaire de secrets de l’hébergeur ;
- placer l’API derrière HTTPS et un reverse proxy ;
- exécuter `db:deploy` pendant le déploiement, jamais `db:migrate` ;
- supprimer ou remplacer les comptes de démonstration ;
- ajouter limitation de débit, refresh tokens rotatifs et révocation de sessions ;
- brancher supervision, traces d'erreurs et alertes ;
- définir rétention et export des journaux d'audit ;
- réaliser des tests métier et de sécurité avant mise en production.

Déploiement recommandé pour continuer rapidement :

- backend API sur Render avec [`render.yaml`](./render.yaml) ;
- base PostgreSQL managée sur Neon, Supabase ou le PostgreSQL managé de Render ;
- frontend statique sur Cloudflare Pages, Vercel ou Netlify ;
- variable frontend `VITE_API_URL` pointant vers l’URL publique de l’API ;
- variable backend `CORS_ORIGIN` contenant l’origine exacte du frontend public.

Flux concret :

1. créer la base PostgreSQL managée ;
2. renseigner `DATABASE_URL`, `JWT_SECRET` et `CORS_ORIGIN` dans l’hébergeur ;
3. déployer l’API ;
4. récupérer l’URL publique de l’API ;
5. définir `VITE_API_URL=https://...` dans le frontend ;
6. déployer le frontend.

## Organisation

- `frontend/` : interface administrateur et employé.
- `backend/src/` : API REST versionnée.
- `backend/prisma/` : schéma et données de démonstration.
- `CAHIER_DES_CHARGES.md` : spécification fonctionnelle.
- `ROADMAP.md` : priorités d'implémentation.
- `DESIGN_SYSTEM_MABROUK.md` : identité visuelle et principes UX retenus.
- `DATABASE_GUIDE.md` : accès direct, Prisma Studio, SQL, sauvegarde et règles de sécurité.
