# Déploiement

Ce projet se déploie le plus simplement avec :

- une base PostgreSQL managée ;
- l’API Node/Express sur Render ;
- le frontend Vite sur Vercel, Cloudflare Pages ou Netlify.

## 1. Base de données

Créer une base PostgreSQL managée, puis récupérer son `DATABASE_URL`.

Exemples de fournisseurs adaptés :

- Neon ;
- Supabase ;
- PostgreSQL managé sur Render.

Les données de démo peuvent être déployées avec :

```powershell
npm --workspace backend run db:deploy
npm --workspace backend run db:seed
```

`db:seed` est utile au premier déploiement pour initialiser un environnement de démo.

## 2. API

Déployer le backend avec la configuration suivante :

- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL=...`
- `JWT_SECRET=...`
- `CORS_ORIGIN=https://ton-frontend.vercel.app`
- `LOG_LEVEL=info`

Le fichier [`render.yaml`](./render.yaml) contient déjà le squelette Render.

Ordre recommandé :

1. créer le service backend ;
2. brancher la base PostgreSQL ;
3. exécuter les migrations ;
4. vérifier `/health` ;
5. relever l’URL publique de l’API.

## 3. Frontend

Déployer le frontend statique sur Vercel, Cloudflare Pages ou Netlify.

Variables à définir dans l’hébergeur :

- `VITE_API_URL=https://ton-api.onrender.com`

Le front appelle ensuite l’API via cette URL en production. En local, il reste compatible avec le proxy Vite.

## 4. Vérification

Après déploiement :

1. ouvrir l’URL du frontend ;
2. se connecter avec un compte de test ;
3. vérifier que les appels réseau visent bien l’URL publique de l’API ;
4. ouvrir `https://ton-api.../health` pour confirmer l’état du backend.

## 5. Réseau local

En local, pour tester depuis un autre appareil sur le même Wi-Fi :

- lancer `npm run dev:backend`
- lancer `npm run dev:frontend`
- ouvrir `http://IP_DU_PC:5180`

Si l’accès fonctionne mais que la connexion est refusée, mettre l’IP locale exacte dans `backend/.env` via `CORS_ORIGIN`.
