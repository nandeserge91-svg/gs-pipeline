# 🎉 INTÉGRATION GOOGLE SHEET → GS PIPELINE RÉUSSIE !

**Date de configuration** : 12 décembre 2025

---

## ✅ STATUT : OPÉRATIONNEL

Votre Google Sheet (Bee Venom) est maintenant **connecté automatiquement** à votre application GS Pipeline !

---

## 🔄 FLUX AUTOMATIQUE ACTIF

```
┌─────────────────────────────┐
│  Formulaire Bee Venom       │
│  (Client remplit)           │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│  Google Apps Script         │
│  (doPost)                   │
└──────────────┬──────────────┘
               ↓
       ┌───────┴───────┐
       ↓               ↓
┌─────────────┐  ┌─────────────────┐
│ Google Sheet│  │  GS Pipeline    │
│ (Sauvegarde)│  │  (Webhook API)  │
└─────────────┘  └────────┬────────┘
                          ↓
                 ┌─────────────────┐
                 │ Base de données │
                 │    Railway      │
                 └────────┬────────┘
                          ↓
                 ┌─────────────────┐
                 │  Section        │
                 │  "À appeler"    │
                 │  (Statut NOUVELLE)│
                 └─────────────────┘
```

---

## 📊 CE QUI SE PASSE MAINTENANT

### Quand un client remplit le formulaire Bee Venom :

1. ✅ **Google Apps Script** reçoit les données
2. ✅ **Sauvegarde** dans votre Google Sheet (comme avant)
3. ✅ **NOUVEAU** : Envoi automatique vers GS Pipeline via webhook
4. ✅ La commande apparaît dans **"À appeler"** (statut NOUVELLE)
5. ✅ Vous pouvez la traiter directement dans l'application

### Données transmises :

- **Nom** du client
- **Téléphone** du client
- **Ville** du client
- **Offre/Tag** (produit demandé)

---

## 🌐 ACCÈS À VOTRE APPLICATION

- **Frontend** : https://afgestion.net
- **Backend** : https://gs-pipeline-production.up.railway.app
- **Section "À appeler"** : https://afgestion.net/admin/to-call

---

## 🔧 CONFIGURATION TECHNIQUE

### Webhook créé :

```
URL : https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet
Méthode : POST
Format : JSON
```

### Payload envoyé :

```json
{
  "nom": "Nom du client",
  "telephone": "+212...",
  "ville": "Casablanca",
  "offre": "Nom du produit",
  "tag": "tag optionnel"
}
```

### Réponse en cas de succès :

```json
{
  "success": true,
  "order_id": 123,
  "order_reference": "CMD-20251212-001",
  "message": "Commande ajoutée dans 'À appeler'"
}
```

---

## 🧪 TESTS DISPONIBLES

### Test depuis Google Apps Script :

1. Ouvrez votre Google Sheet
2. **Extensions** → **Apps Script**
3. Sélectionnez la fonction `testEnvoiVersGSPipeline`
4. Cliquez sur **▶️ Exécuter**
5. Vérifiez les logs et l'application

### Test réel :

1. Remplissez un formulaire Bee Venom
2. Vérifiez le Google Sheet → Ligne ajoutée ✓
3. Vérifiez GS Pipeline → Commande dans "À appeler" ✓

---

## 📋 FONCTIONS GOOGLE APPS SCRIPT

### Fonctions principales :

- **`doPost(e)`** : Reçoit les données du formulaire
- **`envoyerVersGSPipeline(data)`** : Envoie vers GS Pipeline
- **`onEdit(e)`** : Gère les annulations (colonne E = "ANNULER")
- **`testEnvoiVersGSPipeline()`** : Test manuel
- **`setup()`** : Configuration initiale

---

## 🔍 LOGS ET SUIVI

### Dans Google Apps Script :

