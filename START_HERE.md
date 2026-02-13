# 🎯 START HERE - Configurez Supabase en 5 Minutes

**Vous avez 5 minutes ?** Suivez ceci.  
**Vous avez besoin de plus de détails ?** Allez après à [SUPABASE_GUIDES_INDEX.md](./SUPABASE_GUIDES_INDEX.md)

---

## 5️⃣ Étapes Supers Rapides

### 1. Créez un projet Supabase (2 min)
```
Allez à: https://supabase.com/dashboard
Cliquez: "New Project"
Remplissez: Nom, Password (généré), Region
Attendez: 2-3 minutes (ça charge)
```

### 2. Récupérez vos Clés (1 min)
```
Supabase Dashboard → Settings (⚙️) → API
Copiez:
  • PROJECT_URL = https://xxx.supabase.co
  • SERVICE_ROLE_KEY = eyJhbGciOi...
  • ANON_KEY = eyJhbGciOi...
```

### 3. Créez les tables (30 sec)
```
Supabase → SQL Editor → New Query
Copiez-collez: server/migrations/create_tables.sql
Cliquez: RUN
```

### 4. Ajoutez les variables sur Render (1 min)
```
render.com Dashboard → Web Service (backend)
Cliquez: Environment (onglet)
Ajoutez ces 4 variables:
  DATABASE_URL = postgresql://postgres:...@db.supabase.co:6543/postgres
  SUPABASE_URL = https://xxx.supabase.co
  SUPABASE_KEY = eyJhbGciOi...
  SUPABASE_SECRET_KEY = eyJhbGciOi...
Cliquez: Save
```

### 5. Testez (30 sec)
```
Attendez 2-3 min (redéploiement)
GET https://[votre-backend].onrender.com/api/health
Résultat: { "status": "ok" } ✅
```

---

## ✅ C'EST BON?

- ✅ Supabase configuré
- ✅ Backend redéployé
- ✅ API fonctionne
- ✅ Vous êtes EN PRODUCTION ! 🎉

---

## 🆘 Sinon...

**Erreur?** → Lisez [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md)  
**Veut comprendre?** → Lisez [SUPABASE_GUIDES_INDEX.md](./SUPABASE_GUIDES_INDEX.md)  
**Veut tous les détails?** → Lisez [SUPABASE_PRODUCTION_SETUP.md](./SUPABASE_PRODUCTION_SETUP.md)

---

**Allez-y ! ⚡**
