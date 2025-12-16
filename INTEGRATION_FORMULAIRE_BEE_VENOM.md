# 🐝 INTÉGRATION FORMULAIRE BEE VENOM → GS PIPELINE

**Date** : 12 décembre 2025  
**Statut** : ✅ Configuration prête

---

## 🎯 OBJECTIF

Faire en sorte que **chaque commande** du formulaire Bee Venom apparaisse **automatiquement** dans la section "À appeler" de GS Pipeline.

---

## 🔄 NOUVEAU FLUX (DOUBLE ENVOI)

```
┌─────────────────────────┐
│  Client remplit le      │
│  formulaire Bee Venom   │
└───────────┬─────────────┘
            ↓
┌───────────────────────────┐
│  JavaScript du formulaire │
└───────┬───────────────────┘
        ↓
    ┌───┴────────────────┐
    ↓                    ↓
┌──────────────┐  ┌─────────────────┐
│ Google Apps  │  │  GS Pipeline    │
│ Script       │  │  (DIRECT)       │
│ (Google      │  │  ✨ NOUVEAU     │
│  Sheet)      │  └────────┬────────┘
└──────────────┘           ↓
                  ┌─────────────────┐
                  │  "À appeler"    │
                  │  (afgestion.net)│
                  └─────────────────┘
```

### ✅ Avantages du double envoi :

- ✅ **Sécurité maximale** : Si un envoi échoue, l'autre réussit
- ✅ **Sauvegarde Google Sheet** : Conservation de l'historique
- ✅ **Traitement immédiat** : Apparition dans GS Pipeline en temps réel
- ✅ **Pas de dépendance** : Fonctionne même si Google Apps Script a un problème

---

## 📝 MODIFICATIONS APPORTÉES

### Dans la fonction `bvSubmit()` :

```javascript
// 🚀 NOUVEAU : ENVOI DIRECT VERS GS PIPELINE
fetch("https://gs-pipeline-production.up.railway.app/api/webhook/google-sheet", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    nom: nom,
    telephone: finalTel,
    ville: ville,
    offre: offreNom,  // "Bee Venom 1 boîte"
    tag: tag          // "1_Bee"
  })
})
.then(response => response.json())
.then(data => {
  console.log("✅ Commande envoyée vers GS Pipeline:", data);
})
.catch(error => {
  console.error("⚠️ Erreur envoi (mais continue):", error);
});
```

### Mapping des offres :

| Sélection formulaire | Tag | Nom produit |
|---------------------|-----|-------------|
| 1 boîte – 9 900 CFA | 1_Bee | Bee Venom 1 boîte |
| 2 boîtes – 16 900 CFA | 2_Bee | Bee Venom 2 boîtes |
| 3 boîtes – 23 900 CFA | 3_Bee | Bee Venom 3 boîtes |

### Format du téléphone :

