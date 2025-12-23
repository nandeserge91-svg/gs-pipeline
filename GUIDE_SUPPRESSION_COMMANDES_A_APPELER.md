# 🗑️ GUIDE - SUPPRESSION DES COMMANDES "À APPELER"

---

## 🎯 **OBJECTIF**

Supprimer **toutes les commandes** avec le statut :
- ✅ **NOUVELLE**
- ✅ **A_APPELER**

⚠️ **ATTENTION** : Cette action est **IRRÉVERSIBLE** !

---

## 🚀 **MÉTHODE 1 : VIA SCRIPT (RAPIDE - 3 MIN)**

### **Étape 1 : Configurer vos identifiants**

Ouvrez le fichier `appeler_suppression_commandes.js` et modifiez les lignes 8-9 :

```javascript
const ADMIN_EMAIL = 'admin@afgestion.com'; // Votre email admin
const ADMIN_PASSWORD = 'votre_mot_de_passe'; // Votre mot de passe admin
```

### **Étape 2 : Attendre le redéploiement Railway**

Railway doit redéployer le backend (2-3 minutes après le push).

**Vérifier sur** : https://railway.app
- **Projet** : `afgestion` ou `gs-pipeline`
- **Service** : `gs-pipeline`
- **Onglet** : `Deployments`
- **Statut** : Attendez `✅ Success`

### **Étape 3 : Exécuter le script**

```bash
cd "C:\Users\MSI\Desktop\GS cursor"
node appeler_suppression_commandes.js
```

### **Résultat attendu** :

```
🔐 Connexion en tant qu'admin...

✅ Connexion réussie !

🗑️  Suppression des commandes "À appeler"...

═══════════════════════════════════════════════════
✅ 15 commande(s) supprimée(s) avec succès.

📊 Nombre de commandes supprimées : 15

📋 Références supprimées :

   1. ORD-20241213-001
   2. ORD-20241213-002
   3. ORD-20241213-003
   ...

═══════════════════════════════════════════════════

✅ Script terminé avec succès.
```

---

## 📡 **MÉTHODE 2 : VIA API DIRECTE (AVANCÉ)**

### **Requête cURL**

```bash
# 1. Obtenir le token admin
TOKEN=$(curl -X POST https://gs-pipeline-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@afgestion.com","password":"votre_mot_de_passe"}' \
  | jq -r '.token')

# 2. Supprimer les commandes
curl -X DELETE https://gs-pipeline-production.up.railway.app/api/orders/delete-a-appeler \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### **Requête avec Postman**

1. **POST** `https://gs-pipeline-production.up.railway.app/api/auth/login`
   - Body : `{ "email": "admin@afgestion.com", "password": "..." }`
   - Copiez le `token`

2. **DELETE** `https://gs-pipeline-production.up.railway.app/api/orders/delete-a-appeler`
   - Header : `Authorization: Bearer VOTRE_TOKEN`

---

## 🔐 **SÉCURITÉ**

- ✅ Route accessible **uniquement par ADMIN**
- ✅ Authentification JWT obligatoire
- ✅ Logs détaillés dans Railway
- ✅ Retourne la liste des références supprimées

---

## 📊 **VÉRIFICATION APRÈS SUPPRESSION**

1. **Allez sur** : https://afgestion.net/appelant/orders
2. **Vérifiez** : Le bloc "Commandes à appeler" doit être **vide** ✅
3. **Rafraîchissez** : `Ctrl + Shift + R`

---

## 🧪 **LOGS RAILWAY**

Pour vérifier la suppression dans les logs :

1. **https://railway.app**
2. **Projet** : `afgestion` → Service `gs-pipeline`
3. **Onglet** : `Logs`
4. **Cherchez** : 
   ```
   🗑️  Demande de suppression des commandes "À appeler"...
   📊 Nombre de commandes à supprimer : X
   ✅ X commande(s) supprimée(s)
   ```

---

## ⚠️ **IMPORTANT**

### **Cette suppression ne touche PAS** :
- ❌ Les commandes **VALIDEE** (client a validé)
- ❌ Les commandes **ASSIGNEE** (assignées à un livreur)
- ❌ Les commandes **LIVREE** (déjà livrées)
- ❌ Les commandes **ANNULEE** ou **INJOIGNABLE**

### **Cette suppression supprime UNIQUEMENT** :
- ✅ Les commandes **NOUVELLE** (nouvellement reçues)
- ✅ Les commandes **A_APPELER** (en cours de traitement)

---

## 🔄 **TIMELINE DU DÉPLOIEMENT**

```
Maintenant    ✅ Code poussé vers GitHub
+30 sec      🔄 Railway détecte le push
+1-2 min     🔄 Railway build en cours
+3 min       ✅ Route API prête → EXÉCUTEZ LE SCRIPT !
```

---

## 📝 **COMMANDES RÉCAPITULATIVES**

### **Vérifier que Railway est prêt**

```bash
curl https://gs-pipeline-production.up.railway.app/
```

Réponse attendue :
```json
{
  "message": "API GS Pipeline - Back-office e-commerce",
  "version": "1.0.0",
  "status": "running"
}
```

### **Exécuter la suppression**

```bash
cd "C:\Users\MSI\Desktop\GS cursor"
node appeler_suppression_commandes.js
```

---

## 🎉 **RÉSULTAT FINAL**

Après l'exécution :
- ✅ Toutes les commandes "À appeler" sont supprimées
- ✅ Le bloc "Commandes à appeler" est vide
- ✅ Les autres commandes restent intactes
- ✅ Vous pouvez créer de nouvelles commandes de test

---

**🚀 DANS 3 MINUTES, RAILWAY SERA PRÊT ET VOUS POURREZ SUPPRIMER LES COMMANDES !**


















