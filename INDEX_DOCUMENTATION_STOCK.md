# 📚 INDEX DOCUMENTATION - GESTION DE STOCK

**Date** : 20 Décembre 2024  
**Projet** : GS Pipeline  
**Version** : 1.0

---

## 🎯 INTRODUCTION

Ce document est l'**index central** de toute la documentation sur la gestion automatique du stock dans GS Pipeline.

Votre système dispose d'une **gestion de stock automatique et intelligente** qui réduit automatiquement le stock selon 3 logiques différentes :

- 🚚 **LOCAL** : Stock réduit lors de la **livraison** (0% payé avant)
- 📦 **EXPÉDITION** : Stock réduit **immédiatement** (100% payé avant)
- ⚡ **EXPRESS** : Stock **réservé** puis **libéré** (10% avant + 90% au retrait)

---

## 📖 DOCUMENTS DISPONIBLES

### 1️⃣ Guide Rapide ⚡

**Fichier** : `GUIDE_RAPIDE_GESTION_STOCK.md`

**Contenu** :
- ✅ Principe fondamental
- ✅ Tableau récapitulatif 3 types
- ✅ Cas spéciaux (corrections, refus, annulations)
- ✅ Code clés
- ✅ Exemples pratiques
- ✅ API endpoints

**Pour qui ?** : Développeurs, gestionnaires, référence rapide

**Temps de lecture** : 5-10 minutes

---

### 2️⃣ Analyse Complète 📊

**Fichier** : `ANALYSE_COMPLETE_GESTION_STOCK.md`

**Contenu** :
- ✅ Vue d'ensemble du système
- ✅ Structure base de données détaillée
- ✅ Flux complets avec code source
- ✅ Règles métier expliquées
- ✅ Cas spéciaux avec explications
- ✅ Statistiques et rapports
- ✅ Sécurité et cohérence
- ✅ Interface utilisateur

**Pour qui ?** : Développeurs, analystes, documentation technique

**Temps de lecture** : 20-30 minutes

---

### 3️⃣ Diagrammes Visuels 📈

**Fichier** : `DIAGRAMMES_GESTION_STOCK.md`

**Contenu** :
- ✅ Vue globale du système (schéma)
- ✅ Flux complets par type (diagrammes)
- ✅ Schéma base de données
- ✅ Arbre de décision
- ✅ Évolution du stock sur 1 journée
- ✅ Cas spéciaux avec diagrammes
- ✅ Tableau de bord visuel

**Pour qui ?** : Tous (visuel, facile à comprendre)

**Temps de lecture** : 15-20 minutes

---

### 4️⃣ Gestion Automatique (Existant) ✅

**Fichier** : `GESTION_AUTOMATIQUE_STOCK.md`

**Contenu** :
- ✅ Principe de fonctionnement
- ✅ Règles métier implémentées (code)
- ✅ Flux complets
- ✅ Types de mouvements
- ✅ Cas d'usage
- ✅ Maintenance et avantages

**Pour qui ?** : Développeurs, responsables projet

**Temps de lecture** : 15-20 minutes

---

## 🗺️ PARCOURS RECOMMANDÉ

### Pour les Développeurs 👨‍💻

```
1. GUIDE_RAPIDE_GESTION_STOCK.md (5 min)
   ↓
2. DIAGRAMMES_GESTION_STOCK.md (15 min)
   ↓
3. ANALYSE_COMPLETE_GESTION_STOCK.md (30 min)
   ↓
4. GESTION_AUTOMATIQUE_STOCK.md (15 min)

Total : ~1h15
```

---

### Pour les Gestionnaires 👨‍💼

```
1. DIAGRAMMES_GESTION_STOCK.md (15 min)
   ↓
2. GUIDE_RAPIDE_GESTION_STOCK.md (5 min)

Total : ~20 min
```

---

### Pour une Découverte Rapide ⚡

```
1. GUIDE_RAPIDE_GESTION_STOCK.md (5 min)
   ↓
2. Diagrammes (section "FLUX COMPLET") (5 min)

Total : ~10 min
```

---

## 🔍 RECHERCHE PAR SUJET

### Comment le stock se réduit-il ?

**Documents** :
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "3 TYPES DE LIVRAISON"
- ✅ `DIAGRAMMES_GESTION_STOCK.md` → Section "FLUX COMPLET PAR TYPE"
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "COMMENT LE STOCK SE RÉDUIT"

---

### Quelle est la différence entre LOCAL, EXPÉDITION et EXPRESS ?

**Documents** :
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "TABLEAU RÉCAPITULATIF"
- ✅ `DIAGRAMMES_GESTION_STOCK.md` → Section "3 TYPES DE LIVRAISON"
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "3 TYPES DE LIVRAISON"

---

### Comment gérer les corrections d'erreur ?

**Documents** :
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "CAS SPÉCIAUX"
- ✅ `DIAGRAMMES_GESTION_STOCK.md` → Section "CAS SPÉCIAUX - DIAGRAMMES"
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "CAS SPÉCIAUX"

---

### Où est le code source ?

**Documents** :
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Toutes les sections avec code
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "CODE CLÉS"
- ✅ `GESTION_AUTOMATIQUE_STOCK.md` → Sections avec code

**Fichiers code** :
- `routes/order.routes.js` (lignes 360-437 : LOCAL)
- `routes/order.routes.js` (lignes 1062-1127 : EXPÉDITION)
- `routes/order.routes.js` (lignes 1176-1231 : EXPRESS)
- `routes/product.routes.js` (lignes 244-306 : Ajustement manuel)
- `routes/stock.routes.js` (Gestion tournées)
- `routes/express.routes.js` (Retrait EXPRESS)

