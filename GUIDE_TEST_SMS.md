# 🧪 GUIDE COMPLET - TEST DU SYSTÈME SMS8.io

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Méthode 1 : Test Rapide via Script](#méthode-1--test-rapide-via-script)
3. [Méthode 2 : Test API direct](#méthode-2--test-api-direct)
4. [Méthode 3 : Test via Interface (Console DevTools)](#méthode-3--test-via-interface-console-devtools)
5. [Méthode 4 : Test avec Commande Réelle](#méthode-4--test-avec-commande-réelle)
6. [Vérification des Résultats](#vérification-des-résultats)
7. [Troubleshooting](#troubleshooting)

---

## ✅ PRÉREQUIS

### 1. Vérifier que Railway est UP
```
✅ API : https://gs-pipeline-production.up.railway.app/
✅ Status : 200 OK
```

### 2. Configurer les Variables SMS sur Railway

1. **Aller sur** : https://railway.app/
2. **Sélectionner** le projet **afgestion**
3. **Variables** → **Add Variable**
4. **Ajouter** :

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

5. **Sauvegarder** → Railway va redéployer (1-2 minutes)

---

## 🚀 MÉTHODE 1 : Test Rapide via Script

### Étape 1 : Créer un script de test

Le script `test_sms.js` existe déjà dans votre projet !

### Étape 2 : Modifier le numéro de téléphone

Ouvrez `test_sms.js` et changez le numéro :

```javascript
// Ligne ~50
const testPhone = '+2250712345678';  // ⬅️ METTEZ VOTRE NUMÉRO ICI
```

### Étape 3 : Exécuter le test

```powershell
cd "c:\Users\MSI\Desktop\GS cursor"
node test_sms.js
```

### ✅ Résultat Attendu

```
🧪 === TEST SERVICE SMS8.io ===

📋 Test 1 : Vérification des crédits...
✅ Crédits disponibles : 1234
💰 Taux : 15 FCFA/SMS

📱 Test 2 : Envoi SMS simple...
✅ SMS envoyé avec succès !
   ID: sms_xxx
   Phone: +2250712345678

📨 Test 3 : Envoi SMS avec template...
✅ SMS envoyé avec succès !
   Template: orderCreated

🎉 === TOUS LES TESTS RÉUSSIS ===
```

---

## 📡 MÉTHODE 2 : Test API Direct

### Test avec PowerShell

#### Test 1 : Vérifier la Configuration SMS

```powershell
# IMPORTANT : Remplacez YOUR_ADMIN_TOKEN par votre vrai token
$token = "YOUR_ADMIN_TOKEN"

$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "https://gs-pipeline-production.up.railway.app/api/sms/config" -Headers $headers
```

**Résultat attendu :**
```json
{
  "enabled": true,
  "provider": "SMS8.io",
  "apiKey": "6a8542***", 
  "senderName": "GS-Pipeline",
  "features": {
    "ORDER_CREATED": true,
    "EXPRESS_ARRIVED": true,
    ...
  }
}
```

#### Test 2 : Vérifier les Crédits

```powershell
Invoke-RestMethod -Uri "https://gs-pipeline-production.up.railway.app/api/sms/credits" -Headers $headers
```

**Résultat attendu :**
```json
{
  "success": true,
  "credits": 1234,
  "rate": 15,
  "currency": "FCFA"
}
```

#### Test 3 : Envoyer un SMS de Test

```powershell
$body = @{
    phoneNumber = "+2250712345678"  # ⬅️ VOTRE NUMÉRO
    message = "Test SMS GS-Pipeline - Systeme operationnel !"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://gs-pipeline-production.up.railway.app/api/sms/test" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "SMS de test envoyé avec succès",
  "smsId": "sms_xxx",
  "phoneNumber": "+2250712345678",
  "creditsUsed": 1
}
```

---

## 🌐 MÉTHODE 3 : Test via Interface (Console DevTools)

### Étape 1 : Se Connecter à l'Interface

1. Ouvrez **https://afgestion.net** dans votre navigateur
2. Connectez-vous avec un compte **ADMIN**
3. Appuyez sur **F12** pour ouvrir la console DevTools

### Étape 2 : Récupérer le Token

```javascript
// Dans la console
const token = localStorage.getItem('token');
console.log('Token:', token);
```

### Étape 3 : Tester les Endpoints SMS

#### Test 1 : Configuration SMS

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/config', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Configuration SMS:', data);
});
```

#### Test 2 : Vérifier les Crédits

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/credits', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('💰 Crédits SMS:', data);
});
```

#### Test 3 : Envoyer un SMS de Test

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    phoneNumber: '+2250712345678',  // ⬅️ VOTRE NUMÉRO
    message: 'Test SMS depuis la console - Integration reussie !'
  })
})
.then(r => r.json())
.then(data => {
  console.log('📱 SMS envoyé:', data);
  if (data.success) {
    alert('✅ SMS envoyé avec succès ! Vérifiez votre téléphone.');
  }
});
```

#### Test 4 : Voir l'Historique des SMS

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/history?limit=10', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.table(data.logs);
});
```

