# 📘 Guide Sadoer - Nouveau Produit

## ✅ Configuration ajoutée

Le produit **Sadoer** a été ajouté au script Google Apps Script.

---

## 📋 Informations produit

| Élément | Valeur |
|---------|--------|
| **Code produit** | `SADOER` |
| **Nom produit** | `Sadoer` |
| **Type** | Produit simple (pas de tailles/variantes) |

---

## 🎯 Formats acceptés dans Google Sheet

Le script reconnaît tous ces formats :

```
Sadoer
sadoer
SADOER
1_Sadoer
2_Sadoer
3_Sadoer
```

---

## 📝 Comment utiliser dans Google Sheet

### Dans votre colonne "Tag" ou "Offre"

Écrivez simplement :
```
Sadoer
```

Ou pour plusieurs quantités :
```
2_Sadoer     → 2 unités
3_Sadoer     → 3 unités
```

---

## 🚀 Déploiement

### 1. Mettre à jour Google Apps Script

1. Ouvrez votre **Google Apps Script**
2. **Remplacez tout le contenu** par `SCRIPT_COMPLET_AVEC_TAILLES.js`
3. **Enregistrez** (Ctrl + S)

---

### 2. Créer le produit dans la base de données

Dans PowerShell :

```bash
node creer_produit_sadoer.js
```

**Ce script va** :
- ✅ Créer le produit avec le code `SADOER`
- ✅ Nom : `Sadoer`
- ✅ Prix par défaut : `10000 FCFA` (à ajuster dans le script si besoin)
- ✅ Stock initial : `100 unités`

---

### 3. Ajuster le prix (si nécessaire)

Si vous voulez un autre prix, modifiez dans `creer_produit_sadoer.js` :

```javascript
prixUnitaire: 10000,  // ← Changez ce nombre
```

Par exemple :
- `prixUnitaire: 15000,` → 15000 FCFA
- `prixUnitaire: 8500,`  → 8500 FCFA

---

## 📊 Exemples d'utilisation

### Dans Google Sheet

| Nom | Téléphone | Ville | Tag |
|-----|-----------|-------|-----|
| Client 1 | 22507123456 | Abidjan | **Sadoer** |
| Client 2 | 22507234567 | Abidjan | **2_Sadoer** |

### Envoyé à l'API

```json
{
  "nom": "Client 1",
  "telephone": "22507123456",
  "ville": "Abidjan",
  "offre": "Sadoer",
  "tag": "SADOER",
  "quantite": 1
}
```

### Résultat dans la base

- ✅ **Produit trouvé** : Sadoer (code: SADOER)
- ✅ **Montant calculé** : 10000 FCFA (ou le prix que vous avez défini)
- ✅ **Quantité** : 1 ou le nombre spécifié (2_Sadoer = 2 unités)

---

## 🧪 Test

### Option 1 : Via Google Sheet

Ajoutez une ligne de test dans votre Google Sheet :

| Nom | Téléphone | Ville | Tag |
|-----|-----------|-------|-----|
| Test Sadoer | 22507999999 | Abidjan | **Sadoer** |

Puis déclenchez votre script automatique.

---

### Option 2 : Via fonction de test dans Apps Script

Ajoutez cette fonction dans votre Google Apps Script :

```javascript
function testSadoer() {
  Logger.log('🧪 TEST : Sadoer\n');
  
  const success = sendToGSPipeline({
    nom: 'Test Sadoer',
    telephone: '22507 99 99 99 99',
    ville: 'Abidjan',
    tag: 'Sadoer'
  });
  
  Logger.log(success ? '\n✅ TEST RÉUSSI !\n' : '\n❌ TEST ÉCHOUÉ\n');
  Logger.log('👉 Vérifiez sur : https://afgestion.net/appelant/orders\n');
}
```

Puis exécutez `testSadoer()`.

---

## ✅ Vérification après déploiement

1. ✅ Le produit SADOER existe dans la base (code: `SADOER`, nom: `Sadoer`)
2. ✅ Une commande test est créée
3. ✅ Le montant est calculé correctement (10000 FCFA ou votre prix)
4. ✅ La commande apparaît sur afgestion.net

---

## 📞 Support

Si Sadoer n'apparaît pas correctement :

1. Vérifiez que le produit existe : `node creer_produit_sadoer.js`
2. Vérifiez le format du tag dans Google Sheet : doit être `Sadoer` ou `2_Sadoer`
3. Vérifiez que Google Apps Script est à jour avec `SCRIPT_COMPLET_AVEC_TAILLES.js`
4. Vérifiez les logs de Google Apps Script

---

**✨ Sadoer est maintenant prêt à être utilisé !**






