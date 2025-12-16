# 📘 Guide PhotoGray - Produit avec variantes

## ✅ Configuration ajoutée

Le produit **PhotoGray** a été ajouté au script Google Apps Script avec gestion des variantes (Z, Y, X, etc.).

---

## 📋 Informations produit

| Élément | Valeur |
|---------|--------|
| **Code produit** | `PHOTOGRAY` |
| **Nom produit** | `LUNETTES PHOTOGRAY` |
| **Format tag** | `PhotoGray Z` (ou Y, X, M1, M2, M3, etc.) |
| **Affichage note** | `Variante: Z` ou `Variante: M2` |

---

## 🎯 Formats acceptés dans Google Sheet

Le script reconnaît tous ces formats :

```
PhotoGray Z
PhotoGray Y
PhotoGray X
PhotoGray M1
PhotoGray M2
PhotoGray M3
photogray m2
PHOTOGRAY M2
1_PhotoGray
2_PhotoGray
3_PhotoGray
```

---

## 📝 Comment les données sont envoyées

### Exemple 1 : `PhotoGray Z`

**Tag Google Sheet** :
```
PhotoGray Z
```

**Envoyé vers l'API** :
```json
{
  "nom": "Client Test",
  "telephone": "22507123456",
  "ville": "Abidjan",
  "offre": "PhotoGray",
  "tag": "PHOTOGRAY",
  "quantite": 1,
  "notes": "Variante: Z"
}
```

**Affiché dans les tournées** :
```
📝 Variante: Z
```

### Exemple 2 : `PhotoGray M2`

**Tag Google Sheet** :
```
PhotoGray M2
```

**Envoyé vers l'API** :
```json
{
  "nom": "Client Test",
  "telephone": "22507123456",
  "ville": "Abidjan",
  "offre": "LUNETTES PHOTOGRAY",
  "tag": "PHOTOGRAY",
  "quantite": 1,
  "notes": "Variante: M2"
}
```

**Affiché dans les tournées** :
```
📝 Variante: M2
```

---

## 🧪 Fonctions de test disponibles

### Tester PhotoGray uniquement

Dans Google Apps Script, exécutez :

```javascript
testPhotoGray()
```

Cela créera 6 commandes de test :
- PhotoGray Z
- PhotoGray Y  
- PhotoGray X
- PhotoGray M1
- PhotoGray M2
- PhotoGray M3

### Tester tous les produits (inclut PhotoGray)

```javascript
testTousProduits()
```

---

## 📊 Variantes supportées

Le script extrait automatiquement la lettre après "PhotoGray" :

| Tag | Code | Nom | Note gestionnaire |
|-----|------|-----|-------------------|
| `PhotoGray Z` | `PHOTOGRAY` | `LUNETTES PHOTOGRAY` | `Variante: Z` |
| `PhotoGray Y` | `PHOTOGRAY` | `LUNETTES PHOTOGRAY` | `Variante: Y` |
| `PhotoGray X` | `PHOTOGRAY` | `LUNETTES PHOTOGRAY` | `Variante: X` |
| `PhotoGray M1` | `PHOTOGRAY` | `LUNETTES PHOTOGRAY` | `Variante: M1` |
| `PhotoGray M2` | `PHOTOGRAY` | `LUNETTES PHOTOGRAY` | `Variante: M2` |
| `PhotoGray M3` | `PHOTOGRAY` | `LUNETTES PHOTOGRAY` | `Variante: M3` |

**Pattern** : `PhotoGray [LETTRE + CHIFFRES]`

---

## 🔄 Différence avec les autres produits

### Produits avec TAILLES (Boxer, Collantgaine)

```
Tag: "Boxer Taille S"
Note: "Taille: S"
```

### Produit avec VARIANTE (PhotoGray)

```
Tag: "PhotoGray Z"  
Note: "Variante: Z"
```

---

## 🚀 Déploiement

Pour activer PhotoGray en production :

1. **Copier le script dans Google Apps Script**
   - Remplacez tout le contenu avec `SCRIPT_COMPLET_AVEC_TAILLES.js`

2. **Créer le produit dans la base de données**

Exécutez ce script Node.js :

```javascript
const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function creerProduitPhotoGray() {
  // 1. Connexion
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  
  const { token } = await loginResponse.json();
  
  // 2. Créer le produit
  const createResponse = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'PHOTOGRAY',
      nom: 'LUNETTES PHOTOGRAY',
      description: 'Verres PhotoGray - Variantes: Z, Y, X, M1, M2, M3',
      prixUnitaire: 9900,   // Prix : 9900 FCFA
      stockActuel: 100,
      stockMinimum: 10,
      actif: true
    })
  });
  
  const newProduct = await createResponse.json();
  console.log('✅ Produit PhotoGray créé :', newProduct);
}

creerProduitPhotoGray();
```

3. **Tester**

```javascript
testPhotoGray()
```

---

## ✅ Vérification après déploiement

1. ✅ Le produit PHOTOGRAY existe dans la base (nom: "LUNETTES PHOTOGRAY")
2. ✅ Une commande test est créée : `testPhotoGray()`
3. ✅ Dans les tournées, la colonne **Note** affiche : `📝 Variante: Z` ou `📝 Variante: M2`
4. ✅ Le montant est calculé correctement (9900 FCFA)
5. ✅ Toutes les variantes sont supportées (Z, Y, X, M1, M2, M3)

---

## 📞 Support

Si PhotoGray n'apparaît pas correctement :

1. Vérifiez que le produit existe : `node verifier_photogray.js`
2. Vérifiez le format du tag : doit être `PhotoGray Z` ou `PhotoGray M2` (avec espace)
3. Vérifiez les logs Google Apps Script
4. Créez une commande de test : `testPhotoGray()`

---

**✨ PhotoGray est maintenant prêt à être utilisé !**




