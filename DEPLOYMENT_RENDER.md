# 🚀 Guide de Déploiement Render

## Étape 1 : Préparer votre Repository GitHub

```bash
# 1. Initialisez git (si pas déjà fait)
git init
git add .
git commit -m "Initial commit - ready for deployment"

# 2. Créez un repo sur GitHub
# Allez sur https://github.com/new
# Nommez-le "laboratoire" (ou ce que vous voulez)

# 3. Connectez votre repo local à GitHub
git remote add origin https://github.com/simonkrom/laboratoiree.git
git branch -M main
git push -u origin main
```

---

## Étape 2 : Déployer le Backend sur Render

### A. Créer le service Backend

1. Allez sur https://render.com
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repository GitHub
4. **Remplissez les paramètres :**
   - **Name:** `laboratoire-backend`
   - **Branch:** `main`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Instance Type:** Free (gratuit)

### B. Ajouter les variables d'environnement

Cliquez sur **"Environment"** et ajoutez :

```
JWT_SECRET = <votre-jwt-secret>
SUPABASE_URL = <votre-supabase-url>
SUPABASE_KEY = <votre-supabase-key>
SUPABASE_SECRET_KEY = <votre-supabase-secret>
DATABASE_URL = <votre-database-url-optionnel>
```

5. Cliquez sur **"Deploy"** ✅

**L'URL du backend sera :** `https://laboratoire-backend.onrender.com`

---

## Étape 3 : Déployer le Frontend sur Render

### A. Créer le service Frontend

1. Allez sur https://render.com
2. Cliquez sur **"New +"** → **"Static Site"**
3. Connectez votre repository GitHub
4. **Remplissez les paramètres :**
   - **Name:** `laboratoire-frontend`
   - **Branch:** `main`
   - **Publish Directory:** `./` (racine du projet)
   - **Build Command:** (laisser vide, c'est du HTML statique)

5. Cliquez sur **"Deploy"** ✅

**L'URL du frontend sera :** `https://laboratoire-frontend.onrender.com`

---

## Étape 4 : Configurer CORS (Important !)

Allez dans `server/src/index.js` et modifiez CORS pour production :

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://laboratoire-frontend.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

Puis commitez et poussez :
```bash
git add server/src/index.js
git commit -m "Update CORS for production"
git push
```

---

## Étape 5 : Vérifier le déploiement

✅ **Frontend :** https://laboratoire-frontend.onrender.com
✅ **Backend (API Health)** : https://laboratoire-backend.onrender.com/api/health
✅ **Socket.IO** : Auto-connecté

---

## Troubleshooting

### ❌ "Cannot GET /"
→ C'est normal pour le backend, c'est une API REST

### ❌ Erreur 503 Service Unavailable
→ Attendez 2-3 minutes, Render lance le service

### ❌ Socket.IO ne se connecte pas
→ Vérifiez que `CORS` est configuré correctement

### ❌ Erreur Supabase
→ Vérifiez vos clés dans l'onglet **Environment** de Render

---

## 📌 Résumé URLs Production

```
Frontend:  https://laboratoire-frontend.onrender.com
Backend:   https://laboratoire-backend.onrender.com
API:       https://laboratoire-backend.onrender.com/api
Socket.IO: https://laboratoire-backend.onrender.com (via Socket.IO)
```

---

**Prêt ? Commencez par l'Étape 1 ! 🚀**
