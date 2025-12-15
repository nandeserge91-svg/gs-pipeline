# 💰 Calcul Automatique des Prix par Quantité

## 🎯 Fonctionnalité

Lorsqu'une commande arrive (depuis Google Sheets ou Make), le **prix est calculé automatiquement** selon la quantité commandée et les prix variantes définis pour le produit.

---

## 📋 Logique de Calcul

### Fonction `calculatePriceByQuantity(product, quantity)`

```javascript
function calculatePriceByQuantity(product, quantity) {
  const qty = parseInt(quantity) || 1;
  
  // Si le produit a des prix variantes définis
  if (product.prix1 || product.prix2 || product.prix3) {
    if (qty === 1 && product.prix1) {
      return product.prix1; // Prix pour 1 unité
    } else if (qty === 2 && product.prix2) {
      return product.prix2; // Prix pour 2 unités
    } else if (qty >= 3 && product.prix3) {
      return product.prix3; // Prix pour 3+ unités
    }
  }
  
  // Sinon, utiliser le prix unitaire × quantité
  return product.prixUnitaire * qty;
}
```

### Priorité de Calcul

1. **Si `prix1`, `prix2` ou `prix3` définis** → utiliser les prix variantes
2. **Sinon** → utiliser `prixUnitaire × quantité`

---

## 📊 Exemples de Calcul

### Exemple 1 : BEE VENOM avec Prix Variantes

**Configuration du produit** :
```
Prix unitaire : 9900 F
Prix pour 1 : 9900 F
Prix pour 2 : 16900 F
Prix pour 3+ : 23900 F
```

**Calculs automatiques** :
| Quantité | Prix Appliqué | Montant Total |
|----------|---------------|---------------|
| 1        | `prix1`       | **9 900 F**   |
| 2        | `prix2`       | **16 900 F**  |
| 3        | `prix3`       | **23 900 F**  |
| 4        | `prix3`       | **23 900 F**  |
| 5        | `prix3`       | **23 900 F**  |

✅ **Économie pour le client** :
- 2 unités : 1900 F d'économie vs 2×9900
- 3 unités : 5800 F d'économie vs 3×9900

---

### Exemple 2 : BUTTOCK sans Prix Variantes

**Configuration du produit** :
```
Prix unitaire : 12000 F
Prix pour 1 : (vide)
Prix pour 2 : (vide)
Prix pour 3+ : (vide)
```

**Calculs automatiques** :
| Quantité | Prix Appliqué              | Montant Total |
|----------|----------------------------|---------------|
| 1        | `prixUnitaire × 1`         | **12 000 F**  |
| 2        | `prixUnitaire × 2`         | **24 000 F**  |
| 3        | `prixUnitaire × 3`         | **36 000 F**  |

✅ **Utilise le calcul standard**

---

### Exemple 3 : Produit avec Remise Seulement pour 3+

**Configuration du produit** :
```
Prix unitaire : 15000 F
Prix pour 1 : (vide)
Prix pour 2 : (vide)
Prix pour 3+ : 40000 F
```

**Calculs automatiques** :
| Quantité | Prix Appliqué              | Montant Total |
|----------|----------------------------|---------------|
| 1        | `prixUnitaire × 1`         | **15 000 F**  |
| 2        | `prixUnitaire × 2`         | **30 000 F**  |
| 3        | `prix3`                    | **40 000 F**  |
| 4        | `prix3`                    | **40 000 F**  |

✅ **Remise appliquée à partir de 3 unités**

---

## 🔧 Implémentation

### Fichiers Modifiés

1. **`routes/webhook.routes.js`**
   - Route `/make` (ligne 88-98)
   - Route `/google-sheet` (ligne 280-310)
   - Ajout fonction `calculatePriceByQuantity()`

2. **`routes/order.routes.js`**
   - Ajout fonction `calculatePriceByQuantity()` (ligne 8-23)

