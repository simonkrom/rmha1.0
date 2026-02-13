# 🚀 Configuration Supabase pour la Production

Ce guide vous aide à configurer Supabase comme base de données principale pour votre application LABORATOIRE en production.

---

## 📋 Table des Matières
1. Créer un projet Supabase
2. Récupérer les clés API
3. Configurer la base de données
4. Migrer vos données de PostgreSQL local vers Supabase
5. Configurer les variables d'environnement sur Render
6. Tester la connexion
7. Déployer en production

---

## Étape 1️⃣ : Créer un Projet Supabase

### A. Accédez à Supabase
1. Allez sur https://supabase.com
2. Cliquez sur **"Sign Up"** ou connectez-vous si vous avez un compte
3. Cliquez sur **"New Project"** (ou "Create a new project")

### B. Remplissez les détails du projet
- **Project Name:** `laboratoire-prod` (ou ce que vous voulez)
- **Database Password:** Générez un mot de passe fort ⚠️
  - Cliquez sur l'icône refresh pour générer
  - Sauvegardez-le quelque part de sûr
- **Region:** Choisissez la plus proche de vos utilisateurs (ex: `eu-west-1` pour Europe)
- Cliquez sur **"Create new project"**

⏳ Attendez 2-3 minutes que le projet soit créé.

---

## Étape 2️⃣ : Récupérer les Clés API

### A. Accédez aux Paramètres du Projet
1. Une fois créé, allez dans **"Project Settings"** (icône engrenage en haut à droite)
2. Cliquez sur **"API"** dans la barre latérale gauche

### B. Copiez vos clés
Vous verrez trois sections:

```
Project URL:
  https://[PROJECT_ID].supabase.co

API Key (anon):
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Service Role Key (secret):
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Sauvegardez ces trois valeurs:**
```
SUPABASE_URL = https://[PROJECT_ID].supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
SUPABASE_SECRET_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service role key)
```

⚠️ **Important:** Ne partagez JAMAIS la `Service Role Key` — gardez-la secrète !

---

## Étape 3️⃣ : Configurer la Base de Données

### A. Accédez à l'Éditeur SQL
1. Dans la console Supabase, cliquez sur **"SQL Editor"** (gauche)
2. Cliquez sur **"New Query"**

### B. Créez les tables
Copiez-collez le contenu de votre fichier `server/migrations/create_tables.sql` dans l'éditeur SQL et exécutez la requête.

**Alternative:** Si vous préférez l'interface graphique:
1. Cliquez sur **"Table Editor"** (gauche)
2. Cliquez sur **"Create a new table"**
3. Créez les deux tables:
   - `users` (avec colonnes: id, username, password_hash, role, created_at)
   - `audit` (avec colonnes: id, action, resource, meta, created_at)
   - `patients` (avec colonnes: id, nom, prenom, date_naissance, etc.)

---

## Étape 4️⃣ : Migrer vos Données (Optionnel)

Si vous avez déjà des données dans votre PostgreSQL local, vous pouvez les exporter vers Supabase.

### A. Exporter depuis PostgreSQL local
```powershell
# Dumper les données de votre BD locale
pg_dump -h localhost -U lab_user -d laboratoire > backup.sql
# (saisir le mot de passe quand demandé)
```

### B. Importer dans Supabase
1. Allez dans **"SQL Editor"** de Supabase
2. Cliquez sur **"New Query"**
3. Collez le contenu de `backup.sql`
4. Cliquez sur **"RUN"**

---

## Étape 5️⃣ : Configurer les Variables d'Environnement sur Render

### A. Allez sur Render Dashboard
1. Connectez-vous à https://render.com
2. Sélectionnez votre **Web Service** (backend)

### B. Ajoutez les variables
1. Cliquez sur **"Environment"** (onglet)
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez les trois variables:

```
Name: SUPABASE_URL
Value: https://[PROJECT_ID].supabase.co

Name: SUPABASE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)

Name: SUPABASE_SECRET_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service role key)
```

4. Cliquez sur **"Save Changes"**

### C. Redéploiement automatique
Render redéploiera automatiquement votre backend avec les nouvelles variables.

---

## Étape 6️⃣ : Tester la Connexion

### A. Test Local
```powershell
cd server

