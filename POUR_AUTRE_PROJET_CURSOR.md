# 📦 INTÉGRATION SMS8.IO - GUIDE POUR NOUVEAU PROJET

**À envoyer à votre autre éditeur Cursor**

---

## 🎯 OBJECTIF

Reproduire À L'IDENTIQUE le système SMS de GS-Pipeline avec :
- ✅ Envoi SMS via Android dédié (SMS8.io)
- ✅ 11 types de SMS configurables
- ✅ Templates personnalisables depuis l'interface
- ✅ Panneau de contrôle admin complet
- ✅ Historique et statistiques

---

## 📂 FICHIERS À RÉCUPÉRER

Tous les fichiers sont disponibles sur ce repo GitHub :
**https://github.com/nandeserge91-svg/gs-pipeline**

### Fichiers à copier dans le nouveau projet :

#### Backend
```
utils/phone.util.js                      (76 lignes)
services/sms.service.js                  (545 lignes)
routes/sms.routes.js                     (364 lignes)
routes/sms-settings.routes.js            (349 lignes)
routes/sms-templates.routes.js           (274 lignes)
```

#### Frontend  
```
frontend/src/pages/admin/SmsSettings.tsx          (462 lignes)
frontend/src/pages/admin/SmsTemplateEditor.tsx    (379 lignes)
```

---

## 📋 GUIDE PRINCIPAL

Le fichier **`INTEGRATION_SMS8_COMPLETE_GUIDE.md`** contient :

### Section 1 : Configuration SMS8.io ✅
- Comment créer un compte
- Connecter un Android
- Récupérer API Key, Device ID, etc.
- Tester l'API manuellement

### Section 2 : Base de données ✅
- Schéma Prisma complet (2 tables)
- Migration SQL prête à exécuter
- Relations avec User et Order

### Section 3 : Installation ⚠️ À COMPLÉTER
Les fichiers backend sont à copier depuis le repo

### Section 4 : Modifications nécessaires

#### 4.1. `prisma/schema.prisma`
Ajouter les 2 enum et 2 models (voir guide)

#### 4.2. `server.js`
```javascript
// Ajouter ces imports
import smsRoutes from './routes/sms.routes.js';
import smsSettingsRoutes from './routes/sms-settings.routes.js';
import smsTemplatesRoutes from './routes/sms-templates.routes.js';

// Ajouter ces routes
app.use('/api/sms', smsRoutes);
app.use('/api/sms-settings', smsSettingsRoutes);
app.use('/api/sms-templates', smsTemplatesRoutes);
```

#### 4.3. `package.json` (backend)
```json
{
  "dependencies": {
    "axios": "^1.6.2"
  }
}
```

#### 4.4. Routes métier (order.routes.js, etc.)
Ajouter l'envoi SMS automatique :

```javascript
import { sendSMS, smsTemplates } from '../services/sms.service.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

// Dans la route de création de commande
const cleanedPhone = cleanPhoneNumber(req.body.clientTelephone);

// Envoyer le SMS (non bloquant)
const smsEnabled = process.env.SMS_ENABLED === 'true';
const smsOrderCreatedEnabled = process.env.SMS_ORDER_CREATED !== 'false';

if (smsEnabled && smsOrderCreatedEnabled) {
  try {
    const message = await smsTemplates.orderCreated(
      order.clientNom, 
      order.orderReference,
      order.produitNom
    );
    await sendSMS(cleanedPhone, message, {
      orderId: order.id,
      type: 'ORDER_CREATED'
    });
  } catch (smsError) {
    console.error('⚠️ Erreur SMS (non bloquante):', smsError.message);
  }
}
```

#### 4.5. Frontend - Layout.tsx
Ajouter le lien menu :

```tsx
{user?.role === 'ADMIN' && (
  <Link
    to="/admin/sms-settings"
    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
  >
    <MessageSquare className="w-5 h-5" />
    Paramètres SMS
  </Link>
)}
```

#### 4.6. Frontend - Dashboard.tsx (routes)
```tsx
import SmsSettings from './SmsSettings';

// Dans les routes
<Route path="sms-settings" element={<SmsSettings />} />
```

---

## 🔧 VARIABLES D'ENVIRONNEMENT

### Backend (.env local)
```env
# SMS8.io - ADAPTEZ CES VALEURS À VOTRE COMPTE
SMS_ENABLED=true
SMS8_API_KEY=votre_api_key_ici
SMS8_API_URL=https://app.sms8.io/services/send.php
SMS_DEVICE_ID=votre_device_id
SMS_SIM_SLOT=0
SMS_SENDER_NUMBER=+[votre_numero_complet]
SMS_SENDER_NAME=VotreApp

# Activation par type (optionnel, true par défaut)
SMS_ORDER_CREATED=true
SMS_ORDER_VALIDATED=true
SMS_ORDER_DELIVERED=true
SMS_ORDER_CANCELLED=true
SMS_EXPEDITION_CONFIRMED=true
SMS_EXPEDITION_EN_ROUTE=true
SMS_EXPRESS_ARRIVED=true
SMS_EXPRESS_PAYMENT_PENDING=true
SMS_RDV_SCHEDULED=true
SMS_RDV_REMINDER=true
```

