# 📱 CONFIGURATION SMS8.io

## Variables d'environnement à ajouter

### Dans le fichier `.env` (à la racine du projet backend)

Ajoutez ces lignes à votre fichier `.env` :

```env
# ========================================
# 📱 CONFIGURATION SMS8.io
# ========================================

# Clé API SMS8.io
SMS8_API_KEY=6a854258b60b92bd3a87ee563ac8a375ed28a78f

# URL API SMS8.io
SMS8_API_URL=https://app.sms8.io/services/sendFront.php

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
4. Ajoutez les variables SMS8 listées ci-dessus
5. Redéployez le service

## 📞 Support SMS8.io

- Site : https://app.sms8.io/
- Email : support@sms8.io (à vérifier sur leur site)
- Documentation API : Disponible sur votre dashboard SMS8.io