# Mettez à jour votre .env local avec les clés Supabase
# (ou laissez DATABASE_URL pour utiliser PostgreSQL local)

npm start
```

Vérifiez les logs:
```
✅ Supabase clients initialized
Supabase host: [PROJECT_ID].supabase.co
```

### B. Test sur Render
1. Allez sur votre Web Service Render
2. Cliquez sur **"Logs"**
3. Attendez le redéploiement
4. Vérifiez que le backend démarre sans erreurs

### C. Tester l'API
```
GET https://laboratoire-backend.onrender.com/api/health
```

Vous devriez voir:
```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-02-13T..."
}
```

---

## Étape 7️⃣ : Déployer en Production

### A. Vérifiez votre configuration
Checklist finale:
- [ ] Projet Supabase créé et fonctionnel
- [ ] Clés Supabase sauvegardées dans un endroit sûr
- [ ] Tables créées dans Supabase
- [ ] Variables d'environnement configurées sur Render
- [ ] Backend redéployé sur Render
- [ ] Tests API réussis

### B. Mettez à jour CORS (Important!)
Dans votre backend (`server/src/index.js`), assurez-vous que vos URLs frontales sont autorisées:

```javascript
const allowedOrigins = [
  'http://localhost:4000',               // local dev
  'https://laboratoire-frontend.onrender.com',  // production frontend
];
```

### C. Vérifiez les Logs de Production
```powershell
# Via Render dashboard
1. Web Service → Logs
2. Scroll down
3. Vérifiez qu'il n'y a pas d'erreurs de connexion Supabase
```

---

## 🔄 Architecture de Production

```
Frontend (Render Static Site)
    ↓
https://laboratoire-frontend.onrender.com
    ↓
Backend (Render Web Service)
    ↓
https://laboratoire-backend.onrender.com/api
    ↓
Supabase PostgreSQL
    ↓
https://[PROJECT_ID].supabase.co
```

---

## 🛡️ Considérations de Sécurité

### ✅ À faire
- Changez régulièrement les mots de passe administrateur Supabase
- Utilisez `SUPABASE_SECRET_KEY` uniquement côté serveur
- Activez "Row Level Security" (RLS) pour les tables sensibles
- Sauvegardez régulièrement vos données (Supabase le fait automatiquement)

### ❌ À ne pas faire
- Ne mettez jamais `SUPABASE_SECRET_KEY` dans le frontend
- Ne committez pas `.env` dans Git
- N'exposez pas vos clés dans les logs publics

---

## 📞 Dépannage

### Problème: "SUPABASE_URL not set"
**Solution:** Vérifiez que les variables d'environnement sont bien configurées sur Render:
```powershell
# Render Dashboard → Environment
# Vérifiez que SUPABASE_URL, SUPABASE_KEY, SUPABASE_SECRET_KEY sont présentes
```

### Problème: Connexion Supabase refusée
**Solution:** Vérifiez les clés API:
1. Supabase Dashboard → API Settings
2. Vérifiez que les clés n'ont pas expiré/changé
3. Mettez à jour sur Render si nécessaire

### Problème: Les migrations ne s'exécutent pas
**Solution:** Exécutez manuellement via Supabase SQL Editor:
1. Supabase Dashboard → SQL Editor
2. Copiez-collez `server/migrations/create_tables.sql`
3. Cliquez sur "RUN"

### Problème: Données perdues après migration
**Solution:** Avant de migrer:
```powershell
# Créez une sauvegarde locale
pg_dump -h localhost -U lab_user -d laboratoire > backup_before_migration.sql
```

---

## 📚 Ressources Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Authentification Supabase](https://supabase.com/docs/guides/auth)
- [Base de données PostgreSQL](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Prochaines Étapes
1. ✅ Configuration Supabase terminée
2. Tests en production (voir Étape 6)
3. Monitoring et alertes (optionnel)
4. Configuration des sauvegardes automatiques
5. Optimisation des performances

Besoin d'aide ? Consultez la [documentation Render](https://render.com/docs) ou contactez le support Supabase.
