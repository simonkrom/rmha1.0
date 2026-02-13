# 🔄 Configuration: PostgreSQL Local vs Supabase

Ce guide explique comment switcher entre votre PostgreSQL local (développement) et Supabase (production).

---

## 🎯 Architecture Actuelle

Votre application utilise un **pool PostgreSQL unique** (`server/src/db.js`) qui se connecte via la variable `DATABASE_URL`.

```javascript
const CONNECTION = process.env.DATABASE_URL;
const pool = CONNECTION ? new Pool({ connectionString: CONNECTION }) : null;
```

**Cela signifie:** Juste en changeant `DATABASE_URL`, vous pouvez switcher entre les deux BD sans modifier le code !

---

## 💻 Développement Local (PostgreSQL Docker)

### Configuration `.env`
```dotenv
DATABASE_URL=postgres://lab_user:lab_pass@localhost:5432/laboratoire
JWT_SECRET=dev-secret-12345
PORT=4000
```

### Lancer le projet
```powershell
cd server
docker-compose up          # Démarre PostgreSQL + pgAdmin + votre app
npm start                  # Ou laissez docker-compose le faire

# Accédez à:
# - App: http://localhost:4000
# - pgAdmin: http://localhost:5050
# - PostgreSQL: localhost:5432
```

---

## 🚀 Production (Supabase)

### Configuration `.env` (sur Render)
Au lieu de `DATABASE_URL` classique, utilisez Supabase PostgreSQL directement :

```dotenv
# Récupérez cette URL depuis Supabase Dashboard → Project Settings → Database
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.supabase.co:6543/postgres?schema=public

JWT_SECRET=your-strong-jwt-secret-here
PORT=4000
```

📌 **Où trouver votre URL Supabase:**
1. Allez sur https://supabase.com → Dashboard
2. Sélectionnez votre projet
3. Cliquez sur **"Project Settings"** (engrenage)
4. Cliquez sur **"Database"** (gauche)
5. Scroll down jusqu'à **"Connection string"**
6. Cliquez sur **URI** (onglet)
7. Copiez l'URL complète

---

## 🔄 Comment Switcher

### Option 1: Configuration d'Environnement (Recommandé)

**Local (`server/.env`):**
```dotenv
DATABASE_URL=postgres://lab_user:lab_pass@localhost:5432/laboratoire
```

**Production (Render Environment Variables):**
- Ajoutez juste une nouvelle variable `DATABASE_URL` avec l'URL Supabase
- Render utilisera celle-ci au lieu de celle locale

✅ **Aucun changement de code nécessaire !**

### Option 2: Fichier d'Environnement Separate (Alternatif)

```powershell
# Créer .env.production
echo "DATABASE_URL=postgresql://postgres:...@db.supabase.co:6543/postgres" > server/.env.production

# Lancer avec le bon env
NODE_ENV=production npm start
```

Puis dans `src/index.js`:
```javascript
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' 
});
```

---

## 📋 Checklist: Migration vers Supabase

- [ ] **Supabase Project créé** (voir SUPABASE_PRODUCTION_SETUP.md)
- [ ] **Tables créées** dans Supabase (users, audit, patients)
- [ ] **Données migrées** (optionnel, voir guide principal)
- [ ] **URL Supabase copiées:**
  - `DATABASE_URL` = PostgreSQL connection string
  - `SUPABASE_URL` = Project URL (pour le client JS)
  - `SUPABASE_SECRET_KEY` = Service Role Key
- [ ] **Variables ajoutées sur Render** (Dashboard → Environment)
- [ ] **Backend redéployé** (Render fera auto-deploy)
- [ ] **Tests réussis:**
  ```bash
  GET https://laboratoire-backend.onrender.com/api/health
  ```

---

## 🔍 Vérifier la Connexion BD

### Local
```bash
cd server
npm start

# Les logs doivent montrer:
# ✅ Supabase host: [notaire sur stderr si Supabase, rien si PostgreSQL local]
# ou
# ✅ Database connected successfully
```

### Production (Render)
1. Dashboard Render → Votre Web Service
2. Cliquez sur **"Logs"** (onglet)
3. Cherchez les logs au démarrage:
   ```
   Database connection established
   ```
   ou
   ```
   Connected to Supabase
   ```

---

## 🛡️ Sécurité

### ✅ À faire
- Utilisez `DATABASE_URL` avec mot de passe fort
- Changez le mot de passe Supabase régulièrement
- Limitez les accès via IP (Supabase → Database → Firewall)

### ❌ À ne pas faire
- Ne committez JAMAIS `.env` avec les vrais mots de passe
- N'utilisez pas le même mot de passe pour dev et prod
- N'exposez pas vos URLs de BD dans les logs publics

---

## ⚠️ Pièges Courants

### Problème: "Cannot connect to database"
**Causes possibles:**
1. URL Supabase incorrecte → Vérifiez dans Project Settings
2. Port fermé → Par défaut Supabase utilise le port 6543 (pas 5432)
3. Firewall bloque → Vérifiez avec Supabase support

**Solution:**
```bash
# Testez la connexion localement
psql postgresql://postgres:[PASSWORD]@db.supabase.co:6543/postgres -c "SELECT 1"
```

### Problème: "Connection refused on localhost:5432"
**Cause:** PostgreSQL local n'est pas lancé

**Solution:**
```powershell
# Vérifiez que Docker est en marche
docker-compose up -d db

# Ou lancez le docker-compose complet
docker-compose up
```

### Problème: Migrations ne s'exécutent pas
**Cause:** Les tables existent déjà (ou schéma différent)

**Solution:**
1. Vérifiez via Supabase SQL Editor que les tables existent
2. Si besoin, créez-les manuellement via le SQL Editor

---

## 🚀 Prochaines Étapes

1. ✅ Comprenez comment switcher entre local et Supabase
2. Configurez Supabase (voir SUPABASE_PRODUCTION_SETUP.md)
3. Testez localement d'abord
4. Déployez sur Render
5. Testez en production

---

## 📚 Format URL Supabase vs PostgreSQL Local

Ils utilisent le même protocole PostgreSQL, donc c'est transparent :

```
Local:
  postgres://lab_user:lab_pass@localhost:5432/laboratoire

Supabase:
  postgresql://postgres:password@db.supabase.co:6543/postgres?schema=public
```

⚠️ **Remarque:** Supabase ajoute `?schema=public` — c'est normal !

---

## 💡 Conseil Pro: Dual Database Setup

Pour la sécurité, vous pouvez avoir:
- **Database 1 (Principale):** Supabase (production)
- **Database 2 (Sauvegarde):** PostgreSQL local ou autre Supabase project

Configuration `.env` pour double sauvegarde:
```dotenv
DATABASE_URL=postgresql://...@db.supabase.co  # Principal
BACKUP_DATABASE_URL=postgresql://...          # Optionnel, pour exports réguliers
```

Mais pour votre cas, une seule BD (Supabase) suffit !

