# ⚙️ Configuration Render avec Supabase

**Date:** 13 février 2026  
**Projet Supabase:** cuqvvmnkkckutabgxrmd

---

## 🚨 SÉCURITÉ CRITIQUE

⚠️ **Les clés Supabase ont été partagées publiquement !**

### Actions IMMÉDIATES:
1. **Allez sur Supabase:** https://supabase.com/dashboard
2. **Sélectionnez votre projet**
3. **Settings** → **API** → **Regenerate Keys**
4. **Copiez les NOUVELLES clés**
5. **Remplacez sur Render** avec les NEW clés
6. **Commit JAMAIS .env** avec les vraies clés

---

## ✅ Variables à Configurer sur Render

### A. Allez sur Render Dashboard
```
https://render.com/dashboard → Web Service (laboratoire-backend)
```

### B. Cliquez "Environment" (onglet)

### C. Ajoutez/Modifiez ces Variables

```
Clé: DATABASE_URL
Valeur: postgresql://postgres:[PASSWORD]@db.supabase.co:6543/postgres?schema=public
Note: Remplacez [PASSWORD] par le mot de passe Supabase

Clé: SUPABASE_URL
Valeur: https://cuqvvmnkkckutabgxrmd.supabase.co

Clé: SUPABASE_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZ2bW5ra2NydXRhYmd4cm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Nzk5NzUsImV4cCI6MjA4NjU1NTk3NX0.dlNift1VVFXUPEqdEejS1bEcklhcrlLIDr-CRVGjuOE

Clé: SUPABASE_SECRET_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZ2bW5ra2NrdXRhYmd4cm1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk3OTk3NSwiZXhwIjoyMDg2NTU1OTc1fQ.haO0Dc0xZt_dFuUGwhOjuhzVs-AdCEj6R_ayflKtN18

Clé: JWT_SECRET
Valeur: [Votre JWT Secret, par exemple: super-secret-key-change-in-production-12345]
```

### D. Cliquez "Save Changes"

Render redéploiera automatiquement ⏳ (2-5 minutes)

---

## 🧪 Tester Après Configuration

### 1. Attendre le Redéploiement
- Allez dans **"Logs"** (onglet)
- Attendez que le déploiement finisse
- Cherchez: `Database connected` ou pas d'erreurs

### 2. Tester l'API
```
GET https://[votre-backend].onrender.com/api/health

Réponse attendue:
{
  "status": "ok",
  "uptime": 123.45
}
```

### 3. Tester depuis le Frontend
- Allez sur https://laboratoire-frontend.onrender.com
- Essayez de vous connecter
- ✅ Devrait fonctionner !

---

## ✅ Checklist Finale

- [ ] Nouvelles clés régénérées dans Supabase
- [ ] Toutes les 4 variables ajoutées sur Render
- [ ] "Save Changes" cliqué
- [ ] Redéploiement terminé (5 min max)
- [ ] Logs Render montrent "Database connected"
- [ ] API /api/health répond ✅
- [ ] Frontend se connecte correctement ✅

---

## 🔗 Informations du Projet

```
API URL: https://cuqvvmnkkckutabgxrmd.supabase.co
Project ID: cuqvvmnkkckutabgxrmd
Database: PostgreSQL (Supabase managed)
Region: Default (voir Dashboard)
```

---

## 📝 Notes Locales

Fichier créé: `server/.env.local`
- Contient les credentials pour dev local
- ⚠️ NE PAS COMMITTER ce fichier !
- Ajoutez à `.gitignore` si pas déjà fait

---

## 🆘 Si Erreurs

### "Cannot connect to database"
→ Vérifiez que `DATABASE_URL` est correct avec le bon password

### "SUPABASE_SECRET_KEY missing"
→ Vérifiez que la clé est bien ajoutée sur Render

### Ancien backend encore à l'écran
→ Attendez 5-10 minutes, videz le cache, réactualisez F5

---

**Prochaines étapes:**
1. ✅ Régénérer les clés (URGENT!)
2. ✅ Configurer Render
3. ✅ Tester
4. ✅ Déployer en production
