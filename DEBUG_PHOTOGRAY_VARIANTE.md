# 🔍 DEBUG - PhotoGray Variante N/A

## 🔴 Problème

La variante "Z" ne s'affiche pas, vous voyez : `Variante: N/A`

---

## 🎯 Causes possibles

### 1. Format du tag incorrect dans Google Sheet

Le script attend **exactement** ce format :
```
PhotoGray Z
```

**Vérifiez** :
- ✅ Il y a un **espace** entre "PhotoGray" et "Z"
- ✅ La variante est bien présente (Z, Y, X, M1, M2, etc.)
- ❌ PAS de caractères invisibles ou espaces multiples

### 2. Le tag n'est pas dans la bonne colonne

Le script cherche d'abord dans `orderData.tag`, puis dans `orderData.offre`.

**Vérifiez dans votre Google Sheet** :
- Quelle colonne contient "PhotoGray Z" ?
- Est-ce que c'est bien la colonne utilisée comme `tag` ?

---

## 🧪 Test de débogage

### Étape 1 : Exécuter le script de test local

```bash
node test_extraction_photogray.js
```

Ce script teste l'extraction des variantes. **Résultat attendu** :
```
1. Test : "PhotoGray Z"
   ✅ Variante extraite : "Z"

2. Test : "PhotoGray M2"
   ✅ Variante extraite : "M2"
```

Si **toutes les variantes sont extraites** → Le regex fonctionne ! ✅

---

### Étape 2 : Tester dans Google Apps Script avec logs

1. **Mettez à jour** votre Google Apps Script avec le nouveau `SCRIPT_COMPLET_AVEC_TAILLES.js`
   (J'ai ajouté des logs de débogage)

2. **Exécutez** :
   ```javascript
   testPhotoGray()
   ```

3. **Regardez les logs** (Affichage > Journaux) :
   ```
   📦 Tag reçu : "PhotoGray Z"
   🔍 [DEBUG PhotoGray] Tag original: "PhotoGray Z"
   🔍 [DEBUG PhotoGray] Match result: ["PhotoGray Z","Z"]
   ✅ [DEBUG PhotoGray] Variante extraite: "Z"
   ```

**Que chercher** :
- Le "Tag reçu" → C'est quoi le format exact ?
- Le "Match result" → Est-ce que le regex a trouvé la variante ?
- "Variante extraite" → Est-ce que "Z" (ou autre) est bien capturé ?

---

## 🔧 Solutions selon le problème

### Si le tag reçu est juste "PhotoGray" (sans variante)

**Cause** : La variante n'est pas dans votre Google Sheet

**Solution** : Ajoutez la variante dans la colonne tag :
```
PhotoGray Z    ← Format correct
```

---

### Si le tag a des espaces multiples : "PhotoGray  Z" (2 espaces)

**Cause** : Le regex cherche `\s+` (1 ou plusieurs espaces) - ça devrait marcher !

Mais vérifiez quand même dans les logs.

---

### Si le tag est "PHOTOGRAY Z" (tout en majuscules sans espace avant Z)

**Cause** : Format non reconnu

**Solution** : Changez le format dans Google Sheet :
```
PhotoGray Z    ← Format correct
PHOTOGRAY Z    ← Aussi correct
```

---

### Si le regex ne match pas du tout

**Cause** : Caractères spéciaux ou Unicode invisibles

**Solution** : Ajoutez un `trim()` dans le code (déjà fait normalement)

---

## 📋 Checklist de vérification

1. ✅ Le format dans Google Sheet est **exactement** : `PhotoGray Z`
2. ✅ Il y a bien un **espace** entre "PhotoGray" et "Z"
3. ✅ La colonne utilisée comme `tag` contient bien "PhotoGray Z"
4. ✅ Vous avez mis à jour Google Apps Script avec le nouveau code
5. ✅ Vous avez exécuté `testPhotoGray()` et vérifié les logs

---

## 🎯 Test rapide

Créez une ligne de test dans votre Google Sheet avec **exactement** ce format :

| Nom | Téléphone | Ville | Tag |
|-----|-----------|-------|-----|
| Test Z | 22507000001 | Abidjan | **PhotoGray Z** |

Puis déclenchez le script. Si ça fonctionne pour cette ligne → Le problème est le **format des autres lignes**.

---

## 📞 Si ça ne fonctionne toujours pas

**Envoyez-moi** :
1. Le format **exact** de votre tag dans Google Sheet (copier-coller)
2. Les **logs** de Google Apps Script après avoir exécuté `testPhotoGray()`
3. Le message complet avec les lignes :
   ```
   🔍 [DEBUG PhotoGray] Tag original: ...
   🔍 [DEBUG PhotoGray] Match result: ...
   ```

Et je vous dirai exactement quel est le problème ! 🎯




