### Routes Impactées

#### 1. POST /api/webhook/make (Make.com)

```javascript
// Avant
const totalAmount = unitPrice * orderQuantity;

// Après
const totalAmount = calculatePriceByQuantity(product, orderQuantity);

console.log('💰 Calcul prix:', {
  quantité: orderQuantity,
  prix1: product.prix1,
  prix2: product.prix2,
  prix3: product.prix3,
  prixUnitaire: product.prixUnitaire,
  montantTotal: totalAmount
});
```

#### 2. POST /api/webhook/google-sheet (Google Sheets)

```javascript
// Avant
montant: product.prixUnitaire * orderQuantity

// Après
montant: calculatePriceByQuantity(product, orderQuantity)

console.log('💰 Calcul prix Google Sheet:', {
  quantité: orderQuantity,
  prix1: product.prix1,
  prix2: product.prix2,
  prix3: product.prix3,
  prixUnitaire: product.prixUnitaire,
  montantTotal: productData.montant
});
```

---

## 🧪 Test de la Fonctionnalité

### Scénario de Test Complet

#### Prérequis
1. **Configurer BEE VENOM** avec prix variantes :
   ```
   afgestion.net/stock/products → Modifier BEE VENOM
   Prix unitaire : 9900
   Prix pour 1 : 9900
   Prix pour 2 : 16900
   Prix pour 3+ : 23900
   ```

#### Test 1 : Commande 1 unité depuis Google Sheets

**Google Sheets** → Saisir :
```
Nom: Test Client
Téléphone: 0707080910
Ville: Abidjan
Offre: BEE
Quantité: 1
```

**Résultat attendu** :
```
✅ Commande créée dans "À appeler"
✅ Montant : 9 900 F
✅ Quantité : 1
```

**Vérification** :
```
afgestion.net/appelant → Onglet "À appeler"
→ Voir la nouvelle commande avec montant 9 900 F
```

#### Test 2 : Commande 2 unités

**Google Sheets** → Saisir :
```
Quantité: 2
```

**Résultat attendu** :
```
✅ Montant : 16 900 F (prix2)
✅ Économie : 2 900 F vs 2×9900
```

#### Test 3 : Commande 3 unités

**Google Sheets** → Saisir :
```
Quantité: 3
```

**Résultat attendu** :
```
✅ Montant : 23 900 F (prix3)
✅ Économie : 5 800 F vs 3×9900
```

#### Test 4 : Commande 5 unités

**Google Sheets** → Saisir :
```
Quantité: 5
```

**Résultat attendu** :
```
✅ Montant : 23 900 F (prix3 appliqué)
✅ Pas de multiplication, c'est le forfait 3+
```

---

## 📝 Logs de Débogage

Les logs suivants sont affichés dans les logs Railway pour vérification :

### Exemple de Log (Make)

```
💰 Calcul prix: {
  quantité: 2,
  prix1: 9900,
  prix2: 16900,
  prix3: 23900,
  prixUnitaire: 9900,
  montantTotal: 16900
}
```

### Exemple de Log (Google Sheet)

```
💰 Calcul prix Google Sheet: {
  quantité: 3,
  prix1: 9900,
  prix2: 16900,
  prix3: 23900,
  prixUnitaire: 9900,
  montantTotal: 23900
}
```

**Vérification des logs** :
```bash
# Sur Railway
railway logs --service backend --tail
```

---

## 💡 Cas d'Usage Réels

### Cas 1 : Promotion "Pack Économique"

**BEE VENOM** :
```
1 unité = 9 900 F
2 unités = 16 900 F (au lieu de 19 800 F)
3+ unités = 23 900 F (au lieu de 29 700 F ou plus)
```

**Impact** :
- Incite à acheter plus
- Meilleure marge sur volumes
- Calcul automatique sans erreur

---

### Cas 2 : Produit Standard (sans remise)

