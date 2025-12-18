# 🚀 DÉPLOIEMENT RAPIDE - 5 MINUTES

## ⚡ GUIDE ULTRA-RAPIDE

### ÉTAPE 1 : Ouvrir Railway (30 secondes)

1. **Ouvrez** : https://railway.app/
2. **Projet** : `afgestion`
3. **Service** : `gs-pipeline`
4. **Onglet** : `Variables`

---

### ÉTAPE 2 : Ajouter les Variables (3 minutes)

#### Variable 1 : SMS8_API_URL

**Cherchez** la variable `SMS8_API_URL` et **MODIFIEZ-LA** :

```
Ancienne valeur : https://app.sms8.io/services/sendFront.php
Nouvelle valeur : https://app.sms8.io/services/send.php
```

Cliquez sur `SMS8_API_URL` → Changez `sendFront.php` en `send.php` → Sauvegardez

---

#### Variable 2 : SMS_DEVICE_ID

Cliquez sur **`New Variable`** :

```
Name:  SMS_DEVICE_ID
Value: 5298
```

Sauvegardez (Railway redéploie automatiquement)

---

#### Variable 3 : SMS_SIM_SLOT

Cliquez sur **`New Variable`** :

```
Name:  SMS_SIM_SLOT
Value: 0
```

Sauvegardez (Railway redéploie automatiquement)

---

#### Variable 4 : SMS_SENDER_NUMBER

Cliquez sur **`New Variable`** :

```
Name:  SMS_SENDER_NUMBER
Value: +2250595871746
```

Sauvegardez (Railway redéploie automatiquement)

---

### ÉTAPE 3 : Attendre le Déploiement (2 minutes)

Railway redéploie automatiquement après chaque variable.

**Attendez** que le service affiche **"Active"** avec une **pastille verte**.

---

## ✅ VÉRIFICATION RAPIDE

Une fois les 4 variables ajoutées et le service "Active" :

```powershell
cd "c:\Users\MSI\Desktop\GS cursor"
node test_sms_android.js
```

**Vous devez voir** :
```
✅ Configuration récupérée
   Device ID: 5298
   SIM Slot: 0
   Sender Number: +2250595871746
```

---

## 🎯 RÉCAPITULATIF

**4 variables à configurer** :

| Variable | Valeur |
|----------|--------|
| `SMS8_API_URL` | `https://app.sms8.io/services/send.php` |
| `SMS_DEVICE_ID` | `5298` |
| `SMS_SIM_SLOT` | `0` |
| `SMS_SENDER_NUMBER` | `+2250595871746` |

---

## 📱 APRÈS LE DÉPLOIEMENT

1. **Créez une commande** sur https://afgestion.net
2. **Mettez votre numéro** : `+225...`
3. **Vérifiez** que le SMS arrive de `+2250595871746`
4. **Essayez de répondre** au SMS (doit fonctionner !)

---

**⏰ DURÉE TOTALE : 5 MINUTES**

**→ Allez sur Railway maintenant et ajoutez les 4 variables !** 🚀
