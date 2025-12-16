# 👕 GUIDE : BOXER AVEC VARIANTES DE TAILLES

---

## 🎯 OBJECTIF

Ajouter un produit **Boxer** avec des variantes de tailles :
- **Tailles disponibles** : S, M, L, XL, 2XL, 3XL
- **Format reçu** : "Boxer Taille X Code Y"
  - **Boxer** = nom du produit
  - **X** = taille (S, M, L, XL, 2XL, 3XL)
  - **Y** = référence du produit

---

## 📦 COMMENT ÇA FONCTIONNE ?

### Format des commandes

Votre formulaire ou Google Sheet envoie :

```
Boxer Taille S Code ABC123
Boxer Taille M Code DEF456
Boxer Taille L Code GHI789
Boxer Taille XL Code JKL012
Boxer Taille 2XL Code MNO345
Boxer Taille 3XL Code PQR678
```

### Traitement par le script

1. **Détection** : Le script détecte que c'est un Boxer
2. **Extraction** : Il extrait la taille (S, M, L, etc.) et le code (ABC123, etc.)
3. **Mapping** : Toutes les tailles sont mappées vers un seul produit : **BOXER**
4. **Envoi** : La commande est créée avec les infos de taille et code dans les notes

### Résultat dans GS Pipeline

**Commande créée** :
- **Produit** : Boxer
- **Quantité** : 1
- **Notes** : `Taille: S | Code: ABC123`

✅ **Vous voyez la taille et le code directement dans les notes de la commande !**

---

## 🚀 INSTALLATION (10 MINUTES)

### Étape 1 : Créer le produit BOXER (3 min)

1. **Allez sur** : https://afgestion.net/admin/products
2. **Cliquez** : "+ Ajouter un produit"
3. **Remplissez** :
   - **Code** : `BOXER` (exactement, en majuscules)
   - **Nom** : `Boxer`
   - **Prix** : `15000` (exemple - ajustez selon votre prix)
   - **Stock initial** : `100` (exemple)
   - **Description** : `Boxer disponible en tailles S, M, L, XL, 2XL, 3XL`
4. **Cliquez** : "Ajouter le produit"

✅ **Le produit BOXER est créé !**

---

### Étape 2 : Installer le script (3 min)

1. **Ouvrez** votre Google Sheet
2. **Menu** : Extensions → Apps Script
3. **Supprimez** tout le code existant (Ctrl+A puis Delete)
4. **Copiez** le contenu de `SCRIPT_BOXER_AVEC_TAILLES.js` (Ctrl+A puis Ctrl+C)
5. **Collez** dans l'éditeur Apps Script (Ctrl+V)
6. **Enregistrez** : Disquette 💾 (Ctrl+S)
7. **Nommez** : "Script GS Pipeline - Boxer"

✅ **Le script est installé !**

---

### Étape 3 : Tester (4 min)

1. **Rafraîchissez** la page (F5)
2. **Menu déroulant** en haut (à côté de ▶️ Exécuter)
3. **Sélectionnez** : `testBoxer`
4. **Cliquez** : ▶️ **Exécuter**
5. **Autorisez** les permissions si demandé

**Résultat attendu** :

```
🧪 TEST : Boxer (différentes tailles)
═══════════════════════════════════════════════

1️⃣  Test Boxer Taille S...
✅ OK

2️⃣  Test Boxer Taille M...
✅ OK

3️⃣  Test Boxer Taille L...
✅ OK

4️⃣  Test Boxer Taille XL...
✅ OK

5️⃣  Test Boxer Taille 2XL...
✅ OK

6️⃣  Test Boxer Taille 3XL...
✅ OK

═══════════════════════════════════════════════
📊 Test terminé ! Vérifiez sur : https://afgestion.net/admin/to-call
```

---

### Étape 4 : Vérifier dans GS Pipeline (2 min)

1. **Allez sur** : https://afgestion.net/admin/to-call
2. **Vous devriez voir** : 6 nouvelles commandes Boxer

**Exemple de commande** :

| Champ | Valeur |
|-------|--------|
| **Référence** | CMD-XXXX |
| **Client** | Test Client Boxer S |
| **Produit** | Boxer |
| **Quantité** | 1 |
| **Notes** | `Taille: S \| Code: REF1S` |
| **Statut** | À appeler |

✅ **Cliquez sur une commande** pour voir les détails et vérifier que la taille et le code sont bien dans les notes !

---

## 📝 FORMATS SUPPORTÉS

Le script reconnaît plusieurs formats :

### Format complet (recommandé)

```
Boxer Taille S Code ABC123
Boxer Taille M Code DEF456
Boxer Taille L Code GHI789
```

### Format sans "Taille"

```
Boxer S Code ABC123
Boxer M Code DEF456
Boxer L Code GHI789
```

### Format sans "Code"

```
Boxer Taille S ABC123
Boxer Taille M DEF456
Boxer Taille L GHI789
```

Le script est **intelligent** et extrait les informations même si le format varie légèrement !

---

## 🔧 EXTRACTION DES INFORMATIONS

### Fonction `extraireInfosBoxer()`

Cette fonction analyse le tag et extrait :

1. **Taille** : Cherche "Taille S", "Taille M", etc., ou juste "S", "M", etc.
2. **Code** : Cherche "Code ABC123" ou un code alphanumérique à la fin
3. **Tag complet** : Conserve le tag original pour référence

**Exemple** :

| Tag envoyé | Taille extraite | Code extrait |
|------------|----------------|--------------|
| `Boxer Taille S Code ABC123` | S | ABC123 |
| `Boxer M DEF456` | M | DEF456 |
| `Boxer Taille XL` | XL | (aucun) |
| `Boxer Code GHI789` | (aucune) | GHI789 |