- **Affichage** → **Journaux d'exécution**
- Vous verrez :
  ```
  📤 Envoi vers GS Pipeline : {"nom":"...","telephone":"..."}
  ✅ Réponse GS Pipeline code : 200
  🎉 Commande ajoutée dans "À appeler" avec succès !
  ```

### Dans GS Pipeline :

- Les commandes apparaissent dans **"À appeler"**
- Statut initial : **NOUVELLE**
- Vous pouvez les traiter normalement

---

## 🛡️ SÉCURITÉ

### Gestion des erreurs :

- ✅ Si le webhook échoue, le Google Sheet est quand même sauvegardé
- ✅ Les données sont validées côté backend
- ✅ Les champs obligatoires sont vérifiés (nom, téléphone, ville)

### Logs :

- ✅ Tous les envois sont loggués dans Google Apps Script
- ✅ Tous les reçus sont loggués dans Railway

---

## 🎯 MATCHING DES PRODUITS

Le webhook essaie de trouver le produit correspondant :

1. **Recherche par code** (exact)
2. **Recherche par nom** (contient, insensible à la casse)
3. **Si pas trouvé** : Crée la commande avec "Produit non spécifié"

### Exemple :

- Si `offre = "Montre Connectée Pro"` → Trouvera le produit "Montre Connectée Pro"
- Si `offre = "montre"` → Trouvera aussi "Montre Connectée Pro"
- Si `offre = "XYZ123"` et code existe → Trouvera par code

---

## 📊 STATUTS DES COMMANDES

Les commandes arrivent avec le statut **NOUVELLE** et apparaissent dans "À appeler".

Vous pouvez ensuite les traiter :
- **CONFIRMEE** : Commande confirmée
- **EN_PREPARATION** : En préparation
- **EN_LIVRAISON** : En cours de livraison
- **LIVREE** : Livrée
- **ANNULEE** : Annulée

---

## 🔄 INTÉGRATION AVEC MAKE (Optionnelle)

Votre script conserve aussi l'intégration Make pour les annulations (colonne E = "ANNULER").

Les deux webhooks coexistent :
- **GS Pipeline** : Toutes les nouvelles commandes
- **Make** : Annulations via colonne E

---

## 📈 AVANTAGES

✅ **Double sauvegarde** : Google Sheet + Base de données  
✅ **Centralisation** : Tout dans GS Pipeline  
✅ **Automatisation** : Pas de saisie manuelle  
✅ **Traçabilité** : Historique complet  
✅ **Efficacité** : Traitement immédiat  
✅ **Fiabilité** : Gestion d'erreurs intégrée  

---

## 🆘 DÉPANNAGE

### Les commandes n'arrivent pas :

1. Vérifiez les logs Google Apps Script
2. Testez avec `testEnvoiVersGSPipeline()`
3. Vérifiez que Railway est actif
4. Vérifiez l'URL du webhook dans le script

### Erreur 400 :

- Champs obligatoires manquants (nom, téléphone, ville)
- Vérifiez que le formulaire envoie bien ces champs

### Erreur 500 :

- Problème serveur Railway
- Vérifiez les logs Railway
- Vérifiez que la base de données est accessible

---

## 📞 CONTACT ET SUPPORT

Si vous rencontrez un problème :

1. Vérifiez les logs Google Apps Script
2. Vérifiez les logs Railway
3. Testez avec la fonction de test
4. Vérifiez que tous les services sont actifs

---

## 🎊 FÉLICITATIONS !

Votre système est maintenant **100% automatisé** :

- ✅ Formulaire Bee Venom
- ✅ Google Sheet (sauvegarde)
- ✅ GS Pipeline (traitement)
- ✅ Base de données Railway
- ✅ Frontend Vercel
- ✅ Domaine personnalisé (afgestion.net)

**Votre pipeline e-commerce est complet et opérationnel !** 🚀

---

**Date de mise en service** : 12 décembre 2025  
**Statut** : ✅ OPÉRATIONNEL  
**Testé et validé** : ✅ OUI












