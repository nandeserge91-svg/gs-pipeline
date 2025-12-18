# 📱 GUIDE - PANNEAU DE CONTRÔLE SMS

## 🎯 Vue d'ensemble

Le panneau de contrôle SMS permet aux administrateurs de **gérer l'activation/désactivation** de chaque type de SMS automatique envoyé par le système.

**Accès** : Menu Admin → **Paramètres SMS**

---

## ✨ FONCTIONNALITÉS

### 1. Activation Globale

**Interrupteur principal** en haut de la page pour activer/désactiver **tous les SMS** en une seule fois.

- ✅ **Activé** : Tous les SMS configurés sont envoyés
- ⏸️ **Désactivé** : Aucun SMS n'est envoyé (même si les types individuels sont activés)

**Utilisation** :
- Désactiver temporairement tous les SMS (maintenance, tests)
- Réactiver rapidement après maintenance

---

### 2. Configuration Android

Affiche les informations de l'Android dédié utilisé pour envoyer les SMS :
- **Device ID** : Identifiant unique de votre Android
- **SIM Slot** : Quelle SIM est utilisée (SIM 1 ou SIM 2)
- **Expéditeur** : Le numéro de téléphone affiché aux clients

---

### 3. Gestion par Type de SMS

Les SMS sont organisés par **catégories** :

#### 📦 Commandes
- **Commande reçue** : SMS envoyé automatiquement à la création d'une commande
- **Commande validée** : SMS de confirmation après validation par un appelant
- **Commande livrée** : SMS de confirmation de livraison
- **Commande annulée** : SMS d'information quand une commande est annulée

#### 🚚 Livraison
- **Livreur assigné** : SMS avec les coordonnées du livreur

#### 📦 Expédition
- **Expédition confirmée** : SMS quand un colis est expédié (paiement 100%)

#### 🏢 Express
- **EXPRESS arrivé en agence** : SMS avec le code de retrait quand le colis arrive
- **Rappel retrait EXPRESS** : Rappel automatique si le colis n'est pas retiré après 3 jours

#### 📅 RDV
- **RDV programmé** : SMS de confirmation quand un RDV est programmé
- **Rappel RDV** : Rappel automatique 1h avant le RDV

#### 🔔 Interne
- **Alerte livreur** : SMS envoyé au livreur pour nouvelle livraison assignée

---

### 4. Actions par Type de SMS

Pour chaque type, vous pouvez :

#### ✅ Activer/Désactiver
- Cliquez sur l'**interrupteur** à droite pour activer/désactiver ce type de SMS
- **Vert** = Activé, **Gris** = Désactivé

#### 📊 Voir les Statistiques
Sous chaque type, vous voyez :
- **Nombre total** de SMS envoyés dans les 30 derniers jours
- **Nombre de réussis** (avec icône verte)
- **Nombre d'échecs** (avec icône rouge)
- **Taux de succès** en pourcentage

**Code couleur du taux de succès** :
- 🟢 **Vert** : ≥ 95% (excellent)
- 🟡 **Jaune** : ≥ 80% (bon)
- 🔴 **Rouge** : < 80% (à surveiller)

#### 🧪 Tester l'Envoi
- Cliquez sur le bouton **"Test"** à droite de chaque type
- Entrez un numéro de téléphone dans le champ en bas de page
- Recevez immédiatement un SMS de test pour ce type

---

### 5. Panel de Test Global

En bas de la page, un champ permet de tester rapidement l'envoi :
1. **Entrez votre numéro** : `+225 XX XX XX XX XX`
2. **Cliquez sur "Envoyer Test"**
3. Un SMS de test est envoyé avec le premier type activé
4. Vérifiez la réception sur votre téléphone

---

## ⚙️ FONCTIONNEMENT TECHNIQUE

### Changements Temporaires ⚠️

**IMPORTANT** : Les modifications faites dans ce panneau sont **TEMPORAIRES**.

**Pourquoi ?**
- Les paramètres SMS sont stockés dans les **variables d'environnement** (Railway)
- Ce panneau modifie uniquement la **mémoire du serveur** en cours d'exécution
- Au **redémarrage du serveur**, les valeurs reviennent aux variables Railway

### Changements Permanents

Pour rendre les modifications **permanentes** :

1. **Allez sur Railway Dashboard** : https://railway.app/
2. **Projet** `afgestion` → Service `gs-pipeline` → **Variables**
3. **Modifiez les variables** correspondantes :
   - `SMS_ENABLED` : Activation globale
   - `SMS_ORDER_CREATED` : Commande reçue
   - `SMS_ORDER_VALIDATED` : Commande validée
   - `SMS_ORDER_DELIVERED` : Commande livrée
   - etc.
4. Railway **redéploie automatiquement** (2-3 min)

---

## 📊 UTILISATION RECOMMANDÉE

### Cas d'usage courants

#### 1. Désactiver temporairement les SMS (Maintenance)
```
Scénario : Maintenance sur SMS8.io ou Android
Action : Désactiver l'interrupteur global
Durée : Temporaire (réactiver après maintenance)
```