- **Entrée** : `07 00 00 00 00` (10 chiffres)
- **Envoyé** : `22507 00 00 00 00` (préfixe Côte d'Ivoire ajouté)

---

## 🚀 INSTALLATION

### Étape 1 : Remplacer le code du formulaire

1. Ouvrez votre page contenant le formulaire Bee Venom
2. **Remplacez** tout le code du formulaire (depuis `<div id="popup-bv"` jusqu'au `</script>` final)
3. Par le code du fichier : **`FORMULAIRE_BEE_VENOM_MODIFIE.html`**

### Étape 2 : Tester

1. Ouvrez votre page
2. Remplissez le formulaire Bee Venom
3. Soumettez

### Étape 3 : Vérifier

1. **Allez sur** : https://afgestion.net/admin/to-call
2. **La commande apparaît** immédiatement ! ✅

---

## 🧪 TEST

### Test rapide :

```
Nom : Test Bee Venom
Téléphone : 07 12 34 56 78
Ville : Abidjan
Offre : 2 boîtes (Recommandée)
```

**Résultat attendu** :
- ✅ Redirection vers page de remerciement
- ✅ Commande dans Google Sheet
- ✅ Commande dans GS Pipeline → "À appeler"

### Logs de debug :

Ouvrez la **Console du navigateur** (F12) et cherchez :

```
✅ Commande envoyée vers GS Pipeline: {
  success: true,
  order_id: 123,
  order_reference: "CMD-20251212-XXX"
}
```

---

## 📊 DONNÉES TRANSMISES

Le formulaire envoie ces données vers GS Pipeline :

```json
{
  "nom": "Nom du client",
  "telephone": "+225 07 12 34 56 78",
  "ville": "Abidjan",
  "offre": "Bee Venom 2 boîtes",
  "tag": "2_Bee"
}
```

Le backend GS Pipeline :
1. Reçoit les données
2. Cherche un produit correspondant (par tag ou nom)
3. Crée une commande avec statut **NOUVELLE**
4. La commande apparaît dans "À appeler"

---

## 🔍 MATCHING DES PRODUITS

Le backend essaie de trouver le produit Bee Venom dans votre catalogue :

### Option 1 : Produits déjà créés

Si vous avez déjà créé les produits dans GS Pipeline :
- Code : `1_Bee`, `2_Bee`, `3_Bee`
- Nom : `Bee Venom 1 boîte`, `Bee Venom 2 boîtes`, etc.

→ Le backend les trouvera automatiquement ✅

### Option 2 : Produits non créés

Si les produits n'existent pas encore :
- La commande est quand même créée
- Produit : "Bee Venom 1 boîte" (nom seulement)
- Montant : 0 CFA (à définir manuellement)

→ **Recommandation** : Créez les 3 produits Bee Venom dans GS Pipeline !

---

## 📦 CRÉER LES PRODUITS BEE VENOM

Pour que les prix soient automatiquement renseignés :

1. **Allez sur** : https://afgestion.net/admin/products
2. **Cliquez** : "Ajouter un produit"
3. **Créez 3 produits** :

| Code | Nom | Prix | Stock |
|------|-----|------|-------|
| 1_Bee | Bee Venom 1 boîte | 9900 | 100 |
| 2_Bee | Bee Venom 2 boîtes | 16900 | 100 |
| 3_Bee | Bee Venom 3 boîtes | 23900 | 100 |

**Maintenant les commandes auront automatiquement le bon prix !** 🎯

---

## 🛡️ GESTION DES ERREURS

Le formulaire gère les erreurs de manière transparente :

```javascript
.catch(error => {
  console.error("⚠️ Erreur envoi (mais continue):", error);
});
```

**Même si l'envoi vers GS Pipeline échoue** :
- ✅ Le formulaire continue
- ✅ L'envoi vers Google Apps Script fonctionne
- ✅ Le client est redirigé normalement

**Résilience maximale !** 💪

---

## 🔄 CONSERVATION DE L'ANCIEN SYSTÈME

Le code conserve **100% de l'ancien fonctionnement** :

```javascript
// 📊 ANCIEN : ENVOI VERS GOOGLE APPS SCRIPT (CONSERVÉ)
let url = "https://script.google.com/macros/s/AKfycbyd-...";
fetch(url, { mode: "no-cors", ... });
```

**Aucun risque de casser l'existant !** ✅

---

## 📱 COMPATIBILITÉ

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Mobile, Firefox Mobile)
- ✅ Tablettes
- ✅ Tous les navigateurs modernes

---

## 🎨 INTERFACE INCHANGÉE

L'apparence et le comportement du formulaire restent **exactement identiques** :
- ✅ Même design
- ✅ Même validation
- ✅ Même redirection
- ✅ Même expérience utilisateur

**Seul changement** : Un envoi API supplémentaire (invisible pour l'utilisateur) ✨

---

## 📊 STATISTIQUES

Après intégration, vous pourrez voir dans GS Pipeline :
- 📊 Nombre de commandes Bee Venom
- 💰 Chiffre d'affaires par offre (1/2/3 boîtes)
- 📈 Évolution des ventes
- 🗺️ Répartition par ville

---

## 🆘 DÉPANNAGE

### Les commandes n'apparaissent pas dans "À appeler"

**Solution** :
1. Ouvrez la **Console** du navigateur (F12)
2. Soumettez le formulaire
3. Cherchez les messages :
   - ✅ "Commande envoyée vers GS Pipeline" → OK
   - ❌ Erreur 404/500 → Vérifiez que Railway est actif

### Erreur CORS

**Solution** : Les CORS sont déjà configurés pour accepter tous les domaines

### Produit introuvable

**Solution** : Créez les 3 produits Bee Venom dans GS Pipeline (voir section ci-dessus)

---

## ✅ CHECKLIST D'INSTALLATION

- [ ] Remplacer le code du formulaire
- [ ] Tester avec une commande de test
- [ ] Vérifier dans "À appeler"
- [ ] (Optionnel) Créer les 3 produits Bee Venom
- [ ] Tester une commande réelle
- [ ] Vérifier que les prix sont corrects

---

## 🎊 RÉSULTAT FINAL

Une fois installé :

1. **Client** remplit le formulaire Bee Venom
2. **Envoi simultané** vers Google Sheet + GS Pipeline
3. **Commande créée** automatiquement dans "À appeler"
4. **Vous traitez** la commande directement dans l'app
5. **Suivi complet** du statut jusqu'à livraison

**Pipeline e-commerce 100% automatisé !** 🚀

---

**Fichier créé** : `FORMULAIRE_BEE_VENOM_MODIFIE.html`  
**À remplacer dans** : Votre page de vente Bee Venom  
**Temps d'installation** : 2 minutes  
**Impact** : ⚡ Automatisation instantanée