#### Test 5 : Statistiques SMS

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/stats?days=7', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 Statistiques SMS:', data);
});
```

#### Test 6 : Voir les Templates Disponibles

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/templates', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('📝 Templates SMS:', data);
  data.templates.forEach(t => {
    console.log(`\n${t.type}:\n${t.preview}`);
  });
});
```

---

## 🛒 MÉTHODE 4 : Test avec Commande Réelle

### Scénario Complet de Test

#### Étape 1 : Créer une Commande de Test

1. **Aller sur** : https://afgestion.net
2. **Menu** → **Commandes**
3. **Créer une nouvelle commande** avec :
   - Nom client : `Test SMS`
   - Téléphone : **VOTRE NUMÉRO** (format : +2250712345678)
   - Produit : n'importe quel produit
   - Mode : **LOCAL** (pour tester le workflow complet)

#### Étape 2 : Vérifier l'Envoi SMS

📱 **Vous devriez recevoir :**
```
🎉 Commande créée !

Bonjour Test SMS,
Votre commande #CMD-XXX a été enregistrée.
Nous vous contacterons sous peu.

Merci !
- GS-Pipeline
```

#### Étape 3 : Valider la Commande (APPELANT)

1. **Connectez-vous** en tant qu'**APPELANT**
2. **Ouvrez** la commande
3. **Validez** la commande

📱 **Vous devriez recevoir :**
```
✅ Commande validée !

Bonjour Test SMS,
Votre commande de [Produit] d'un montant de XXX FCFA a été validée.
Livraison en cours de préparation.

- GS-Pipeline
```

#### Étape 4 : Assigner un Livreur (GESTIONNAIRE)

1. **Connectez-vous** en tant qu'**GESTIONNAIRE**
2. **Tournées** → **Créer une tournée**
3. **Assignez** la commande à un livreur

📱 **Vous devriez recevoir :**
```
🚚 Livreur assigné !

Bonjour Test SMS,
Votre commande #CMD-XXX a été assignée au livreur [Nom].
Il vous contactera prochainement.

- GS-Pipeline
```

#### Étape 5 : Marquer comme Livré (LIVREUR)

1. **Connectez-vous** en tant qu'**LIVREUR**
2. **Livraisons** → **Marquer comme livré**

📱 **Vous devriez recevoir :**
```
✅ Commande livrée !

Bonjour Test SMS,
Votre commande #CMD-XXX a été livrée avec succès.
Merci de votre confiance !

- GS-Pipeline
```

---

## 🧪 TEST WORKFLOW EXPRESS

### Étape 1 : Créer une Commande EXPRESS

1. **Formulaire client** ou **Interface admin**
2. **Mode** : **EXPRESS**
3. **Téléphone** : VOTRE NUMÉRO

#### Étape 2 : Confirmer l'Arrivée à l'Agence

1. **Livreur** confirme l'arrivée (code + photo)

📱 **Vous devriez recevoir :**
```
📦 Colis arrivé à l'agence !

Bonjour [Client],
Votre colis EXPRESS est arrivé à l'agence.
Code de retrait : ABC123
Montant à payer : 10% de XXX FCFA = YYY FCFA

Passez récupérer votre colis.
- GS-Pipeline
```

---

## 🧪 TEST RDV

### Étape 1 : Programmer un RDV

1. **APPELANT** programme un RDV pour une commande
2. **Date** : dans 2 jours
3. **Heure** : 14h00

📱 **Client reçoit :**
```
📅 Rendez-vous programmé !

Bonjour [Client],
Un rendez-vous a été programmé pour votre commande #CMD-XXX.
Date : 20/12/2025
Heure : 14h00

Nous vous rappellerons.
- GS-Pipeline
```

### Étape 2 : Rappel Automatique (Cron Job)

⏰ **24h avant le RDV, le client reçoit :**
```
⏰ Rappel RDV demain !

Bonjour [Client],
Rappel : RDV demain pour votre commande #CMD-XXX.
Date : 20/12/2025
Heure : 14h00

À demain !
- GS-Pipeline
```

---

## 🔍 VÉRIFICATION DES RÉSULTATS

### 1. Vérifier dans la Base de Données