#### 2. Tester un nouveau type de SMS
```
Scénario : Vérifier qu'un type de SMS fonctionne bien
Action : 
  1. Entrer votre numéro dans le champ de test
  2. Cliquer sur "Test" pour ce type
  3. Vérifier la réception
```

#### 3. Désactiver les rappels automatiques (Hors service)
```
Scénario : Période de vacances, service client fermé
Action : 
  1. Désactiver "Rappel retrait EXPRESS"
  2. Désactiver "Rappel RDV"
  3. Garder les autres SMS activés
```

#### 4. Analyser les performances d'un type de SMS
```
Scénario : Trop d'échecs sur un type de SMS
Action :
  1. Consulter les statistiques du type concerné
  2. Vérifier le taux de succès
  3. Si < 80%, investiguer (Android offline, crédit SIM, etc.)
```

---

## 🎨 INTERFACE

### Codes Couleurs

| Couleur | Signification |
|---------|---------------|
| 🟢 Vert | Activé / Succès |
| 🔴 Rouge | Désactivé / Échec |
| 🟡 Jaune | Avertissement |
| 🔵 Bleu | Information |
| ⚪ Gris | Désactivé |

### Icônes

| Icône | Signification |
|-------|---------------|
| ⚙️ | Paramètres |
| 📱 | Android / SMS |
| ✅ | Activé / Succès |
| ❌ | Désactivé / Échec |
| 🧪 | Test |
| 📊 | Statistiques |
| 🔄 | En cours |

---

## 🔍 SURVEILLANCE ET MONITORING

### Que surveiller ?

#### 1. Taux de succès global
- Consultez régulièrement les statistiques
- **Objectif** : > 95% de succès
- **Action si < 90%** : Vérifier Android, connexion, crédit SIM

#### 2. Android Online
- Vérifiez quotidiennement sur https://app.sms8.io/devices
- **Status attendu** : Online (pastille verte)
- **Si Offline** : Vérifier téléphone allumé, connecté, app active

#### 3. Volume de SMS
- Surveillez le nombre de SMS envoyés
- **Forte augmentation soudaine** : Possible spam ou erreur
- **Forte diminution** : SMS peut-être désactivés par erreur

#### 4. Types de SMS échoués
- Si un type spécifique a beaucoup d'échecs :
  - Vérifier le template du message (peut-être trop long)
  - Vérifier les numéros de téléphone (format correct ?)
  - Tester manuellement ce type

---

## ⚠️ AVERTISSEMENTS

### 🔴 Attention aux modifications en production

**Avant de désactiver un type de SMS** :
1. ✅ Vérifiez l'impact sur l'expérience client
2. ✅ Informez l'équipe de la désactivation
3. ✅ Notez la raison et la durée prévue
4. ✅ Réactivez dès que possible

### 🔴 Ne pas désactiver sans raison

Certains SMS sont **critiques** pour l'expérience client :
- **Commande reçue** : Rassure le client
- **EXPRESS arrivé** : Info nécessaire pour retrait
- **RDV programmé** : Confirmation importante

**Réserver la désactivation pour** :
- Maintenance technique
- Tests
- Problèmes techniques identifiés

---

## 🆘 DÉPANNAGE

### Problème : "Les modifications ne s'appliquent pas"

**Cause** : Les changements sont temporaires
**Solution** : 
1. Modifiez les variables sur Railway pour changement permanent
2. Ou acceptez que les changements soient perdus au redémarrage

### Problème : "Taux de succès très bas"

**Solutions possibles** :
1. Vérifier que l'Android est Online sur SMS8.io
2. Vérifier que la SIM a du crédit ou un forfait
3. Vérifier la connexion Internet de l'Android
4. Redémarrer l'app SMS8.io sur l'Android
5. Contacter le support SMS8.io

### Problème : "SMS de test non reçu"

**Vérifications** :
1. Numéro de téléphone au bon format : `+225XXXXXXXXXX`
2. Type de SMS est activé
3. Activation globale est active
4. Consulter l'historique SMS (Menu Admin → SMS) pour voir si envoyé

### Problème : "Statistiques à 0"

**Cause** : Aucun SMS de ce type envoyé dans les 30 derniers jours
**Solution** : Normal si le type n'est pas utilisé fréquemment

---

## 📚 DOCUMENTATION COMPLÉMENTAIRE

| Document | Description |
|----------|-------------|
| `MIGRATION_ANDROID_SMS.md` | Détails techniques Android |
| `CONFIG_RAILWAY_ANDROID.md` | Configuration variables Railway |
| `RappelAF.md` | Documentation complète projet |

---

## 🎯 RÉSUMÉ RAPIDE

**Pour gérer les SMS** :
1. Menu Admin → **Paramètres SMS**
2. Activer/Désactiver les types souhaités
3. Tester avec votre numéro
4. Surveiller les statistiques

**Pour rendre permanent** :
1. Railway Dashboard → Variables
2. Modifier les variables `SMS_XXX`
3. Attendre redéploiement (3 min)

**En cas de problème** :
1. Vérifier Android Online sur SMS8.io
2. Tester l'envoi manuellement
3. Consulter les logs Railway
4. Vérifier crédit SIM / forfait

---

**Le panneau de contrôle SMS vous permet de gérer facilement tous vos SMS automatiques ! 📱✨**
