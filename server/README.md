# LABORATOIRE Backend

Minimal Node.js backend providing:
- Password hashing with `bcrypt` (SALT_ROUNDS=12)
- JWT-based authentication
- Role-based permissions (middleware)
- Immutable audit log (SQLite `audit` table with triggers preventing UPDATE/DELETE)

Quick start

1. From `server/` install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and edit `JWT_SECRET` and `DATABASE_URL` if needed.

3a. To run locally against a Postgres instance, apply migrations then start:

```bash
npm run migrate
npm start
```

3b. To run with Docker (recommended for production-like environment):

```bash
docker compose up --build
```


Tests

- Run tests locally (requires Node.js / npm):

```powershell
cd e:\LABORATOIRE\server
npm ci
npm test
```

- Run tests in a Node container (no local Node required):

  - Windows PowerShell (use absolute path):

```powershell
docker run --rm -v "e:\LABORATOIRE\server":/usr/src/app -w /usr/src/app node:20-alpine sh -lc "npm ci && npm test"
```

  - Unix (macOS / Linux / Git Bash):

```bash
docker run --rm -v "${PWD}:/usr/src/app" -w /usr/src/app node:20-alpine sh -lc "npm ci && npm test"
```

- Apply migrations locally:

```powershell
cd e:\LABORATOIRE\server
npm run migrate
```

- Apply migrations inside a container (no local Node required):

```powershell
docker run --rm -v "e:\LABORATOIRE\server":/usr/src/app -w /usr/src/app node:20-alpine sh -lc "node scripts/migrate.js"
```

Serve frontend with the backend

The server can also host the static frontend so you can deploy a single app. After starting the server (`npm start`) the frontend will be available at `http://localhost:4000/index.html` and Socket.IO + API calls will work from the same origin.

To run the full app locally:

```powershell
cd e:\LABORATOIRE\server
npm ci
npm start
# then open http://localhost:4000/index.html in your browser
```

Optional: Use Supabase as your database (server-side)

1) Create a Supabase project at https://app.supabase.com and create a table named `patients` with columns matching the local schema (snake_case):
   - id (bigint/serial), first_name text, last_name text, phone text, address text, city text, services jsonb, created_at timestamptz default now()

2) In `server/.env` set:
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

3) The server will detect these env vars and automatically use Supabase for `POST /api/patients`. Keep the Service Role key secret.

4) You can migrate existing data using `pg_dump`/`psql` or Supabase import tools.

5) Run the server:
```powershell
npm ci
npm start
```

Notes: For direct frontend writes you can use `SUPABASE_ANON_KEY` in the browser, but prefer server writes with Service Role key to keep control and auditability.

Endpoints

- `POST /api/register` { username, password, role? }
- `POST /api/login` { username, password } -> returns `token`
- `GET /api/profile` Authorization: Bearer <token>
- `GET /api/admin/users` admin only
- `POST /api/admin/seed-admin` creates an initial admin (remove or protect in production)

Audit

Audit entries are inserted into the SQLite `audit` table and cannot be updated/deleted because of DB triggers.

Notes

- Change `JWT_SECRET` before production.
- Secure the `seed-admin` endpoint or remove it once an admin exists.

CI / CD

 - Ce dépôt contient un workflow GitHub Actions (`.github/workflows/ci.yml`) qui :
	 - installe les dépendances (`npm ci`) pour le dossier `server`,
	 - construit l'image Docker à partir de `server/Dockerfile`,
	 - pousse l'image vers GitHub Container Registry sous `ghcr.io/<owner>/laboratoire-backend`.

 - Pour que le workflow fonctionne automatiquement il suffit de pousser sur la branche `main`.

 - Secrets / permissions :
	 - Le workflow utilise `GITHUB_TOKEN` (fourni automatiquement) pour publier vers GHCR.

 - Déploiement :
	 - Le workflow ne déploie pas automatiquement sur un serveur final. Pour ajouter un déploiement automatisé, on peut étendre le workflow pour :
		 - déployer via SSH (exiger `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER` dans les secrets),
		 - ou pousser l'image vers un registre et lancer un déploiement GitOps.

Voir `.github/workflows/ci.yml` pour les détails.
