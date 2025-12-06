# 📍 LISTE DES AGENCES DE RETRAIT EXPRESS

## 🗂️ VILLES PAR ORDRE ALPHABÉTIQUE

La liste des agences de retrait pour les commandes EXPRESS comprend **24 villes** de Côte d'Ivoire, triées par ordre alphabétique :

1. **Beoumi**
2. **Bocanda**
3. **Bonon**
4. **Bouaflé**
5. **Bouaké**
6. **Daloa**
7. **Dimbokro**
8. **Divo**
9. **Duékoué**
10. **Gabiadji**
11. **Gagnoa**
12. **Gonaté**
13. **Guibéroua**
14. **Hiré**
15. **Issia**
16. **Man**
17. **Méagui**
18. **San Pedro**
19. **Sinfra**
20. **Soubré**
21. **Tiébissou**
22. **Toumodi**
23. **Yabayo**
24. **Yamoussoukro**

---

## 🔧 FICHIER SOURCE UNIQUE

### **`frontend/src/constants/cities.ts`**

Cette liste est maintenant **centralisée** dans un seul fichier pour éviter les doublons et faciliter la maintenance :

```typescript
export const VILLES_AGENCES_EXPRESS = [
  'Beoumi',
  'Bocanda',
  'Bonon',
  'Bouaflé',
  'Bouaké',
  'Daloa',
  'Dimbokro',
  'Divo',
  'Duékoué',
  'Gabiadji',
  'Gagnoa',
  'Gonaté',
  'Guibéroua',
  'Hiré',
  'Issia',
  'Man',
  'Méagui',
  'San Pedro',
  'Sinfra',
  'Soubré',
  'Tiébissou',
  'Toumodi',
  'Yabayo',
  'Yamoussoukro',
] as const;
```

---

## 📋 OÙ CETTE LISTE EST UTILISÉE

### **1️⃣ Modal EXPRESS** (Création d'un EXPRESS)

Quand un appelant crée un EXPRESS (paiement 10%), il doit sélectionner une **agence de retrait** parmi ces 24 villes.

**Chemin** : `frontend/src/components/modals/ExpressModal.tsx`

**Interface** :
```
┌─────────────────────────────────────┐
│ Agence de retrait *                 │
│ ┌─────────────────────────────────┐ │
│ │ [v] Sélectionnez...             │ │
│ │  Beoumi                         │ │
│ │  Bocanda                        │ │
│ │  Bonon                          │ │
│ │  Bouaflé                        │ │
│ │  Bouaké                         │ │
│ │  ...                            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### **2️⃣ Filtres - Page "Expéditions & EXPRESS"**

Les filtres utilisent cette **même liste fixe** pour :

#### **Filtre par Ville client** 📍
```
📍 Ville client
┌────────────────────┐
│ [v] Toutes les villes
│  Beoumi
│  Bocanda
│  Bonon
│  ...
│  Yamoussoukro
└────────────────────┘
```

#### **Filtre par Agence de retrait** 🏢
```
🏢 Agence de retrait
┌────────────────────┐
│ [v] Toutes les agences
│  Beoumi
│  Bocanda
│  Bonon
│  ...
│  Yamoussoukro
└────────────────────┘
```

**Chemin** : `frontend/src/pages/admin/ExpeditionsExpress.tsx`

---

## 🎯 UTILISATION

### **Workflow EXPRESS**

```
1️⃣ CLIENT COMMANDE
   └─> Ville éloignée (ex: Bouaké)

2️⃣ APPELANT CRÉE EXPRESS
   ├─> Client paie 10% Mobile Money
   ├─> Sélectionne "Agence de retrait" : Bouaké ⭐
   └─> Confirme

3️⃣ COLIS EXPÉDIÉ VERS BOUAKÉ
   └─> Stock EXPRESS réservé

4️⃣ GESTIONNAIRE MARQUE ARRIVÉ
   └─> Colis arrive à l'agence de Bouaké

5️⃣ APPELANT NOTIFIE CLIENT
   └─> "Votre colis est arrivé à Bouaké"

6️⃣ CLIENT VIENT RETIRER
   └─> Paie 90% à l'agence de Bouaké
