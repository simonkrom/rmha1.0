# 🛡️ Guide de Sécurité Supabase + Render

## ⚠️ RÈGLES DE SÉCURITÉ ESSENTIELLES

### ❌ JAMAIS
```
- Partager des clés secrètes en chat, email, ou messages
- Committer .env dans Git/GitHub
- Mettre de vraies clés dans le code source
- Exposer SUPABASE_SECRET_KEY en frontend
- Utiliser le même secret en dev et production
```

### ✅ TOUJOURS
```
- Garder les secrets localement (.env.local)
- Ajouter les secrets sur Render Dashboard SEULEMENT
- Utiliser .gitignore pour exclure .env
- Régénérer les clés tous les 3-6 mois
- Auditer l'accès aux clés
```

---

## 📋 Vos Secrets Actuels

### Fichier Local: `server/.env.local`
```
✅ JWT_SECRET=votre-jwt-secret-ici
✅ SUPABASE_URL=https://votre-project.supabase.co
✅ SUPABASE_KEY=votre-anon-key-ici
✅ SUPABASE_SECRET_KEY=votre-service-role-key-ici
```

**Note:** Ne partagez jamais les vraies valeurs ! Ce fichier ne doit pas être commité.

**Localisation:** `c:\Users\HP\Desktop\LABORATOIRE\server\.env.local`
**Statut:** ✅ Ne sera PAS commité (.gitignore)

---

## 🚀 À Faire sur Render

### Variables à Ajouter/Mettre à Jour

```
Render Dashboard → Web Service → Environment
```

| Clé | Valeur | Source |
|-----|--------|--------|
| JWT_SECRET | votre-nouveau-secret | Changé ce jour |
| DATABASE_URL | postgresql://... | Supabase |
| SUPABASE_URL | https://cuqvvmnkkckutabgxrmd.supabase.co | Supabase |
| SUPABASE_KEY | eyJhbGciOi... (Anon Key) | Supabase |
| SUPABASE_SECRET_KEY | eyJhbGciOi... (Service Role) | Supabase |

### Steps:
1. Allez sur Render Dashboard
2. Environment (onglet)
3. Mettez à jour chaque clé
4. "Save Changes"
5. ⏳ Attendez redéploiement (5 min)

---

## 🔄 Flux de Sécurité Correct

```
Développement Local:
  ┌─────────────────────┐
  │ server/.env.local   │ ← Clés secrètes locales
  │ (jamais commité)    │
  └─────────────────────┘

         ↓ (Pas automatique!)

Production (Render):
  ┌──────────────────────┐
  │ Render Environment   │ ← Clés via dashboard
  │ (secrets sécurisés)  │
  └──────────────────────┘

         ↓

Backend:
  ┌──────────────────────┐
  │ process.env.VAR_NAME │ ← Lit depuis env
  │ (jamais hardcodé)    │
  └──────────────────────┘
```

---

## ✅ Checklist Sécurité Actuelle

- [ ] ✅ .env.local créé (local uniquement)
- [ ] ✅ .env dans .gitignore
- [ ] ✅ JWT_SECRET mis à jour
- [ ] ⏳ **À FAIRE:** Ajouter sur Render
- [ ] ⏳ **À FAIRE:** Régénérer clés Supabase dans 1 mois
- [ ] ⏳ **À FAIRE:** Auditer les accès

---

## 🔐 Clés à Retenir

### Essentielles (Production)
```
DATABASE_URL         ← Chaîne connexion PostgreSQL
JWT_SECRET          ← Secret pour les tokens JWT
SUPABASE_SECRET_KEY ← Clé admin Supabase (SECRET!)
```

### Optionnelles
```
SUPABASE_URL        ← URL du projet (publique)
SUPABASE_KEY        ← Anon key Supabase (publique)
```

---

## 📊 État Actuel

| Composant | Statut | Action |
|-----------|--------|--------|
| Local (.env.local) | ✅ Configuré | Aucune |
| Render Environment | ⏳ À faire | Ajouter clés |
| .gitignore | ✅ OK | Aucune |
| Supabase Clés | ⚠️ Partagées | À régénérer |

---

## 🆘 QA Sécurité

### Q: Les clés partagées en chat sont-elles en danger ?
**R:** Oui, potentiellement. Régénérez les clés Supabase immédiatement.

### Q: Mon JWT_SECRET peut rester le même ?
**R:** Techniquement oui, mais changez-le tous les 3-6 mois. Essentiel si compromis.

### Q: Je peux mettre les clés dans le code ?
**R:** **NON!** Toujours utiliser variables d'environnement.

### Q: .env.local sera commité ?
**R:** Non, .gitignore l'empêche.

### Q: Render a besoin des mêmes clés ?
**R:** Oui, les mêmes valeurs via Environment.

---

## 📚 Prochaines Actions

**Urgence HAUTE:**
1. [ ] Régénérer clés Supabase (Dashboard → API → Regenerate)
2. [ ] Ajouter JWT_SECRET sur Render

**Urgence MOYENNE:**
3. [ ] Auditer les accès (qui a vu les clés?)
4. [ ] Configurer monitoring

**Urgence BASSE:**
5. [ ] Mettre en place rotation de clés (tous les 3 mois)
6. [ ] Ajouter alertes Render

---

## 🚀 Architecture Finale Sécurisée

```
┌──────────────────────────────────────┐
│ Frontend (Public)                    │
│ https://laboratoire-frontend...      │
└────────────────┬─────────────────────┘
                 │ API calls
                 ↓
┌──────────────────────────────────────┐
│ Backend (Render)                     │
│ Env: JWT_SECRET, SUPABASE_SECRET_KEY │ ← Secrets sécurisés
│ https://laboratoire-backend...       │
└────────────────┬─────────────────────┘
                 │ Requêtes BD
                 ↓
┌──────────────────────────────────────┐
│ Supabase PostgreSQL                  │
│ Authentification JWT + RLS           │
│ Chiffrement SSL/TLS                  │
└──────────────────────────────────────┘
```

---

## 📞 Support

- **Besoin aide?** → Lisez UPDATE_JWT_SECRET.md
- **Erreur?** → Vérifiez Render Logs
- **Code en danger?** → Changez les clés immédiatement

---

**✅ Vous êtes maintenant sécurisé ! 🔐**

Prochaine étape: [UPDATE_JWT_SECRET.md](./UPDATE_JWT_SECRET.md)
