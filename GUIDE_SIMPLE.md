# ✅ GUIDE SIMPLE : 1 SHEET → "À APPELER"

**Configuration simple pour envoyer vos commandes vers "À appeler"**

---

## 🎯 CONFIGURATION

| Élément | Valeur |
|---------|--------|
| **Google Sheet ID** | `1bUXXpKbXNC2cj_x98HZFKOjknWECkauxjRGxUE4UmRc` |
| **Feuille** | `Bureau11` |
| **Formulaire envoie** | `GrandTom` |
| **Code produit** | `GRANDTOM` |

---

## 🚀 INSTALLATION (2 MINUTES)

### 1. Copier le script

1. **Ouvrez** : `SCRIPT_SIMPLE_GRANDTOM.js`
2. **Copiez TOUT** (Ctrl+A puis Ctrl+C)
3. **Google Sheet** → **Extensions** → **Apps Script**
4. **Supprimez** tout le code actuel
5. **Collez** le nouveau code
6. **Enregistrez** (💾)

### 2. Tester

1. **Rafraîchissez** la page (F5)
2. **Menu déroulant** → **`testGrandTom`**
3. **Exécutez** (▶️)
4. **Vérifiez** : https://afgestion.net/admin/to-call

---

## 📦 PRODUITS SUPPORTÉS

- ✅ **Bee Venom** (BEE)
- ✅ **Buttock** (BUTTOCK)
- ✅ **GrandTom** (GRANDTOM)
- ✅ **Gaine Tourmaline** (GAINE_TOURMALINE)
- ✅ **Crème Anti-Cerne** (CREME_ANTI_CERNE)
- ✅ **Patch Anti-Cicatrice** (PATCH_ANTI_CICATRICE)
- ✅ **Pack Détox** (PACK_DETOX)
- ✅ **Chaussettes Chauffantes** (CHAUSSETTE_CHAUFFANTE)

---

## ➕ AJOUTER UN NOUVEAU PRODUIT

### 1. Dans PRODUCT_MAPPING (ligne ~40) :

```javascript
// Votre nouveau produit
'VotreProduit': 'VOTRE_PRODUIT',
'1_VotreProduit': 'VOTRE_PRODUIT',
```

### 2. Dans PRODUCT_NAMES (ligne ~78) :

```javascript
'VOTRE_PRODUIT': 'Votre Produit',
```

### 3. Créer le produit dans GS Pipeline

- Code : `VOTRE_PRODUIT`
- Nom : Votre Produit

---

## 📞 FONCTIONS DISPONIBLES

| Fonction | Description |
|----------|-------------|
| `testGrandTom()` | Tester GrandTom |
| `testBeeVenom()` | Tester Bee Venom |
| `afficherConfig()` | Voir la configuration |
| `setup()` | Initialiser la feuille |

---

## 🎊 C'EST TOUT !

✅ **Script simple et propre**  
✅ **1 feuille, pas de complications**  
✅ **Facile à modifier**  
✅ **Prêt à utiliser**  

**Bon travail !** 🚀



















