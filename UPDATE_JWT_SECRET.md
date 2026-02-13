# 🔑 Mettre à Jour JWT_SECRET sur Render

## ✅ Ce qui a été fait

Votre `JWT_SECRET` a été mis à jour localement dans `server/.env.local`.

---

## 🚀 Ajouter à Render

### A. Allez sur Render Dashboard
```
https://render.com/dashboard → laboratoire-backend (Web Service)
```

### B. Cliquez "Environment" (onglet)

### C. Trouvez la variable `JWT_SECRET`

Si elle existe déjà:
- Cliquez le bouton **edit** (crayon)
- Remplacez la valeur par votre nouveau JWT_SECRET
- Cliquez **Save**

Si elle n'existe pas:
- Cliquez **"Add Environment Variable"**
- **Name:** `JWT_SECRET`
- **Value:** `votre-jwt-secret-change-in-production`
- Cliquez **Add Variable**

**⚠️ Important:** Utilisez le JWT_SECRET que vous avez configuré localement (voir `.env.local`)

### D. Cliquez "Save Changes" (bas de page)

⏳ **Render redéploiera (2-5 minutes)**

---

## 🧪 Vérifier

```
1. Attendez le redéploiement
2. Allez à: https://[votre-backend].onrender.com/api/health
3. Essayez de vous connecter sur le frontend
4. ✅ Devrait fonctionner
```

---

## ✅ Checklist

- [ ] JWT_SECRET ajoutée/mise à jour sur Render
- [ ] "Save Changes" cliquée
- [ ] Redéploiement terminé (5 min)
- [ ] API /api/health répond ✅
- [ ] Frontend se connecte ✅

---

## ⚠️ À Retenir

```
❌ NE PAS:
  - Partager les secrets en chat/email
  - Committer .env sur Git
  - Exposer les clés publiquement

✅ À FAIRE:
  - Garder les secrets localement (.env.local)
  - Ajouter sur Render Dashboard (pas dans le code)
  - Régénérer régulièrement
```

---

**C'est fait ! Votre JWT_SECRET est à jour. 🔐**
