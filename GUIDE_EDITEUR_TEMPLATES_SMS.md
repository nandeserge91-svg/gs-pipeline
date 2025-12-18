# 📝 GUIDE COMPLET : ÉDITEUR DE TEMPLATES SMS

## 🎯 Vue d'ensemble

Vous pouvez maintenant **personnaliser tous les messages SMS** envoyés automatiquement par votre système !

**Accès** : Menu Admin → **Paramètres SMS** → Onglet **"Éditeur de Templates"**

---

## ✨ FONCTIONNALITÉS

### 1. **11 Templates modifiables**

Chaque type de SMS peut être personnalisé :

| Catégorie | Template | Variables |
|-----------|----------|-----------|
| **📦 Commandes** | Commande reçue | `{prenom}` `{ref}` |
| | Commande validée | `{prenom}` `{produit}` `{montant}` |
| | Commande livrée | `{prenom}` `{ref}` |
| | Commande annulée | `{prenom}` `{ref}` |
| **🚚 Livraison** | Livreur assigné | `{prenom}` `{livreur}` `{telephone}` |
| **📦 Expédition** | Expédition confirmée | `{prenom}` `{ville}` `{code}` |
| | Paiement confirmé | `{prenom}` `{montant}` `{ref}` |
| **🏢 Express** | Express arrivé | `{prenom}` `{agence}` `{code}` `{montant}` |
| | Rappel retrait | `{prenom}` `{agence}` `{jours}` `{code}` |
| **📅 RDV** | RDV programmé | `{prenom}` `{date}` `{heure}` |
| | Rappel RDV | `{prenom}` `{heure}` |

### 2. **Éditeur en temps réel**

- ✅ Modification instantanée du texte
- ✅ Prévisualisation avec variables remplacées
- ✅ Compteur de caractères (160 max pour 1 SMS)
- ✅ Alerte si dépassement (facturé en 2 SMS)
- ✅ Indicateur de modifications non sauvegardées

### 3. **Variables dynamiques**

Les variables entre `{accolades}` sont **automatiquement remplacées** lors de l'envoi :

```
Template : Bonjour {prenom}, votre commande {ref} est confirmée !
Résultat : Bonjour Kouame, votre commande ORD-12345 est confirmée !
```

### 4. **Sécurité et Fallback**

- ✅ Si erreur de chargement → Message de secours automatique
- ✅ Si template désactivé → Message par défaut
- ✅ Modifications isolées par template
- ✅ Historique de dernière modification

---

## 🚀 UTILISATION

### Étape 1 : Accéder à l'éditeur

1. **Menu Admin** → **Paramètres SMS**
2. Cliquez sur l'onglet **"Éditeur de Templates"**

### Étape 2 : Sélectionner un template

- Les templates sont **groupés par catégorie** (Commandes, Livraison, etc.)
- Cliquez sur un template pour l'ouvrir dans l'éditeur
- Un **point bleu** indique un template modifié

### Étape 3 : Personnaliser le message

1. **Modifiez le texte** dans l'éditeur
2. **Utilisez les variables** affichées en haut (ex: `{prenom}`, `{ref}`)
3. **Vérifiez la prévisualisation** en bas (avec exemples)
4. **Surveillez le compteur** de caractères (max 160 recommandé)

### Étape 4 : Sauvegarder

- Cliquez sur **"Sauvegarder"** (bouton bleu)
- Les modifications sont **appliquées immédiatement**
- Les prochains SMS utiliseront le nouveau template

### Étape 5 : Réinitialiser (optionnel)

- Bouton **"Réinitialiser"** pour revenir au template par défaut
- Utile si vous voulez annuler vos modifications

---

## 📊 EXEMPLES DE PERSONNALISATION

### Exemple 1 : Ajouter votre nom de boutique

**Avant** (défaut) :
```
Bonjour {prenom}, votre commande {ref} est enregistree. 
Nous vous appellerons bientot. - AFGestion
```

**Après** (personnalisé) :
```
Bonjour {prenom}, votre commande {ref} chez AF Beauty 
a ete enregistree avec succes ! Nous vous appelons sous peu.
```

### Exemple 2 : Ajouter un lien

**Avant** :
```
Bonjour {prenom}, votre colis est arrive a {agence}. 
Code retrait: {code}. A payer: {montant} F. - AFGestion
```