---

### Comment voir l'historique des mouvements ?

**Documents** :
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "STATISTIQUES ET RAPPORTS"
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "VÉRIFIER LE STOCK"

**API** :
```bash
GET /api/stock/movements?productId=1
```

---

### Que se passe-t-il si une commande est refusée ?

**Documents** :
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "CAS SPÉCIAUX"
- ✅ `DIAGRAMMES_GESTION_STOCK.md` → Section "Commande REFUSEE"
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "Cas 2 : Commande REFUSEE"

**Réponse courte** : **Aucun changement de stock**, car le stock n'a jamais été réduit (il ne diminue qu'au statut LIVREE).

---

### Pourquoi le stock peut être négatif ?

**Documents** :
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "SÉCURITÉ ET COHÉRENCE"
- ✅ `GESTION_AUTOMATIQUE_STOCK.md` → Section "CONFIGURATIONS"

**Réponse courte** : Pour ne pas bloquer les ventes. Le stock sera renouvelé plus tard. Des alertes automatiques sont créées si stock < seuil.

---

### Comment ajuster manuellement le stock ?

**Documents** :
- ✅ `ANALYSE_COMPLETE_GESTION_STOCK.md` → Section "GESTION MANUELLE DU STOCK"
- ✅ `GUIDE_RAPIDE_GESTION_STOCK.md` → Section "VÉRIFIER LE STOCK"

**API** :
```bash
POST /api/products/:id/stock/adjust
Body: { quantite, type, motif }
```

---

## 📊 RÉCAPITULATIF DES 3 TYPES

```
┌────────────────┬──────────────┬─────────────────┬─────────────────┐
│ Type           │ Paiement     │ Moment Réduction│ Stock Concerné  │
├────────────────┼──────────────┼─────────────────┼─────────────────┤
│ 🚚 LOCAL       │ 0% avant     │ LIVREE          │ stockActuel     │
│ 📦 EXPÉDITION  │ 100% avant   │ EXPEDITION      │ stockActuel     │
│ ⚡ EXPRESS     │ 10% + 90%    │ EXPRESS +       │ stockActuel →   │
│                │              │ EXPRESS_LIVRE   │ stockExpress    │
└────────────────┴──────────────┴─────────────────┴─────────────────┘
```

---

## 🔗 LIENS EXTERNES

### Documentation Technique

- **Prisma Schema** : `prisma/schema.prisma`
- **Routes API** : `routes/`
  - `order.routes.js` (Gestion commandes + stock)
  - `product.routes.js` (Gestion produits)
  - `stock.routes.js` (Gestion stock + tournées)
  - `express.routes.js` (Retrait EXPRESS)

### Interface Utilisateur

- **Gestion Produits** : https://afgestion.net/admin/products
- **Gestion Tournées** : https://afgestion.net/stock/tournees
- **EXPRESS En Agence** : https://afgestion.net/gestionnaire/express-en-agence

---

## 📝 NOTES IMPORTANTES

### ⚠️ RÈGLES MÉTIER CRITIQUES

1. **Le stock ne diminue QUE lors d'une sortie physique**
   - LOCAL : Au statut LIVREE
   - EXPÉDITION : Dès le statut EXPEDITION (paiement 100%)
   - EXPRESS : En 2 étapes (réservation puis retrait)

2. **Les commandes REFUSEES ne changent PAS le stock**
   - Raison : Le stock n'avait jamais été réduit

3. **Les corrections d'erreur RESTAURENT le stock**
   - Si LIVREE → RETOURNE : Stock augmente
   - Mouvement créé : RETOUR

4. **Le stock EXPRESS est distinct du stock normal**
   - Stock réservé pour les commandes EXPRESS (10% payé)
   - Libéré quand le client retire (90% payé)

5. **Stock négatif autorisé**
   - Pour ne pas bloquer les ventes
   - Alertes automatiques si stock < seuil

---

## 🎯 OBJECTIFS DE CES DOCUMENTS

✅ Comprendre comment le stock fonctionne  
✅ Savoir quand le stock se réduit  
✅ Comprendre les différences entre LOCAL, EXPÉDITION, EXPRESS  
✅ Gérer les cas spéciaux (corrections, refus, annulations)  
✅ Consulter l'historique et les mouvements  
✅ Ajuster manuellement si besoin  
✅ Développer de nouvelles fonctionnalités

---

## ✅ RÉSUMÉ

Votre système de gestion de stock est :

✅ **Automatique** : Pas d'intervention manuelle  
✅ **Intelligent** : 3 logiques selon type de livraison  
✅ **Fiable** : Transactions atomiques  
✅ **Traçable** : Historique complet  
✅ **Flexible** : Stock négatif autorisé avec alertes  
✅ **Transparent** : Interface pour consulter et ajuster

**Vous n'avez rien à faire, tout est automatique !** 🚀

---

## 📞 BESOIN D'AIDE ?

Si vous avez des questions ou besoin de clarifications :

1. Consultez d'abord ce document pour trouver le bon fichier
2. Lisez le document correspondant
3. Vérifiez les diagrammes visuels
4. Consultez le code source si besoin

---

**Date de création** : 20 Décembre 2024  
**Dernière mise à jour** : 20 Décembre 2024  
**Version** : 1.0  
**Auteur** : IA Assistant + MSI

---

**✅ DOCUMENTATION COMPLÈTE DE LA GESTION DE STOCK** 🎊
