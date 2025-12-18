# 🔍 VÉRIFIER LES LOGS RAILWAY POUR ORDER_CREATED

## Étapes pour diagnostiquer

### 1. Allez sur Railway Dashboard

1. Ouvrez https://railway.app
2. Connectez-vous
3. Sélectionnez votre projet `gs-pipeline`
4. Cliquez sur le service **Backend** (Node.js)

### 2. Accédez aux Logs

1. Dans le menu de gauche, cliquez sur **"Deployments"**
2. Cliquez sur le déploiement le plus récent (en haut)
3. Cliquez sur l'onglet **"View Logs"**

### 3. Créez une commande test

**Pendant que les logs sont ouverts** :

1. Allez sur https://afgestion.net
2. Connectez-vous en tant qu'Admin ou Gestionnaire
3. Créez une nouvelle commande :
   - Nom : Test SMS
   - Téléphone : +2250712345678 (votre numéro)
   - Ville : Abidjan
   - Produit : BEE VENOM
   - Quantité : 1
   - Montant : 10000

4. **Observez les logs en temps réel**

###4. Cherchez les erreurs

Dans les logs, cherchez :

#### ✅ Si tout fonctionne :

```
📱 SMS envoyé via Android 5298 (SIM 1) : +2250...
✅ SMS orderCreated envoyé pour commande...
```

#### ❌ Si erreur :

```
❌ Erreur envoi SMS: ...
❌ Erreur génération SMS ORDER_CREATED: ...
Template ORDER_CREATED non trouvé ou désactivé
```

### 5. Erreurs possibles et solutions

| Erreur dans les logs | Cause | Solution |
|----------------------|-------|----------|
| `Template ORDER_CREATED non trouvé` | Migration pas exécutée | Redéployer Railway |
| `prisma.smsTemplate is not a function` | Client Prisma pas régénéré | Redéployer Railway |
| `generateSmsFromTemplate is not defined` | Import manquant | Vérifier imports dans routes |
| `TypeError: smsTemplates.orderCreated is not a function` | Service SMS pas à jour | Redéployer Railway |
| **Aucune log SMS** | SMS désactivé ou erreur silencieuse | Vérifier `SMS_ENABLED=true` |

### 6. Vérifications supplémentaires

#### A. Variable SMS_ORDER_CREATED

Dans Railway Dashboard → Variables :

```
SMS_ORDER_CREATED = true  ✅
```

Si manquante ou `false` → **Ajouter/Modifier**

#### B. Variable SMS_ENABLED

```
SMS_ENABLED = true  ✅
```

Si `false` → **Activer**

### 7. Solutions selon le diagnostic

#### Solution 1 : Migration Prisma pas exécutée

```bash
# Railway Dashboard → Deployments → Redeploy
```

Cela va :
- Reconstruire l'image Docker
- Exécuter `prisma migrate deploy`
- Créer la table `sms_templates`

#### Solution 2 : Code pas déployé

```bash
# Vérifier le dernier commit déployé
# Railway Dashboard → Deployments → View Commit
```

Doit être : `ca6c7f8` ou plus récent

Si ancien commit → **Redéployer manuellement**

#### Solution 3 : Client Prisma pas régénéré

Railway doit exécuter automatiquement :
```bash
prisma generate
prisma migrate deploy
```

Si problème → **Redéployer**

### 8. Test final

Après correction :

1. Créez une nouvelle commande
2. Vérifiez les logs Railway → ✅ "SMS envoyé"
3. Vérifiez votre téléphone → ✅ SMS reçu
4. Vérifiez l'historique :
   ```
   Menu Admin → Paramètres SMS → Historique
   ```
   → Doit afficher le SMS ORDER_CREATED

---

## 📊 RÉCAPITULATIF DES VÉRIFICATIONS

| Élément | Commande/Action | Résultat attendu |
|---------|-----------------|------------------|
| **1. Template en DB** | `node test_template_order_created.js` | ✅ Template trouvé |
| **2. Variables Railway** | Dashboard → Variables | ✅ SMS_ENABLED=true, SMS_ORDER_CREATED=true |
| **3. Commit déployé** | Dashboard → Deployments | ✅ ca6c7f8 ou plus récent |
| **4. Logs création commande** | Créer commande → Observer logs | ✅ "SMS envoyé via Android..." |
| **5. Téléphone** | Vérifier SMS reçu | ✅ Message reçu de +2250595871746 |
| **6. Historique** | Menu Admin → Paramètres SMS | ✅ SMS ORDER_CREATED visible |

---

## 🆘 SI TOUT ÉCHOUE

### Rollback temporaire

Si urgent, vous pouvez désactiver les templates DB :

**Option A : Désactiver temporairement**

Railway Dashboard → Variables :
```
SMS_ORDER_CREATED = false
```

**Option B : Utiliser l'ancien système (sans DB)**

Cela nécessiterait de restaurer le code avant `ca6c7f8`, mais **PAS RECOMMANDÉ** car perdrait toutes les nouvelles fonctionnalités.

---

## 📞 SUPPORT

Si le problème persiste après toutes ces vérifications :

1. **Copiez les logs Railway** (surtout les erreurs)
2. **Faites une capture d'écran** des variables
3. **Notez le commit déployé**
4. Ces informations permettront un diagnostic plus précis

---

**⏰ Temps estimé de diagnostic : 5-10 minutes**
