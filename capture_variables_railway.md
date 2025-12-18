# 📸 VÉRIFICATION : Capture des variables Railway

## 🎯 OBJECTIF

Confirmer que `SMS_ENABLED = true` sur Railway

---

## 📋 ÉTAPES

### 1. Ouvrez Railway Dashboard

```
https://railway.app
→ Connexion
→ Projet "gs-pipeline"
→ Service "Backend"
```

### 2. Variables (menu gauche)

Cliquez sur **"Variables"** dans le menu de gauche

### 3. Cherchez SMS_ENABLED

Scrollez dans la liste des variables et cherchez :

```
SMS_ENABLED
```

### 4. Vérifiez la valeur

**Quelle est la valeur actuelle ?**

- [ ] `true` ✅
- [ ] `false` ❌
- [ ] Variable absente ❌

---

## ✅ SI LA VALEUR EST `false` OU ABSENTE

### Modification

1. **Si `false`** : Cliquez sur `SMS_ENABLED` → Changez en `true`
2. **Si absente** : Cliquez "+ New Variable" → Name: `SMS_ENABLED`, Value: `true`
3. **Sauvegardez**
4. **Attendez 1 minute** (redémarrage auto)

---

## 🧪 TEST APRÈS MODIFICATION

```bash
# Dans 1 minute, relancez le diagnostic
node diagnostic_order_created_specific.js
```

**Résultat attendu** :
```
SMS_ENABLED: ✅ true  ← Doit changer de ❌ false à ✅ true
```

---

## 📊 AUTRES VARIABLES À VÉRIFIER

Pendant que vous y êtes :

| Variable | Valeur attendue | Statut |
|----------|-----------------|--------|
| `SMS_ENABLED` | `true` | ⚠️ À vérifier |
| `SMS_DEVICE_ID` | `5298` | ? |
| `SMS_SIM_SLOT` | `0` | ? |
| `SMS_SENDER_NUMBER` | `+2250595871746` | ? |
| `SMS8_API_KEY` | `6a85...` | ? |
| `SMS8_API_URL` | `https://app.sms8.io/services/send.php` | ? |

---

## 💡 ASTUCE

**Pour voir toutes les variables SMS d'un coup** :

Dans Railway Variables, tapez "SMS" dans la barre de recherche → Toutes les variables SMS s'affichent

---

## ⏰ SI VOUS VENEZ DE MODIFIER

**Attendez 60-90 secondes** que Railway redémarre le service automatiquement.

**Vous verrez** :
- Badge "Restarting" pendant ~30s
- Puis badge "Active" (vert)

**Après "Active"** → Relancez le diagnostic

---

## 🎯 PROCHAINE ÉTAPE

Une fois `SMS_ENABLED = true` confirmé :

1. **Créez une commande test** depuis l'interface Admin
2. **Vérifiez votre téléphone** → SMS reçu
3. **Vérifiez l'historique** → SMS ORDER_CREATED visible

---

**Si après toutes ces vérifications, ORDER_CREATED ne fonctionne TOUJOURS pas alors que SMS_ENABLED = true, alors nous chercherons un problème plus spécifique dans le code.**