### Railway (production)
Les mêmes variables sur Railway Dashboard → Variables

---

## 🚀 DÉPLOIEMENT

### Étape 1 : Base de données
```bash
npx prisma migrate dev --name add_sms_system
npx prisma generate
```

### Étape 2 : Backend
```bash
npm install axios
npm run dev
```

### Étape 3 : Frontend
```bash
# Vérifier que ces dépendances sont installées
npm install lucide-react react-hot-toast
npm run dev
```

### Étape 4 : Railway
1. Pousser sur GitHub
2. Railway détecte automatiquement
3. Ajouter les variables d'environnement SMS
4. Attendre le déploiement

### Étape 5 : Vercel (frontend)
1. Pousser sur GitHub
2. Vercel rebuild automatique
3. Vérifier que le panneau SMS est accessible

---

## ✅ TESTS

### Test 1 : Vérifier les tables DB
```bash
npx prisma studio
# Vérifier : sms_logs, sms_templates
```

### Test 2 : Tester l'envoi
```
1. Connectez-vous en tant qu'ADMIN
2. Menu → Paramètres SMS
3. Entrez votre numéro
4. Cliquez "Envoyer Test"
5. Vérifiez réception du SMS
```

### Test 3 : Créer une commande
```
1. Créez une commande test
2. Vérifiez que le client reçoit le SMS
3. Vérifiez l'historique dans Paramètres SMS
```

### Test 4 : Éditeur de templates
```
1. Paramètres SMS → Éditeur de Templates
2. Sélectionnez "Commande créée"
3. Modifiez le message
4. Sauvegardez
5. Créez une commande → Vérifiez le nouveau message
```

---

## 📚 DOCUMENTATION COMPLÈTE

Les fichiers suivants contiennent des infos détaillées :

- **`INTEGRATION_SMS8_COMPLETE_GUIDE.md`** - Guide principal
- **`CONFIG_RAILWAY_ANDROID.md`** - Configuration Railway
- **`MIGRATION_ANDROID_SMS.md`** - Migration API
- **`RappelAF.md`** - Vue d'ensemble projet
- **`RESUME_FINAL_JOURNEE_18DEC.md`** - Récap complet

---

## ⚙️ ADAPTATIONS NÉCESSAIRES

### Préfixe téléphone
Si vous êtes dans un autre pays que la Côte d'Ivoire :

**Fichier** : `utils/phone.util.js`

Remplacez `+225` par votre préfixe :
- France : `+33`
- Cameroun : `+237`
- Sénégal : `+221`
- etc.

### Nom de l'application
Dans la migration SQL, remplacez "VotreApp" par le nom de votre application.

### Types de SMS
Adaptez les 11 types de SMS selon vos besoins dans :
- `prisma/schema.prisma` (enum SmsType)
- Migration SQL
- `sms.service.js` (fallback messages)

---

## 🎯 RÉSULTAT FINAL

Une fois l'intégration terminée, vous aurez :

✅ **Envoi SMS automatique** via votre Android dédié  
✅ **11 types de SMS** configurables  
✅ **Templates personnalisables** depuis l'interface  
✅ **Panneau admin complet** avec statistiques  
✅ **Historique détaillé** de tous les SMS  
✅ **Activation/désactivation** par type  
✅ **Nettoyage automatique** des numéros  

---

## 💰 COÛTS

- **SMS8.io** : Gratuit (envoi via votre propre Android)
- **Forfait SIM** : Selon votre opérateur (forfait illimité recommandé)
- **Pas de crédit SMS** à acheter !

---

## 🔒 SÉCURITÉ

- ✅ Authentification JWT requise
- ✅ Autorisation par rôle (ADMIN uniquement pour les settings)
- ✅ Variables sensibles dans .env (pas de commit)
- ✅ Logs de tous les SMS envoyés
- ✅ Gestion d'erreurs non bloquante

---

## ⏰ TEMPS ESTIMÉ

- Configuration SMS8.io : **10 min**
- Copie des fichiers : **10 min**
- Migration DB : **5 min**
- Modifications : **15 min**
- Tests : **10 min**
- Déploiement : **10 min**

**TOTAL : ~60 minutes**

---

## 📞 SUPPORT

En cas de problème :

1. **Vérifier Railway logs** : Railway Dashboard → Logs
2. **Vérifier Android Online** : https://app.sms8.io/devices
3. **Consulter la doc** : Fichiers .md dans le repo
4. **Tester en local** avant le déploiement

---

## 🎊 FÉLICITATIONS !

Vous allez reproduire un système SMS professionnel et complet ! 

Tous les codes sont prêts, il suffit de les copier et suivre ce guide.

**Bon courage ! 🚀**