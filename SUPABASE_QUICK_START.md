# ⚡ Guide Rapide: Supabase en 5 Minutes

Vous êtes pressé ? Suivez ce guide express pour configurer Supabase sur votre projet LABORATOIRE.

---

## 📋 Checklist Rapide

### ✅ Avant tout : Créer un projet Supabase
- [ ] Allez sur https://supabase.com/dashboard
- [ ] Cliquez "New Project"
- [ ] Remplissez: Nom, Password, Region
- [ ] Attendez 2-3 minutes (le projet se crée)

### ✅ Récupérer les Credentials
- [ ] Allez dans **"Settings"** → **"API"**
- [ ] Copiez ces 3 valeurs:
  1. **Project URL:** `https://[PROJECT_ID].supabase.co`
  2. **Service Role Key:** `eyJhbGciOiJI...` (secret !)
  3. **Anon Key:** `eyJhbGciOiJI...`

### ✅ Créer les Tables
- [ ] Allez dans **"SQL Editor"** → "New Query"
- [ ] Copiez-collez votre `server/migrations/create_tables.sql`
- [ ] Cliquez "RUN"
- [ ] ✅ Tables créées !

### ✅ Configurer sur Render
1. Allez sur https://render.com/dashboard
2. Sélectionnez votre **Web Service** (backend)
3. Cliquez **"Environment"**
4. Ajoutez (clé = valeur):
   ```
   SUPABASE_URL = https://[PROJECT_ID].supabase.co
   SUPABASE_KEY = eyJhbGciOiJI...
   SUPABASE_SECRET_KEY = eyJhbGciOiJI...
   ```
5. Cliquez **"Save"**
6. ✅ Redéploiement auto !

---

## 🧪 Tester en 30 Secondes

### 1️⃣ Vérifier les Logs sur Render
```
Render Dashboard → Web Service → Logs
↓
Scroll down et cherchez: "Database connected" ou "Supabase initialized"
```

### 2️⃣ Tester l'API
```
GET https://laboratoire-backend.onrender.com/api/health

Résultat attendu:
{
  "status": "ok",
  "uptime": 12.34
}
```

### 3️⃣ ✅ Bravo ! Supabase fonctionne !

---

## 🔍 Structure Finale

```
┌─────────────────────────────────────┐
│  Frontend (Render Static Site)      │
│  https://laboratoire-...            │
└──────────────┬──────────────────────┘
               │
               ↓ (API calls)
┌─────────────────────────────────────┐
│  Backend (Render Web Service)       │
│  https://laboratoire-backend...     │
└──────────────┬──────────────────────┘
               │
               ↓ (PostgreSQL)
┌─────────────────────────────────────┐
│  Supabase PostgreSQL                │
│  db.supabase.co:6543                │
└─────────────────────────────────────┘
```

---

## ⏱️ Timeline

| Étape | Durée |
|-------|-------|
| Créer projet Supabase | 2-3 min ⏳ |
| Copier credentials | 1 min |
| Créer tables | 1 min |
| Configurer Render | 2 min |
| Redéploiement | 2-5 min ⏳ |
| Tests | 1 min |
| **TOTAL** | **~10 minutes** |

---

## 🎯 Résultat Attendu

Après configuration :
- ✅ Votre backend utilise Supabase
- ✅ Les données persistent en production
- ✅ pgAdmin local toujours dispo pour dev
- ✅ Aucune modification de code nécessaire !

---

## 📘 Besoin de Plus de Détails ?

Consultez les guides complets:
- [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md) — Guide détaillé
- [CONFIG_DATABASE_STRATEGY.md](./CONFIG_DATABASE_STRATEGY.md) — Architecture BD

---

## ⚠️ Points Critiques

| Problème | Solution |
|----------|----------|
| Variables pas reconnues | Attendez 1-2 min après saving sur Render |
| "Cannot connect to database" | Vérifiez que le port est 6543 (pas 5432) |
| Ancien backend encore en marche | Rendez attend le déploiement (2-5 min) |
| Données disparues | Vérifiez que tables existent dans Supabase |

---

## 🚀 Prochaines Étapes

```
✅ Supabase configuré
  ↓
✅ Tester les endpoints API
  ↓
✅ Valider dans le navigateur
  ↓
✅ Monitorer les logs
```

**Vous êtes prêt ! 🎉**

---

## 📞 SOS Rapide

```
1. Erreur au démarrage ?
   → Vérifiez Render Logs

2. Connexion BD refusée ?
   → Vérifiez SUPABASE_SECRET_KEY sur Render

3. Données manquantes ?
   → Vérifiez que tables existent dans Supabase SQL Editor

4. Rien ne fonctionne ?
   → Lisez SUPABASE_PRODUCTION_SETUP.md (guide complet)
```

---

**Besoin d'aide ? Contactez moi ou consultez la documentation Supabase : https://supabase.com/docs**
