# 📱 CONFIGURATION SMS

## Fournisseur actif : SMSEnvoie (téléphone Xiaomi1)

Depuis le passage à SMSEnvoie, les SMS automatiques partent du téléphone Android
**Xiaomi1** connecté à https://smsenvoie.com. SMS8.io reste disponible en secours.

Variables Railway (service backend) :

```env
# Clé API SMSEnvoie (Tableau de bord SMSEnvoie → API). Dès qu'elle est renseignée,
# SMSEnvoie devient le fournisseur actif.
SMSENVOIE_API_KEY=sk_live_votre_cle

# Téléphone utilisé, par son nom dans SMSEnvoie (Xiaomi1 par défaut)
SMSENVOIE_DEVICE_NAME=Xiaomi1
# ...ou par son identifiant exact (prioritaire sur le nom), facultatif
# SMSENVOIE_DEVICE_ID=

# Carte SIM du Xiaomi1 : 0 = SIM 1, 1 = SIM 2, vide = choix automatique SMSEnvoie
SMSENVOIE_SIM_SLOT=0

# Facultatif : forcer le fournisseur (SMSENVOIE ou SMS8). SMS8 = retour immédiat à l'ancien système.
# SMS_PROVIDER=SMSENVOIE

# Facultatif : réglages de la file d'envoi
# SMSENVOIE_MIN_INTERVAL_MS=7000   # 1 requête toutes les 7 s (limite API : 10/min)
# SMSENVOIE_MAX_AGE_MINUTES=720    # un SMS non parti après 12 h est abandonné
# SMSENVOIE_TIMEOUT_MS=15000
```

Fonctionnement :
- chaque SMS est enregistré dans `sms_logs` (statut `PENDING`, fournisseur `SMSEnvoie`),
  puis la file l'envoie à SMSEnvoie, un toutes les 7 secondes au plus ;
- les commandes et assignations n'attendent plus l'API SMS ;
- si SMSEnvoie refuse temporairement (limite, réseau, clé, quota, téléphone introuvable),
  le SMS reste en attente et repart automatiquement ; au-delà de 6 tentatives ou 12 h, il passe en `FAILED` ;
- les SMS de test de l'administration sont tentés immédiatement pour afficher l'erreur éventuelle.

Retour à SMS8 : ajouter `SMS_PROVIDER=SMS8` (les SMS déjà en file SMSEnvoie partent quand même).

---

# 📱 Ancienne configuration SMS8.io (secours)

## Variables d'environnement à ajouter

### Dans le fichier `.env` (à la racine du projet backend)

Ajoutez ces lignes à votre fichier `.env` :

```env
# ========================================
# 📱 CONFIGURATION SMS8.io
# ========================================

# Clé API SMS8.io
SMS8_API_KEY=votre_cle_api_sms8

# URL API SMS8.io
SMS8_API_URL=https://app.sms8.io/services/send.php

# Nom de l'expéditeur (apparaît sur les SMS)
# Maximum 11 caractères, pas d'espaces
SMS_SENDER_NAME=GS-Pipeline

# Activation/désactivation de l'envoi automatique de SMS
# true = envoi automatique activé
# false = envoi désactivé (mode test)
SMS_ENABLED=true

# Activation des SMS par type (pour contrôle granulaire)
SMS_ORDER_CREATED=true          # SMS lors création commande
SMS_ORDER_VALIDATED=true        # SMS lors validation commande
SMS_DELIVERY_ASSIGNED=true      # SMS lors assignation livreur
SMS_ORDER_DELIVERED=true        # SMS lors livraison
SMS_EXPEDITION_CONFIRMED=true   # SMS lors expédition (100%)
SMS_EXPRESS_ARRIVED=true        # SMS lors arrivée EXPRESS en agence
SMS_EXPRESS_REMINDER=true       # SMS rappel retrait EXPRESS
SMS_RDV_SCHEDULED=true          # SMS lors programmation RDV
SMS_RDV_REMINDER=true           # SMS rappel RDV (1h avant)
SMS_DELIVERER_ALERT=true        # SMS alerte livreur
SMS_MARKETING_RELAUNCH=true     # Relances produits J+3, J+5 et J+7 après annulation

# Canal WhatsApp supplémentaire via WaSenderAPI
# Utilisez la clé API de la session WhatsApp connectée, jamais le jeton personnel.
WHATSAPP_ENABLED=true
WASENDER_API_KEY=votre_cle_api_de_session_wasender
WASENDER_API_URL=https://www.wasenderapi.com/api
WASENDER_TIMEOUT_MS=15000
WASENDER_MIN_INTERVAL_MS=5500
WASENDER_MAX_ATTEMPTS=3
WASENDER_WEBHOOK_SECRET=une_valeur_secrete_longue_et_unique

# Dans WaSenderAPI, configurez le webhook de la session avec :
# https://gs-pipeline-production.up.railway.app/api/whatsapp/wasender/status

# Relances de retrait EXPRESS à 8h30 (J+1, J+2, J+3, J+5 et J+7)
EXPRESS_REMINDER_CRON_ENABLED=true
EXPRESS_REMINDER_CRON=30 8 * * *
EXPRESS_REMINDER_CRON_TZ=Africa/Abidjan

# Le contrôle s'exécute chaque heure à la minute 15 (facultatif)
MARKETING_RELAUNCH_CRON=15 * * * *
MARKETING_RELAUNCH_CRON_TZ=Africa/Abidjan
```

## ⚠️ IMPORTANT

### Pour le développement local
Si vous voulez tester sans envoyer de SMS réels :
```env
SMS_ENABLED=false
```

### Pour la production
Activez l'envoi :
```env
SMS_ENABLED=true
```

## 🔐 Sécurité

**NE JAMAIS COMMITER** le fichier `.env` sur Git !
- Le fichier `.env` est déjà dans `.gitignore`
- Utilisez `.env.example` pour la documentation

## 📊 Crédits SMS

- Consultez vos crédits sur : https://app.sms8.io/
- Chaque SMS coûte environ 10-20 FCFA en Côte d'Ivoire
- Surveillez votre solde régulièrement via l'interface admin

## 🚀 Après Configuration

1. **Redémarrez le serveur backend**
   ```bash
   npm run dev
   ```

2. **Vérifiez les logs**
   - Les SMS envoyés apparaissent dans les logs backend
   - Consultez également la table `sms_logs` en base de données

3. **Testez l'envoi**
   - Créez une commande test
   - Vérifiez que le SMS est bien envoyé
   - Consultez l'historique dans l'interface admin

## 📝 Configuration Railway (Production)

Pour déployer en production sur Railway :

1. Allez sur Railway Dashboard
2. Sélectionnez votre projet `gs-pipeline`
3. Allez dans "Variables"
4. Ajoutez les variables SMS8 et WaSenderAPI listées ci-dessus
5. Redéployez le service

## 📞 Support SMS8.io

- Site : https://app.sms8.io/
- Email : support@sms8.io (à vérifier sur leur site)
- Documentation API : Disponible sur votre dashboard SMS8.io
