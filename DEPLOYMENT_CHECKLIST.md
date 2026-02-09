# ✅ Checklist de Déploiement - Render

Suivez cette checklist avant de déployer :

## 1️⃣ **Préparation Git**
- [ ] Repository GitHub créé et connecté
- [ ] Fichier `.env` est dans `.gitignore` ✅
- [ ] `git push` effectué vers `main`

## 2️⃣ **Sécurité**
- [ ] JWT_SECRET généré et configuré ✅ (voir .env)
- [ ] Clés Supabase sécurisées ✅
- [ ] CORS configuré pour production ✅

## 3️⃣ **Backend (Node.js + Socket.IO)**
- [ ] Créer service Web sur Render
- [ ] Ajouter variables d'environnement
- [ ] Vérifier build command: `cd server && npm install`
- [ ] Vérifier start command: `cd server && npm start`
- [ ] URL backend générée: `https://laboratoire-backend.onrender.com`

## 4️⃣ **Frontend (HTML/CSS/JS Statique)**
- [ ] Créer service Static Site sur Render
- [ ] Publish Directory: `./` (racine)
- [ ] URL frontend générée: `https://laboratoire-frontend.onrender.com`

## 5️⃣ **Post-Déploiement**
- [ ] Tester l'API: https://laboratoire-backend.onrender.com/api/health
- [ ] Tester Socket.IO de la page coursier
- [ ] Vérifier connexions utilisateurs
- [ ] Tester temps réel (commandes, localisation)

---

## 📋 Variables d'environnement à ajouter sur Render

```
JWT_SECRET=<votre-jwt-secret>
SUPABASE_URL=<votre-supabase-url>
SUPABASE_KEY=<votre-supabase-key>
SUPABASE_SECRET_KEY=<votre-supabase-secret>
```

---

## 🚀 URLs Finales

```
Frontend:   https://laboratoire-frontend.onrender.com
Backend:    https://laboratoire-backend.onrender.com
API:        https://laboratoire-backend.onrender.com/api
```

---

Consultez [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md) pour le guide complet.