```

---

## 📊 STATISTIQUES ET FILTRES PAR AGENCE

Dans la page **"Expéditions & EXPRESS"**, vous pouvez :

✅ **Filtrer** les commandes par ville client
✅ **Filtrer** les EXPRESS par agence de retrait
✅ **Voir** le nombre d'EXPRESS par agence
✅ **Organiser** les retraits par agence

**Avantage** : Toutes les 24 villes apparaissent dans les filtres, **même sans commandes** ! Cela permet de voir clairement quelles villes n'ont pas de commandes.

---

## ⚠️ IMPORTANT

### **Liste fixe vs Liste dynamique**

#### **Avant** ❌
- Les filtres affichaient seulement les villes avec des commandes
- Si Bouaké n'avait pas de commande, Bouaké n'apparaissait pas dans les filtres
- Confusion pour les utilisateurs

#### **Maintenant** ✅
- Les filtres affichent **toutes les 24 villes**, toujours
- Même si Bouaké n'a pas de commande, Bouaké apparaît dans les filtres
- Cohérence avec le modal EXPRESS
- Clarté pour les utilisateurs

---

## 🔄 MISE À JOUR DE LA LISTE

### **Comment modifier la liste :**

1. **Ouvrir** le fichier `frontend/src/constants/cities.ts`
2. **Ajouter/Retirer** une ville dans le tableau `VILLES_AGENCES_EXPRESS`
3. **Maintenir l'ordre alphabétique** ⭐
4. **Sauvegarder** le fichier
5. Commit et push

**✅ CHANGEMENTS AUTOMATIQUES DANS :**
- Modal EXPRESS (sélection agence)
- Filtre "Ville client" (page Expéditions & EXPRESS)
- Filtre "Agence de retrait" (page Expéditions & EXPRESS)

**Exemple d'ajout** :
```typescript
export const VILLES_AGENCES_EXPRESS = [
  'Abengourou',     // ✅ Nouvelle ville ajoutée
  'Beoumi',
  'Bocanda',
  // ...
  'Yamoussoukro',
] as const;
```

---

## ⚠️ CALCUL DES FRAIS D'EXPÉDITION

Les frais d'expédition peuvent varier selon la ville de destination :

- **Villes proches** (ex: Yamoussoukro) : Frais réduits
- **Villes éloignées** (ex: San Pedro, Man) : Frais plus élevés

**Note** : Le montant affiché au client doit inclure les frais d'expédition + le prix du produit.

---

## 📱 EXEMPLE CONCRET

### **Commande EXPRESS pour Daloa**

**Détails** :
- Produit : Gaine Minceur Tourmaline (9 900 FCFA)
- Ville client : Daloa
- Agence de retrait : **Daloa** ⭐

**Paiements** :
- **10% initial** : 990 FCFA (Mobile Money)
- **90% au retrait** : 8 910 FCFA (Cash à l'agence de Daloa)

**Process** :
1. Appelant sélectionne **"Daloa"** dans la liste déroulante
2. Stock EXPRESS réservé
3. Colis expédié vers Daloa
4. Client notifié quand le colis arrive à Daloa
5. Client vient à l'agence de Daloa, paie 8 910 FCFA, récupère son colis

---

## ✅ AVANTAGES DE CETTE APPROCHE

1. ✅ **Source unique** : Un seul fichier à modifier
2. ✅ **Ordre alphabétique** : Facile à trouver une ville
3. ✅ **24 villes** : Couverture complète de la Côte d'Ivoire
4. ✅ **Cohérence** : Même liste partout (modal + filtres)
5. ✅ **Liste fixe** : Toutes les villes visibles, même sans commandes
6. ✅ **Traçabilité** : Suivi par agence facilité
7. ✅ **Type-safe** : TypeScript garantit la cohérence

---

## 📋 VÉRIFICATION

### **Pour tester la liste mise à jour :**

#### **Test 1 : Modal EXPRESS**

1. Connectez-vous en **Appelant**
2. Allez dans **"À appeler"**
3. Sélectionnez une commande
4. Cliquez **"⚡ EXPRESS"**
5. Dans le formulaire, cliquez sur **"Agence de retrait"**
6. ✅ **Vérifiez** : Vous voyez les 24 villes par ordre alphabétique

#### **Test 2 : Filtres page "Expéditions & EXPRESS"**

1. Allez dans **"Expéditions & EXPRESS"**
2. Cliquez sur **"Filtres"**
3. Regardez **"📍 Ville client"** et **"🏢 Agence de retrait"**
4. ✅ **Vérifiez** : Vous voyez les 24 villes par ordre alphabétique
5. ✅ **Vérifiez** : Toutes les villes apparaissent, même celles sans commandes

---

## 🚀 DÉPLOIEMENT

- ✅ **Fichier créé** : `frontend/src/constants/cities.ts`
- ✅ **Modal mis à jour** : `ExpressModal.tsx`
- ✅ **Filtres mis à jour** : `ExpeditionsExpress.tsx`
- ✅ **Code poussé** sur GitHub
- ⏳ **Vercel redéploie** (3 min)

---

**LISTE CENTRALISÉE ET DÉPLOYÉE ! 🚀**

**Dans 3-5 minutes, rafraîchissez et testez les filtres avec la liste fixe !**

**Tous les 24 villes apparaîtront dans les filtres, même celles sans commandes ! ✨**