---

## 📊 UTILISATION DANS GS PIPELINE

### Voir les informations de taille et code

1. **Page "À appeler"** : https://afgestion.net/admin/to-call
2. **Cliquez** sur une commande Boxer
3. **Section "Notes"** : Vous verrez `Taille: S | Code: ABC123`

### Filtrer par taille

Vous pouvez chercher toutes les commandes d'une taille spécifique :

1. **Barre de recherche** : Tapez "Taille: S"
2. **Résultat** : Toutes les commandes Boxer taille S

### Gestion du stock

**Stock unique** : Toutes les tailles partagent le même stock du produit BOXER.

**Pourquoi ?**
- Simplifie la gestion
- Évite de créer 6 produits différents
- Les informations de taille sont dans les notes

**Si vous voulez un stock séparé par taille** :
- Créez 6 produits : BOXER_S, BOXER_M, BOXER_L, BOXER_XL, BOXER_2XL, BOXER_3XL
- Modifiez le `PRODUCT_MAPPING` pour mapper chaque taille vers son produit

---

## 🧪 AUTRES FONCTIONS DE TEST

### Test Boxer uniquement

```javascript
testBoxer()
```

→ Teste les 6 tailles de Boxer

### Test tous les produits (inclus Boxer M)

```javascript
testTousProduits()
```

→ Teste Bee Venom, Buttock, GrandTom, et Boxer M

### Test Bee Venom

```javascript
testBeeVenom()
```

→ Teste uniquement Bee Venom

---

## 🎯 EXEMPLES D'UTILISATION

### Exemple 1 : Formulaire HTML

Votre formulaire envoie :

```html
<select name="tag">
  <option value="Boxer Taille S Code S001">Boxer S - Ref S001</option>
  <option value="Boxer Taille M Code M001">Boxer M - Ref M001</option>
  <option value="Boxer Taille L Code L001">Boxer L - Ref L001</option>
  <option value="Boxer Taille XL Code XL001">Boxer XL - Ref XL001</option>
  <option value="Boxer Taille 2XL Code 2XL001">Boxer 2XL - Ref 2XL001</option>
  <option value="Boxer Taille 3XL Code 3XL001">Boxer 3XL - Ref 3XL001</option>
</select>
```

**Résultat** : Le script extrait automatiquement la taille et le code !

### Exemple 2 : Google Sheet

Votre colonne A contient :

```
Boxer Taille S Code ABC
Boxer Taille M Code DEF
Boxer Taille L Code GHI
```

**Résultat** : 3 commandes Boxer avec les tailles et codes correspondants !

---

## 🔄 WORKFLOW COMPLET

```
1. Client commande "Boxer Taille M Code REF123"
           ↓
2. Formulaire envoie à Google Sheet
           ↓
3. Script détecte "Boxer" + extrait "M" + "REF123"
           ↓
4. Script envoie à GS Pipeline :
   - Produit : BOXER
   - Notes : Taille: M | Code: REF123
           ↓
5. Commande créée dans "À appeler"
           ↓
6. Appelant voit : Boxer - Taille: M | Code: REF123
           ↓
7. Appelant appelle le client
           ↓
8. Livreur voit les notes et livre le bon Boxer !
```

✅ **Workflow complet optimisé !**

---

## 📋 CHECKLIST D'INSTALLATION

- [ ] Créer le produit BOXER dans GS Pipeline
- [ ] Copier le script `SCRIPT_BOXER_AVEC_TAILLES.js`
- [ ] Coller dans Google Apps Script
- [ ] Enregistrer le script (💾)
- [ ] Rafraîchir la page (F5)
- [ ] Exécuter `testBoxer()`
- [ ] Vérifier les 6 commandes dans "À appeler"
- [ ] Vérifier que les notes contiennent taille et code
- [ ] Tester avec votre formulaire réel

---

## 🆘 DÉPANNAGE

### Problème 1 : "Produit BOXER non trouvé"

**Cause** : Le produit BOXER n'existe pas dans GS Pipeline

**Solution** :
1. Créez le produit avec le code exact : `BOXER` (majuscules)
2. Vérifiez sur https://afgestion.net/admin/products

### Problème 2 : La taille n'est pas extraite

**Cause** : Le format du tag ne correspond pas

**Solution** :
- Vérifiez le format : doit contenir "Taille S" ou juste "S"
- Exemples OK : "Boxer Taille S", "Boxer S", "Boxer S Code ABC"

### Problème 3 : Le code n'est pas extrait

**Cause** : Le mot "Code" n'est pas présent ou le code n'est pas détecté

**Solution** :
- Ajoutez "Code" avant le code : "Boxer Taille S Code ABC123"
- Ou mettez le code à la fin : "Boxer Taille S ABC123"

---

## 🎉 RÉSULTAT FINAL

Avec ce système, vous pouvez :

✅ **Gérer facilement** les variantes de tailles du Boxer  
✅ **Voir la taille et le code** dans chaque commande  
✅ **Stock unique** simplifié (ou séparé si besoin)  
✅ **Workflow optimisé** du formulaire à la livraison  

**Votre produit Boxer avec tailles est prêt !** 🚀

---

## 📂 FICHIERS

- **`SCRIPT_BOXER_AVEC_TAILLES.js`** : Script complet à copier
- **`GUIDE_BOXER_AVEC_TAILLES.md`** : Ce guide (documentation complète)

---

**🎊 Commencez maintenant !**

1. Créez le produit BOXER
2. Copiez le script
3. Testez avec `testBoxer()`
4. Profitez de votre système de Boxer avec tailles ! 👕









