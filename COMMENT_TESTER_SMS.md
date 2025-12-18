# 🚀 COMMENT TESTER LE SYSTÈME SMS - GUIDE RAPIDE

## 3 MÉTHODES AU CHOIX

---

## 🌟 MÉTHODE 1 : Interface HTML (LA PLUS FACILE)

### ✅ **RECOMMANDÉE pour débuter**

1. **Ouvrez le fichier** : `test_sms_interface.html` dans votre navigateur
2. **Obtenez votre token** :
   - Allez sur https://afgestion.net
   - Connectez-vous en tant qu'ADMIN
   - Appuyez sur **F12** (Console)
   - Tapez : `localStorage.getItem('token')`
   - Copiez le token (sans les guillemets)
3. **Collez le token** dans l'interface
4. **Cliquez sur "Charger la Configuration"**
5. **Testez l'envoi** d'un SMS avec votre numéro

### 📸 Vous verrez :
- ✅ Configuration SMS
- 💰 Vos crédits disponibles
- 📱 Formulaire d'envoi de SMS
- 📊 Statistiques en temps réel
- 📜 Historique des SMS

---

## 💻 MÉTHODE 2 : Script PowerShell

### ⚡ **Rapide et complet**

```powershell
cd "c:\Users\MSI\Desktop\GS cursor"
.\test_sms_api.ps1
```

Le script vous demandera :
1. Votre token admin
2. Si vous voulez envoyer un SMS test
3. Votre numéro de téléphone

### 📋 Tests effectués :
- Configuration SMS
- Crédits disponibles
- Templates SMS
- Historique
- Statistiques
- Envoi de SMS test

---

## 🧪 MÉTHODE 3 : Console Navigateur (DevTools)

### 🎯 **Pour les développeurs**

1. Ouvrez **https://afgestion.net**
2. Connectez-vous en tant qu'**ADMIN**
3. Appuyez sur **F12** → **Console**

#### Test Rapide :

```javascript
// 1. Vérifier la config
fetch('https://gs-pipeline-production.up.railway.app/api/sms/config', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(console.log);

// 2. Vérifier les crédits
fetch('https://gs-pipeline-production.up.railway.app/api/sms/credits', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(console.log);

// 3. Envoyer un SMS
fetch('https://gs-pipeline-production.up.railway.app/api/sms/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    phoneNumber: '+2250712345678',  // ⬅️ VOTRE NUMÉRO
    message: 'Test SMS - Integration reussie !'
  })
}).then(r => r.json()).then(data => {
  if (data.success) {
    alert('✅ SMS envoyé ! Vérifiez votre téléphone');
  }
  console.log(data);
});
```

---

## 🛒 TEST RÉEL : Créer une Commande

### 📱 **Test End-to-End**

1. **Allez sur** : https://afgestion.net
2. **Créez une nouvelle commande** :
   - Nom : `Test SMS`
   - Téléphone : **+2250712345678** (VOTRE numéro)
   - Produit : n'importe lequel
   - Mode : **LOCAL**

3. **Vous recevrez un SMS** :
   ```
   🎉 Commande créée !
   
   Bonjour Test SMS,
   Votre commande #CMD-XXX a été enregistrée.
   Nous vous contacterons sous peu.
   
   Merci !
   - GS-Pipeline
   ```

4. **Validez la commande** (en tant qu'APPELANT)
   → Vous recevez un SMS de validation

5. **Assignez un livreur** (en tant qu'GESTIONNAIRE)
   → Vous recevez un SMS d'assignation

6. **Marquez comme livré** (en tant qu'LIVREUR)
   → Vous recevez un SMS de confirmation

---

## ⚙️ AVANT DE TESTER : Configuration Railway

### 🔧 Variables à ajouter sur Railway

1. **Allez sur** : https://railway.app/
2. **Projet** : afgestion → **gs-pipeline**
3. **Variables** → **Add Variable**
4. **Ajoutez** :

```env
SMS8_API_KEY=6a854258b60b92bd3a87ee563ac8a375ed28a78f
SMS8_API_URL=https://app.sms8.io/services/sendFront.php
SMS_SENDER_NAME=GS-Pipeline
SMS_ENABLED=true
SMS_ORDER_CREATED=true
SMS_ORDER_VALIDATED=true
SMS_DELIVERY_ASSIGNED=true
SMS_ORDER_DELIVERED=true
SMS_EXPEDITION_CONFIRMED=true
SMS_EXPRESS_ARRIVED=true
SMS_EXPRESS_REMINDER=true
SMS_RDV_SCHEDULED=true
SMS_RDV_REMINDER=true
SMS_DELIVERER_ALERT=true
```

5. **Sauvegardez** → Railway redéploie (1-2 minutes)

---

## 📊 VÉRIFIER LES RÉSULTATS

### Dans la Console (F12) :

```javascript
// Voir l'historique
fetch('https://gs-pipeline-production.up.railway.app/api/sms/history?limit=10', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(data => console.table(data.logs));

// Voir les stats
fetch('https://gs-pipeline-production.up.railway.app/api/sms/stats?days=7', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(console.log);
```

---

## ❌ PROBLÈMES FRÉQUENTS

### ❌ Pas de SMS reçu

**Solution 1** : Vérifiez le format du numéro
```
✅ BON : +2250712345678
❌ MAUVAIS : 0712345678
❌ MAUVAIS : +225712345678 (manque le 0)
```

**Solution 2** : Vérifiez que SMS est activé
```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/config', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(data => {
  if (!data.enabled) {
    console.error('❌ SMS désactivé ! Ajoutez SMS_ENABLED=true sur Railway');
  }
});
```

### ❌ Erreur 401 Unauthorized

**Solution** : Votre token est invalide ou expiré
1. Reconnectez-vous sur afgestion.net
2. Récupérez un nouveau token
3. Réessayez

### ❌ Erreur 500

**Solution** : Consultez les logs Railway
1. Railway Dashboard → Deployments → View Logs
2. Cherchez les erreurs `[SMS]`

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide complet** : `GUIDE_TEST_SMS.md`
- **Configuration** : `ENV_SMS_CONFIG.md`
- **Référence système** : `RappelAF.md` (section SMS)

---

## 🎉 CHECKLIST DE TEST

- [ ] Configuration SMS récupérée
- [ ] Crédits vérifiés
- [ ] SMS de test envoyé et reçu
- [ ] Commande test créée → SMS reçu
- [ ] Commande validée → SMS reçu
- [ ] Livreur assigné → SMS reçu
- [ ] Commande livrée → SMS reçu
- [ ] Historique consulté
- [ ] Statistiques affichées

---

## 🚀 COMMENCEZ PAR :

1. **Ouvrez** `test_sms_interface.html` dans votre navigateur
2. **Ou exécutez** `.\test_sms_api.ps1` dans PowerShell
3. **C'est tout !** 🎊

**Le système est déployé et opérationnel sur Railway !** ✅