**BUTTOCK** :
```
Prix unitaire : 12 000 F
Pas de prix variantes
```

**Calcul** :
- 1 × 12 000 = 12 000 F
- 2 × 12 000 = 24 000 F
- 3 × 12 000 = 36 000 F

✅ **Calcul linéaire classique**

---

### Cas 3 : Remise Seulement pour Gros Volumes

**Écouteurs Sans Fil** :
```
Prix unitaire : 15 000 F
Prix pour 3+ : 40 000 F (remise de 5 000 F)
```

**Calcul** :
- 1 = 15 000 F
- 2 = 30 000 F (2 × 15 000)
- 3+ = 40 000 F (forfait avantageux)

✅ **Encourage l'achat en volume**

---

## 🚀 Déploiement

### Fichiers Modifiés

```
routes/webhook.routes.js
routes/order.routes.js
CALCUL_AUTOMATIQUE_PRIX_VARIANTES.md
```

### Commandes Git

```bash
cd "C:\Users\MSI\Desktop\GS cursor"

# Ajouter les fichiers
git add routes/webhook.routes.js routes/order.routes.js
git add CALCUL_AUTOMATIQUE_PRIX_VARIANTES.md

# Commit
git commit -m "feat: calcul automatique prix selon quantite

- Fonction calculatePriceByQuantity pour prix variantes
- Application dans webhook Make
- Application dans webhook Google Sheet
- Logs de debug pour verification
- Documentation complete avec exemples

Impact: prix calcule automatiquement selon quantite 1 2 ou 3+ lors reception commandes"

# Push
git push origin main
```

### Timeline

```
00:00  ✅ git push origin main
00:30  ⏳ Railway détecte le push (backend)
01:30  ⏳ Build backend
02:30  ⏳ Déploiement Railway
03:00  ✅ Calcul automatique actif !
```

**Durée** : ~3 minutes

---

## ✅ Vérification Finale

### Checklist

- [x] Fonction `calculatePriceByQuantity()` créée
- [x] Application dans webhook Make
- [x] Application dans webhook Google Sheet
- [x] Logs de debug ajoutés
- [x] Documentation complète
- [x] Exemples de calcul fournis
- [x] Tests décrits

---

## 📞 Support

### Si le Prix ne se Calcule Pas Correctement

1. **Vérifier la configuration du produit** :
   ```
   afgestion.net/stock/products → Modifier le produit
   Vérifier que prix1, prix2, prix3 sont bien renseignés
   ```

2. **Vérifier les logs Railway** :
   ```bash
   railway logs --service backend --tail
   Chercher: "💰 Calcul prix"
   ```

3. **Tester manuellement** :
   ```javascript
   Produit: {
     prix1: 9900,
     prix2: 16900,
     prix3: 23900,
     prixUnitaire: 9900
   }
   
   Quantité: 2
   → Devrait donner : 16900
   ```

4. **Vérifier la quantité envoyée** :
   ```
   Google Sheet → Colonne "Quantité"
   Doit être un nombre : 1, 2, 3, etc.
   ```

---

## ✅ Résumé

### Avant ❌
```
Commande reçue → Prix = prixUnitaire × quantité
Pas de remise automatique
Prix fixe quelque soit la quantité
```

### Maintenant ✅
```
Commande reçue → Prix calculé selon quantité
1 unité → prix1
2 unités → prix2
3+ unités → prix3
Remises automatiques appliquées
```

### Impact
- ✅ **Automatisation complète** du calcul
- ✅ **Pas d'erreur manuelle** de prix
- ✅ **Remises automatiques** pour inciter à l'achat
- ✅ **Logs** pour traçabilité
- ✅ **Fonctionnel** sur tous les canaux (Make, Google Sheets)

---

**Date** : 15 décembre 2025  
**Auteur** : Assistant IA  
**Statut** : ✅ Implémentation complète  
**Prêt pour déploiement** : Oui
