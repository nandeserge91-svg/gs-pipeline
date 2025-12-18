# 🧪 TEST SIMPLE - BEE VENOM

**Puisque le produit BEE existe déjà, testons avec lui !**

---

## ✅ ÉTAPE 1 : UTILISER LA FONCTION DE TEST BEE VENOM

Dans Google Apps Script :

1. **Enregistrez** le script (💾 ou Ctrl+S)
2. Dans le **menu déroulant** (en haut, à côté du bouton ▶️)
3. Cherchez et sélectionnez : **`testBeeVenom`**
4. Cliquez sur **▶️ Exécuter**

---

## ✅ ÉTAPE 2 : VOIR LES LOGS

1. **Affichage** (menu) → **Journaux d'exécution**
2. Vous devriez voir :

```
🧪 TEST : Bee Venom (2 boîtes)

📦 Tag reçu : "2_Bee"
📦 Code produit mappé : "BEE"
📦 Nom produit : "Bee Venom"
📦 Quantité extraite : 2
📤 Envoi vers GS Pipeline : {...}
📡 Status : 200
✅ Commande créée dans GS Pipeline avec succès !

✅ TEST RÉUSSI !
```

---

## ✅ ÉTAPE 3 : VÉRIFIER DANS GS PIPELINE

1. Allez sur : https://afgestion.net/admin/to-call
2. Vous devriez voir une commande :
   - **Client** : Test Bee Venom
   - **Produit** : Bee Venom
   - **Quantité** : 2
   - **Téléphone** : 22507 00 00 00 00
   - **Ville** : Abidjan

---

## 🆘 SI LA FONCTION N'APPARAÎT PAS

### Solution 1 : Rafraîchir la page

1. **Rechargez** la page Google Apps Script (F5)
2. Attendez 5 secondes
3. Le menu déroulant devrait afficher les fonctions

### Solution 2 : Exécuter manuellement

Ajoutez cette fonction en haut du script :

```javascript
function TEST_RAPIDE() {
  testBeeVenom();
}
```

Puis sélectionnez `TEST_RAPIDE` dans le menu.

### Solution 3 : Liste de TOUTES les fonctions disponibles

Voici toutes les fonctions de test dans le script :

1. **`testBeeVenom()`** ✅ RECOMMANDÉ (produit existe)
2. **`testGaineTourmaline()`** (nécessite produit GAINE_TOURMALINE)
3. **`testCremeAntiCerne()`** (nécessite produit CREME_ANTI_CERNE)
4. **`testTousProduits()`** (teste 4 produits)
5. **`afficherConfig()`** (affiche la configuration)
6. **`setup()`** (initialise le sheet)

### Solution 4 : Créer une fonction ultra-simple

Ajoutez ceci en haut du script :

```javascript
// TEST ULTRA-SIMPLE
function TEST() {
  Logger.log('🧪 Début du test...');
  
  var result = sendToGSPipeline({
    nom: 'Client Test Simple',
    telephone: '22507 99 88 77 66',
    ville: 'Abidjan',
    tag: '1_Bee'
  });
  
  if (result) {
    Logger.log('✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
    Logger.log('Allez vérifier sur : https://afgestion.net/admin/to-call');
  } else {
    Logger.log('❌ TEST ÉCHOUÉ');
  }
}
```

Puis exécutez `TEST()`.

---

## 🎯 ORDRE RECOMMANDÉ

### 1. D'abord : Tester avec Bee Venom (produit existant)

```
testBeeVenom()
```

### 2. Si ça marche : Créer le produit Gaine Tourmaline

1. https://afgestion.net/admin/products
2. Code : `GAINE_TOURMALINE`
3. Nom : `Gaine Tourmaline`
4. Prix : `15000`
5. Stock : `50`

### 3. Ensuite : Tester Gaine Tourmaline

```
testGaineTourmaline()
```

### 4. Enfin : Ajouter vos autres produits

Et tester chacun !

---

## 📖 VÉRIFICATION RAPIDE

### Vérifier que le script est bien enregistré

1. Regardez en haut : Y a-t-il "Enregistrement en cours..." ?
2. Si oui, attendez qu'il soit sauvegardé
3. Rafraîchissez la page (F5)

### Vérifier qu'il n'y a pas d'erreur

1. Cliquez sur **▶️ Exécuter** (n'importe quelle fonction)
2. Si erreur rouge en bas → Il y a un problème de syntaxe
3. Si aucune erreur → Le script est OK

---

## ✅ COMMENCEZ PAR ÇA

**MAINTENANT** : 

1. **Enregistrez** le script (💾)
2. **Sélectionnez** `testBeeVenom` dans le menu déroulant
3. **Cliquez** ▶️ Exécuter
4. **Regardez** les logs
5. **Vérifiez** sur https://afgestion.net/admin/to-call

**C'est tout !** 🚀