```javascript
// Console DevTools sur afgestion.net
fetch('https://gs-pipeline-production.up.railway.app/api/sms/history?limit=20', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.table(data.logs.map(log => ({
    Date: new Date(log.sentAt).toLocaleString(),
    Type: log.type,
    Phone: log.phoneNumber,
    Status: log.status,
    Credits: log.credits
  })));
});
```

### 2. Vérifier les Statistiques

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/stats?days=7', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 Statistiques 7 derniers jours:');
  console.log('Total envoyés:', data.totalSent);
  console.log('Réussis:', data.successful);
  console.log('Échoués:', data.failed);
  console.log('En attente:', data.pending);
  console.log('Crédits utilisés:', data.creditsUsed);
  console.log('Par type:', data.byType);
});
```

### 3. Vérifier les Crédits Restants

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/credits', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log(`💰 Crédits : ${data.credits} (${data.credits * data.rate} FCFA)`);
});
```

---

## ❌ TROUBLESHOOTING

### Problème 1 : Pas de SMS Reçu

#### Solution A : Vérifier les Variables d'Environnement

```javascript
fetch('https://gs-pipeline-production.up.railway.app/api/sms/config', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Configuration SMS:', data);
  if (!data.enabled) {
    console.error('❌ SMS désactivé ! Activez SMS_ENABLED=true sur Railway');
  }
});
```

#### Solution B : Vérifier le Format du Numéro

```
❌ MAUVAIS : 0712345678
❌ MAUVAIS : 712345678
❌ MAUVAIS : +225712345678 (manque le 0)
✅ BON : +2250712345678
```

#### Solution C : Vérifier les Logs Railway

1. **Railway Dashboard** → **Deployments** → **View Logs**
2. Cherchez : `[SMS]` ou `error`

### Problème 2 : Erreur 401 Unauthorized

```javascript
// Vérifier que vous êtes bien connecté
if (!localStorage.getItem('token')) {
  console.error('❌ Pas de token ! Connectez-vous d\'abord.');
}

// Vérifier votre rôle
fetch('https://gs-pipeline-production.up.railway.app/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Votre rôle:', data.role);
  if (data.role !== 'ADMIN') {
    console.warn('⚠️ Certains endpoints SMS nécessitent le rôle ADMIN');
  }
});
```

### Problème 3 : Erreur 500 ou API Down

```powershell
# Vérifier que Railway est UP
curl https://gs-pipeline-production.up.railway.app/

# Si 502 Bad Gateway → Attendre 1-2 minutes (redémarrage)
# Si 500 → Consulter les logs Railway
```

### Problème 4 : SMS Envoyé mais Status = FAILED

```javascript
// Vérifier l'historique des erreurs
fetch('https://gs-pipeline-production.up.railway.app/api/sms/history?status=FAILED&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  data.logs.forEach(log => {
    console.error('❌ SMS échoué:', {
      phone: log.phoneNumber,
      error: log.errorMessage,
      providerId: log.providerId
    });
  });
});
```

**Causes possibles :**
- Crédits SMS insuffisants
- Numéro invalide
- API SMS8.io down
- Clé API invalide

---

## 📊 CHECKLIST DE TEST COMPLÈTE

### Tests de Base
- [ ] Configuration SMS récupérée (`/api/sms/config`)
- [ ] Crédits vérifiés (`/api/sms/credits`)
- [ ] Templates listés (`/api/sms/templates`)
- [ ] SMS de test envoyé (`/api/sms/test`)

### Tests Automatiques
- [ ] SMS envoyé à la création de commande
- [ ] SMS envoyé à la validation de commande
- [ ] SMS envoyé à l'assignation du livreur
- [ ] SMS envoyé à la livraison

### Tests EXPRESS
- [ ] SMS envoyé à l'arrivée à l'agence
- [ ] Code de retrait inclus dans le SMS
- [ ] Montant à payer correct

### Tests RDV
- [ ] SMS envoyé lors de la programmation
- [ ] Rappel automatique 24h avant

### Tests Monitoring
- [ ] Historique SMS accessible
- [ ] Statistiques affichées
- [ ] Filtres fonctionnels

---

## 🎉 CONCLUSION

Vous avez maintenant **6 méthodes** différentes pour tester votre système SMS !

### Recommandation

1. **Commencez par** : Méthode 3 (Console DevTools) → rapide et visuel
2. **Ensuite** : Méthode 4 (Commande réelle) → test end-to-end
3. **Pour débugger** : Méthode 1 (Script) → logs détaillés

---

## 📞 SUPPORT

Si vous rencontrez un problème :

1. Vérifiez les variables Railway
2. Consultez les logs Railway
3. Testez avec `/api/sms/test`
4. Vérifiez l'historique des SMS (`/api/sms/history`)

**Le système est opérationnel sur Railway !** ✅
