# 📘 Guide Culotte - Produit avec tailles et codes

## ✅ Configuration ajoutée

Le produit **Culotte** a été ajouté au script Google Apps Script avec support des tailles et codes (comme Boxer).

---

## 📋 Informations produit

| Élément | Valeur |
|---------|--------|
| **Code produit** | `CULOTTE` |
| **Nom produit** | `Culotte` |
| **Tailles supportées** | S, M, L, XL, 2XL, 3XL |
| **Code optionnel** | Oui (alphanumérique) |

---

## 🎯 Formats acceptés dans Google Sheet

### Format 1 : Taille uniquement

```
Culotte Taille S
Culotte Taille M
Culotte Taille L
Culotte Taille XL
Culotte Taille 2XL
Culotte Taille 3XL
```

### Format 2 : Taille + Code

```
Culotte Taille S Code ABC123
Culotte Taille M Code XYZ789
Culotte S Code DEF456
```

### Format 3 : Court (sans "Taille")

```
Culotte S
Culotte M
Culotte L
```

### Tous les formats reconnus :

```
Culotte Taille S
culotte taille s
CULOTTE TAILLE S
Culotte S
culotte s
Culotte Taille M Code ABC123
Culotte M ABC123
```

---

## 📝 Comment les données sont envoyées

### Exemple 1 : Culotte avec taille uniquement

**Tag Google Sheet** :
```
Culotte Taille S
```

**Envoyé vers l'API** :
```json
{
  "nom": "Client Test",
  "telephone": "22507123456",
  "ville": "Abidjan",
  "offre": "Culotte",
  "tag": "CULOTTE",
  "quantite": 1,
  "notes": "Taille: S"
}
```

**Affiché dans les tournées** :
```
📝 Taille: S
```

---

### Exemple 2 : Culotte avec taille + code

**Tag Google Sheet** :
```
Culotte Taille M Code ABC123
```

**Envoyé vers l'API** :
```json
{
  "nom": "Client Test",
  "telephone": "22507123456",
  "ville": "Abidjan",
  "offre": "Culotte",
  "tag": "CULOTTE",
  "quantite": 1,
  "notes": "Taille: M | Code: ABC123"
}
```

**Affiché dans les tournées** :
```
📝 Taille: M | Code: ABC123
```

---

## 🚀 Déploiement

### 1. Mettre à jour Google Apps Script

1. Ouvrez votre **Google Apps Script**
2. **Remplacez tout le contenu** par `SCRIPT_COMPLET_AVEC_TAILLES.js`
3. **Enregistrez** (Ctrl + S)

---

### 2. Créer le produit dans la base de données

Dans **PowerShell** :

```bash
node creer_produit_culotte.js
```

**Ce script va créer** :
- ✅ Code : `CULOTTE`
- ✅ Nom : `Culotte`
- ✅ Prix : `10000 FCFA` (modifiable)
- ✅ Stock : `100 unités`

---

### 3. Ajuster le prix (si nécessaire)

Si vous voulez un autre prix, modifiez dans `creer_produit_culotte.js` :

```javascript
prixUnitaire: 10000,  // ← Changez ce nombre
```

---

## 🧪 Test

### Fonction de test dans Apps Script

Ajoutez cette fonction dans votre Google Apps Script :

```javascript
function testCulotte() {
  Logger.log('🧪 TEST : Culotte (différentes tailles)\n');
  Logger.log('═══════════════════════════════════════════════\n');
  
  const tailles = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  
  tailles.forEach(function(taille, index) {
    Logger.log(`${index + 1}️⃣  Test Culotte Taille ${taille}...\n`);
    
    const tag = `Culotte Taille ${taille}`;
    
    const success = sendToGSPipeline({
      nom: `Test Client Culotte ${taille}`,
      telephone: `22507 ${String(20 + index).padStart(2, '0')} 11 22 33`,
      ville: 'Abidjan',
      tag: tag
    });
    
    Logger.log(success ? '✅ OK\n' : '❌ ÉCHOUÉ\n');
    
    Utilities.sleep(1000);
  });
  
  Logger.log('═══════════════════════════════════════════════\n');
  Logger.log('📊 Test terminé ! Vérifiez sur : https://afgestion.net/appelant/orders\n');
}
```

Puis exécutez `testCulotte()`.

---

## 📊 Exemples d'utilisation

### Dans Google Sheet

| Nom | Téléphone | Ville | Tag |
|-----|-----------|-------|-----|
| Alice | 22507111111 | Abidjan | **Culotte Taille S** |
| Bob | 22507222222 | Yamoussoukro | **Culotte Taille M Code ABC123** |
| Claire | 22507333333 | Bouaké | **Culotte L** |

### Résultat dans la base

**Commande 1** :
- Produit : Culotte
- Taille : S
- Code : -
- Note : `Taille: S`
- Montant : 10000 FCFA

**Commande 2** :
- Produit : Culotte
- Taille : M
- Code : ABC123
- Note : `Taille: M | Code: ABC123`
- Montant : 10000 FCFA

**Commande 3** :
- Produit : Culotte
- Taille : L
- Code : -
- Note : `Taille: L`
- Montant : 10000 FCFA

---

## 📊 Tailles supportées

| Taille | Format accepté |
|--------|----------------|
| **S** | `Culotte S`, `Culotte Taille S`, `culotte s` |
| **M** | `Culotte M`, `Culotte Taille M`, `culotte m` |
| **L** | `Culotte L`, `Culotte Taille L`, `culotte l` |
| **XL** | `Culotte XL`, `Culotte Taille XL`, `culotte xl` |
| **2XL** | `Culotte 2XL`, `Culotte Taille 2XL`, `culotte 2xl` |
| **3XL** | `Culotte 3XL`, `Culotte Taille 3XL`, `culotte 3xl` |

---

## 🔄 Différence avec les autres produits

### Produits SIMPLES (Sadoer, ScarGel, etc.)

```
Tag: "Sadoer"
Note: -
```

### Produits avec TAILLES (Culotte, Boxer)

```
Tag: "Culotte Taille S"
Note: "Taille: S"
```

### Produits avec TAILLES + CODE (Culotte, Boxer)

```
Tag: "Culotte Taille M Code ABC123"
Note: "Taille: M | Code: ABC123"
```

### Produits avec VARIANTES (PhotoGray)

```
Tag: "PhotoGray Z"
Note: "Variante: Z"
```

---

## ✅ Vérification après déploiement

1. ✅ Le produit CULOTTE existe dans la base (code: `CULOTTE`, nom: `Culotte`)
2. ✅ Une commande test est créée : `testCulotte()`
3. ✅ Dans les tournées, la colonne **Note** affiche : `📝 Taille: S` ou `📝 Taille: M | Code: ABC123`
4. ✅ Le montant est calculé correctement (10000 FCFA ou votre prix)
5. ✅ Toutes les tailles sont supportées (S, M, L, XL, 2XL, 3XL)

---

## 📞 Support

Si Culotte n'apparaît pas correctement :

1. Vérifiez que le produit existe : `node creer_produit_culotte.js`
2. Vérifiez le format du tag : doit être `Culotte Taille S` ou `Culotte S`
3. Vérifiez les logs Google Apps Script
4. Créez une commande de test : `testCulotte()`

---

**✨ Culotte est maintenant prêt à être utilisé !**




