**Après** :
```
Bonjour {prenom} ! Votre colis est disponible a {agence}.
Code: {code} | Montant: {montant} F
📍 Maps: bit.ly/agence-af
```

### Exemple 3 : Message plus court

**Avant** (104 caractères) :
```
Bonjour {prenom}, votre commande {produit} ({montant} F) 
est confirmee. Livraison prochainement. - AFGestion
```

**Après** (85 caractères) :
```
{prenom}, commande {produit} confirmee ({montant}F). 
Livraison bientot. Merci ! - AF
```

---

## ⚙️ ARCHITECTURE TECHNIQUE

### Base de données

**Table** : `sms_templates`

| Champ | Type | Description |
|-------|------|-------------|
| `key` | String | Clé unique (ORDER_CREATED, etc.) |
| `label` | String | Nom affiché |
| `description` | String | Description du template |
| `category` | String | Catégorie (Commandes, etc.) |
| `icon` | String | Emoji d'icône |
| `template` | String | **Template personnalisé** |
| `defaultTemplate` | String | Template par défaut (reset) |
| `variables` | JSON | Variables disponibles |
| `characterCount` | Number | Nb de caractères |
| `isActive` | Boolean | Actif ou non |
| `lastModifiedBy` | Number | User qui a modifié |

### Service SMS (`services/sms.service.js`)

**Nouvelles fonctions** :

```javascript
// Charger un template depuis la DB
export async function getTemplate(templateKey)

// Remplacer les variables
function replaceVariables(template, variables)

// Générer un SMS depuis un template
export async function generateSmsFromTemplate(templateKey, variables)

// Fallback en cas d'erreur
function generateFallbackMessage(templateKey, variables)
```

**Modifications** :

- Toutes les fonctions `smsTemplates.*` sont maintenant **asynchrones**
- Chargement automatique depuis la DB
- Fallback automatique si erreur

### Routes API (`routes/sms-templates.routes.js`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/sms-templates` | Liste tous les templates |
| `GET` | `/api/sms-templates/:key` | Récupérer un template |
| `PUT` | `/api/sms-templates/:key` | Modifier un template |
| `POST` | `/api/sms-templates/:key/reset` | Réinitialiser |
| `POST` | `/api/sms-templates/:key/preview` | Prévisualiser |
| `GET` | `/api/sms-templates/stats/usage` | Statistiques |

### Composant React (`SmsTemplateEditor.tsx`)

**États** :
- `templates` : Liste des templates
- `selectedTemplate` : Template en cours d'édition
- `editedTemplate` : Texte modifié
- `preview` : Prévisualisation avec variables
- `exampleVariables` : Variables d'exemple

**Fonctionnalités** :
- Groupement par catégorie
- Édition en temps réel
- Prévisualisation dynamique
- Sauvegarde asynchrone
- Reset aux valeurs par défaut

---

## 🛡️ SÉCURITÉ & BONNES PRATIQUES

### ✅ À FAIRE

1. **Testez toujours** avant de sauvegarder :
   - Vérifiez la prévisualisation
   - Comptez les caractères
   - Testez avec un vrai numéro

2. **Utilisez les variables** :
   - `{prenom}` au lieu du nom complet
   - `{ref}` pour la référence commande
   - `{montant}` pour le prix

3. **Restez concis** :
   - Max 160 caractères pour 1 SMS
   - Évitez les emojis excessifs
   - Message clair et direct

4. **Gardez la signature** :
   - Ajoutez votre nom de marque
   - Ex: `- AFGestion`, `- AF Beauty`

### ❌ À ÉVITER

1. ❌ **Supprimer les variables** :
   ```
   Mauvais : "Bonjour, votre commande est confirmée"
   Bon     : "Bonjour {prenom}, votre commande {ref} est confirmée"
   ```

2. ❌ **Messages trop longs** :
   - > 160 caractères = 2 SMS facturés
   - Coût doublé pour chaque envoi

3. ❌ **Fautes d'orthographe** :
   - Relisez avant de sauvegarder
   - Impact sur la réputation

4. ❌ **Informations sensibles** :
   - Pas de mots de passe
   - Pas de données bancaires

---

## 🔧 MIGRATION ET DÉPLOIEMENT

### Migration automatique

Au démarrage, Prisma **crée automatiquement** :
1. La table `sms_templates`
2. Les **11 templates par défaut**
3. Les index et relations

**Fichier** : `prisma/migrations/20251218_add_sms_templates/migration.sql`

### Déploiement

