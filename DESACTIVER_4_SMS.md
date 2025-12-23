# 🔕 DÉSACTIVER 4 TYPES DE SMS - GUIDE RAPIDE

## 🎯 SMS À DÉSACTIVER

1. ❌ **Commande livrée**
2. ❌ **Commande annulée**
3. ❌ **Livreur assigné**
4. ❌ **Alerte livreur**

---

## ⚡ MÉTHODE RAPIDE (2 minutes)

### Sur Railway Dashboard :

1. **Ouvrez** : https://railway.app/
2. **Connectez-vous** à votre compte
3. **Sélectionnez** le projet : `gs-pipeline`
4. **Cliquez** sur le service **Backend** (Node.js)
5. **Menu de gauche** → **Variables**

### Ajoutez ces 4 variables :

#### Variable 1 : Commande livrée
```
Variable Name: SMS_ORDER_DELIVERED
Value: false
```
**Action** : Cliquez "New Variable" → Entrez le nom et la valeur → "Add"

---

#### Variable 2 : Commande annulée
```
Variable Name: SMS_ORDER_CANCELLED
Value: false
```
**Action** : Cliquez "New Variable" → Entrez le nom et la valeur → "Add"

---

#### Variable 3 : Livreur assigné
```
Variable Name: SMS_DELIVERY_ASSIGNED
Value: false
```
**Action** : Cliquez "New Variable" → Entrez le nom et la valeur → "Add"

---

#### Variable 4 : Alerte livreur
```
Variable Name: SMS_DELIVERER_ALERT
Value: false
```
**Action** : Cliquez "New Variable" → Entrez le nom et la valeur → "Add"

---

## 🔄 REDÉMARRAGE AUTOMATIQUE

Railway va **automatiquement redémarrer** le service (30-60 secondes).

**Vous verrez** :
- 🔄 Badge "Restarting" sur le service
- ⏰ Attendez 1 minute
- ✅ Badge "Active" (pastille verte)

---

## ✅ VÉRIFICATION

### Après 1 minute :

1. **Allez sur** : https://afgestion.net/admin/sms-settings
2. **Rafraîchissez** la page (F5)
3. **Vérifiez** que les 4 types sont bien **désactivés** (toggle gris)

### Ou créez une commande test :
1. Créez une commande
2. Marquez-la comme "Livrée"
3. **Résultat** : ❌ Aucun SMS envoyé

---

## 📊 RÉSULTAT

### SMS DÉSACTIVÉS (4) :
- ❌ Commande livrée → Plus de SMS lors de la livraison
- ❌ Commande annulée → Plus de SMS lors de l'annulation
- ❌ Livreur assigné → Plus de SMS quand livreur assigné
- ❌ Alerte livreur → Plus d'alertes SMS aux livreurs

### SMS TOUJOURS ACTIFS (7) :
- ✅ Commande créée
- ✅ Commande validée
- ✅ Expédition confirmée
- ✅ Expédition en route
- ✅ EXPRESS arrivé
- ✅ RDV programmé
- ✅ Rappel RDV

---

## 💰 ÉCONOMIES

En désactivant 4 types de SMS sur 11 :
- **~36% de SMS en moins**
- **Réduction des coûts forfait SIM**
- **Messages plus ciblés**

---

## 🔄 POUR RÉACTIVER PLUS TARD

Si vous changez d'avis :
1. Railway → Variables
2. Changez `false` en `true`
3. Ou supprimez la variable (défaut = `true`)

---

## ⏰ TEMPS TOTAL

- **Ajout des 4 variables** : 1 minute
- **Redémarrage Railway** : 1 minute
- **TOTAL** : 2 minutes

---

**🎉 C'est tout ! Vos SMS seront désactivés après le redémarrage ! 🎉**




