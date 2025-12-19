# 🔕 DÉSACTIVATION DE SMS SPÉCIFIQUES

## 🎯 SMS À DÉSACTIVER

Les types de SMS suivants seront désactivés :

1. ❌ **Commande livrée** (`ORDER_DELIVERED`)
2. ❌ **Commande annulée** (`ORDER_CANCELLED`)
3. ❌ **Livreur assigné** (`DELIVERY_ASSIGNED`)
4. ❌ **Rappel RDV** (`RDV_REMINDER`)
5. ❌ **Alerte livreur** (`NOTIFICATION`)

## ✅ SMS QUI RESTENT ACTIFS

Les types de SMS suivants resteront actifs :

1. ✅ **Commande créée** (`ORDER_CREATED`)
2. ✅ **Commande validée** (`ORDER_VALIDATED`)
3. ✅ **Expédition confirmée** (`EXPEDITION_CONFIRMED`)
4. ✅ **Expédition en route** (`EXPEDITION_EN_ROUTE`)
5. ✅ **EXPRESS arrivé** (`EXPRESS_ARRIVED`)
6. ✅ **EXPRESS paiement en attente** (`EXPRESS_PAYMENT_PENDING`)
7. ✅ **RDV programmé** (`RDV_SCHEDULED`)

---

## 🔧 CONFIGURATION RAILWAY

### Variables à ajouter/modifier sur Railway :

Allez sur **Railway Dashboard** → Votre projet → **Variables**

Ajoutez ou modifiez ces variables :

```env
SMS_ORDER_DELIVERED=false
SMS_ORDER_CANCELLED=false
SMS_DELIVERY_ASSIGNED=false
SMS_RDV_REMINDER=false
SMS_NOTIFICATION=false
```

### Étapes détaillées :

1. **Connectez-vous à Railway** : https://railway.app
2. **Sélectionnez votre projet** : gs-pipeline-production
3. **Cliquez sur votre service** (backend)
4. **Allez dans l'onglet "Variables"**
5. **Cliquez sur "New Variable"** pour chaque variable
6. **Entrez** :
   - Variable : `SMS_ORDER_DELIVERED`
   - Value : `false`
7. **Répétez** pour les 4 autres variables
8. **Railway redémarre automatiquement** (~30 secondes)

---

## 📋 TABLEAU RÉCAPITULATIF

| Type SMS | Variable | Valeur | Status |
|----------|----------|--------|--------|
| Commande créée | `SMS_ORDER_CREATED` | `true` | ✅ Actif |
| Commande validée | `SMS_ORDER_VALIDATED` | `true` | ✅ Actif |
| **Commande livrée** | **`SMS_ORDER_DELIVERED`** | **`false`** | ❌ **Désactivé** |
| **Commande annulée** | **`SMS_ORDER_CANCELLED`** | **`false`** | ❌ **Désactivé** |
| Expédition confirmée | `SMS_EXPEDITION_CONFIRMED` | `true` | ✅ Actif |
| Expédition en route | `SMS_EXPEDITION_EN_ROUTE` | `true` | ✅ Actif |
| EXPRESS arrivé | `SMS_EXPRESS_ARRIVED` | `true` | ✅ Actif |
| EXPRESS paiement | `SMS_EXPRESS_PAYMENT_PENDING` | `true` | ✅ Actif |
| **Livreur assigné** | **`SMS_DELIVERY_ASSIGNED`** | **`false`** | ❌ **Désactivé** |
| RDV programmé | `SMS_RDV_SCHEDULED` | `true` | ✅ Actif |
| **Rappel RDV** | **`SMS_RDV_REMINDER`** | **`false`** | ❌ **Désactivé** |
| **Alerte livreur** | **`SMS_NOTIFICATION`** | **`false`** | ❌ **Désactivé** |

---

## 🧪 VÉRIFICATION

Après avoir configuré les variables sur Railway, utilisez ce script :

```bash
node verifier_config_sms.js
```

Le script affichera la configuration actuelle et confirmera les désactivations.

---

## 🔄 IMPACT

### Ce qui se passe après la désactivation :

#### ❌ Commande livrée
- Quand un livreur marque une commande comme "Livrée"
- **Avant** : Client recevait un SMS de confirmation
- **Après** : Pas de SMS envoyé

#### ❌ Commande annulée
- Quand une commande est annulée
- **Avant** : Client recevait un SMS d'annulation
- **Après** : Pas de SMS envoyé

#### ❌ Livreur assigné
- Quand un livreur est assigné à une tournée
- **Avant** : Livreur recevait un SMS de notification
- **Après** : Pas de SMS envoyé

#### ❌ Rappel RDV
- Pour les rappels de RDV (24h avant, etc.)
- **Avant** : Client recevait un SMS de rappel
- **Après** : Pas de SMS envoyé

#### ❌ Alerte livreur
- Notifications générales aux livreurs
- **Avant** : Livreur recevait un SMS d'alerte
- **Après** : Pas de SMS envoyé

---

## ✅ SMS TOUJOURS ACTIFS

Les SMS importants restent actifs :

1. **Commande créée** : Client informé de sa commande
2. **Commande validée** : Client informé de la validation
3. **Expédition confirmée** : Client informé de l'envoi
4. **EXPRESS arrivé** : Client informé de l'arrivée du livreur
5. **RDV programmé** : Client informé de son RDV

---

## 💰 ÉCONOMIES

En désactivant 5 types de SMS sur 12, vous économisez :

- **~40% de SMS** en moins
- **Réduction des coûts** forfait SIM
- **Messages plus ciblés** (seulement les essentiels)

---

## 🔄 RÉACTIVER SI NÉCESSAIRE

Pour réactiver un type de SMS plus tard :

1. Allez sur Railway → Variables
2. Changez `false` en `true`
3. Ou supprimez la variable (défaut = `true`)
4. Railway redémarre automatiquement

---

## 📱 PANNEAU ADMIN

Vous pouvez aussi gérer les SMS depuis l'interface :

1. Connectez-vous en **ADMIN**
2. Menu → **Paramètres SMS**
3. Désactivez/activez les types voulus
4. Les changements sont immédiats

⚠️ **IMPORTANT** : Les variables Railway ont priorité sur le panneau admin.

---

## 🎯 RÉSUMÉ

**Action** : Désactivation de 5 types de SMS  
**Méthode** : Variables Railway  
**Durée** : 2 minutes  
**Impact** : Immédiat après redémarrage  
**Réversible** : Oui, à tout moment  

---

**Configuration terminée ! Les SMS seront désactivés dès le redémarrage de Railway. ✅**