1. **GitHub** : Code poussé → `commit ca6c7f8`
2. **Railway** (Backend) :
   - Déploiement automatique
   - Migration Prisma exécutée
   - Routes API disponibles
   
3. **Vercel** (Frontend) :
   - Déploiement automatique
   - Nouvel onglet visible
   - Interface accessible

**Status** : ✅ Déployé automatiquement

---

## 📈 STATISTIQUES

### Voir l'utilisation

**Route API** : `GET /api/sms-templates/stats/usage`

Retourne pour chaque template :
- Nombre de SMS envoyés (30 derniers jours)
- Nombre de caractères
- Status actif/inactif

### Dans l'interface

*À venir* : Affichage des stats dans l'éditeur

---

## 🆘 DÉPANNAGE

### Problème 1 : Template ne se charge pas

**Symptômes** : Spinner infini, erreur de chargement

**Solutions** :
1. Vérifiez Railway : déploiement terminé ?
2. Vérifiez la migration : `prisma migrate status`
3. Vérifiez les logs Railway : erreurs SQL ?

### Problème 2 : Modifications non sauvegardées

**Symptômes** : Clic sur "Sauvegarder" mais rien ne change

**Solutions** :
1. Vérifiez la console navigateur (F12)
2. Vérifiez l'authentification (token valide ?)
3. Vérifiez les droits : vous êtes ADMIN ?

### Problème 3 : SMS envoyé avec ancien template

**Symptômes** : Malgré la modification, SMS utilise ancien texte

**Solutions** :
1. Attendez 1 minute (cache Redis si activé)
2. Redémarrez Railway (bouton "Restart")
3. Vérifiez dans la DB : template bien modifié ?

---

## 📚 RESSOURCES

### Fichiers importants

| Fichier | Rôle |
|---------|------|
| `prisma/schema.prisma` | Modèle `SmsTemplate` |
| `services/sms.service.js` | Logique de génération |
| `routes/sms-templates.routes.js` | API de gestion |
| `frontend/.../SmsTemplateEditor.tsx` | Interface édition |
| `frontend/.../SmsSettings.tsx` | Page principale (onglets) |

### Variables disponibles par template

**ORDER_CREATED** : `prenom`, `ref`  
**ORDER_VALIDATED** : `prenom`, `produit`, `montant`  
**DELIVERY_ASSIGNED** : `prenom`, `livreur`, `telephone`  
**ORDER_DELIVERED** : `prenom`, `ref`  
**EXPEDITION_CONFIRMED** : `prenom`, `ville`, `code`  
**EXPRESS_ARRIVED** : `prenom`, `agence`, `code`, `montant`  
**EXPRESS_REMINDER** : `prenom`, `agence`, `jours`, `code`  
**RDV_SCHEDULED** : `prenom`, `date`, `heure`  
**RDV_REMINDER** : `prenom`, `heure`  
**ORDER_CANCELLED** : `prenom`, `ref`  
**PAYMENT_CONFIRMED** : `prenom`, `montant`, `ref`

---

## 🎉 RÉSUMÉ

### Avant (Option 1)

- ❌ Templates hardcodés dans le code
- ❌ Modification nécessite redéploiement
- ❌ Dépendance développeur

### Après (Option 2) ✅

- ✅ Templates en base de données
- ✅ Modification instantanée depuis l'interface
- ✅ Autonomie complète
- ✅ Prévisualisation en temps réel
- ✅ Compteur de caractères
- ✅ Reset aux valeurs par défaut
- ✅ Historique des modifications

**Temps de développement** : ~30 minutes  
**Déploiement** : Automatique (Railway + Vercel)  
**Disponibilité** : Immédiate après déploiement  

---

## 🚀 PROCHAINES ÉTAPES

1. **Testez l'éditeur** sur https://afgestion.net
2. **Personnalisez vos premiers templates**
3. **Envoyez un SMS de test** pour vérifier
4. **Ajustez selon vos besoins**

---

## 💡 SUPPORT

**Questions ?** Consultez :
- Ce guide : `GUIDE_EDITEUR_TEMPLATES_SMS.md`
- Guide SMS général : `GUIDE_PANNEAU_CONTROLE_SMS.md`
- Doc SMS8.io : `MIGRATION_ANDROID_SMS.md`
- Rappel complet : `RappelAF.md`

---

**🎊 Félicitations ! Vous avez maintenant un contrôle total sur vos messages SMS ! 🎊**
