# 🗑️ Guide - Suppression Multiple des Commandes "À appeler"

## 📋 Vue d'ensemble

Cette fonctionnalité permet à l'**administrateur** de sélectionner et supprimer plusieurs commandes à la fois dans la section "À appeler".

---

## 🎯 Fonctionnalités

### ✅ Permissions

| Rôle | Accès |
|------|-------|
| **ADMIN** | ✅ Peut sélectionner et supprimer plusieurs commandes |
| **GESTIONNAIRE** | ❌ Ne peut pas supprimer |
| **APPELANT** | ❌ Ne peut pas supprimer |
| **GESTIONNAIRE_STOCK** | ❌ Ne peut pas supprimer |
| **LIVREUR** | ❌ Ne peut pas supprimer |

---

## 🖥️ Interface Utilisateur

### 1️⃣ Checkbox "Tout sélectionner"
- Située dans la barre de filtres
- Permet de sélectionner/désélectionner toutes les commandes visibles
- Visible uniquement pour les **ADMIN**

### 2️⃣ Checkbox individuelle par commande
- Située à gauche de chaque carte de commande
- Permet de sélectionner une commande spécifique
- Les commandes sélectionnées ont un fond rouge clair et une bordure rouge

### 3️⃣ Bouton de suppression
- Apparaît uniquement quand au moins 1 commande est sélectionnée
- Affiche le nombre de commandes sélectionnées : **"Supprimer (X)"**
- Couleur rouge pour indiquer l'action destructive

### 4️⃣ Compteur de sélection
- Affiche le nombre de commandes sélectionnées
- Visible en haut à droite de la page

---

## 🔄 Processus de Suppression

### Étape 1 : Sélection
```
1. Aller dans "À appeler" (menu Admin)
2. Cocher les commandes à supprimer
   OU
3. Cocher "Tout sélectionner" pour toutes les sélectionner
```

### Étape 2 : Suppression
```
1. Cliquer sur le bouton "Supprimer (X)"
2. Une modale de confirmation apparaît avec :
   - Le nombre de commandes à supprimer
   - Un avertissement sur l'irréversibilité
   - Les conséquences de l'action
```

### Étape 3 : Confirmation
```
1. Lire attentivement l'avertissement
2. Cliquer sur "Confirmer la suppression"
   OU
3. Cliquer sur "Annuler" pour revenir en arrière
```

### Étape 4 : Résultat
```
1. Un message de succès apparaît : "X commande(s) supprimée(s) avec succès"
2. Les commandes sont retirées de la liste
3. La sélection est réinitialisée
```

---

## ⚠️ Avertissements

### 🚨 Action Irréversible
```
⚠️ La suppression de commandes est DÉFINITIVE
⚠️ Les données ne peuvent PAS être récupérées
⚠️ Les relations (historique, notifications, RDV) sont également supprimées
```

### 📊 Données supprimées
Lors de la suppression d'une commande, les éléments suivants sont supprimés :
- ✅ La commande elle-même
- ✅ L'historique des changements de statut
- ✅ Les notifications EXPRESS associées
- ✅ Les RDV programmés liés

---

## 🔧 API Backend

### Endpoint
```
POST /api/orders/delete-multiple
```

### Headers
```json
{
  "Authorization": "Bearer <token_admin>",
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "orderIds": [123, 456, 789]
}
```

### Réponse Succès
```json
{
  "success": true,
  "message": "3 commande(s) supprimée(s) avec succès.",
  "deletedCount": 3,
  "details": {
    "orders": 3,
    "history": 15,
    "notifications": 2,
    "rdv": 1
  },
  "deletedReferences": ["CMD-12345", "CMD-12346", "CMD-12347"]
}
```

### Réponse Erreur
```json
{
  "success": false,
  "error": "Veuillez fournir un tableau d'IDs de commandes à supprimer."
}
```

---

## 💻 Code Frontend

### Fichiers modifiés
```
frontend/src/pages/appelant/Orders.tsx
frontend/src/lib/api.ts
```

### États React ajoutés
```typescript
const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
```

### Fonctions principales
```typescript
// Sélectionner/désélectionner une commande
handleToggleOrder(orderId: number)

// Tout sélectionner/désélectionner
handleToggleAll()

// Ouvrir la modale de confirmation
handleDeleteSelected()

// Confirmer la suppression
confirmDelete()
```

### Mutation React Query
```typescript
const deleteOrdersMutation = useMutation({
  mutationFn: (orderIds: number[]) => ordersApi.deleteMultiple(orderIds),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
    setSelectedOrderIds([]);
    setShowDeleteConfirmModal(false);
    toast.success(`✅ ${data.deletedCount} commande(s) supprimée(s) avec succès`);
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
  },
});
```

---

## 🧪 Tests Manuels

### ✅ Checklist de Test

#### Test 1 : Sélection simple
- [ ] Cocher une commande
- [ ] Le compteur affiche "1 sélectionnée(s)"
- [ ] La carte a un fond rouge et une bordure rouge
- [ ] Le bouton "Supprimer (1)" apparaît

#### Test 2 : Sélection multiple
- [ ] Cocher 3 commandes
- [ ] Le compteur affiche "3 sélectionnée(s)"
- [ ] Le bouton "Supprimer (3)" apparaît

#### Test 3 : Tout sélectionner
- [ ] Cocher "Tout sélectionner"
- [ ] Toutes les commandes sont sélectionnées
- [ ] Le compteur affiche le nombre total
- [ ] Décocher "Tout sélectionner" désélectionne tout

#### Test 4 : Suppression avec confirmation
- [ ] Sélectionner 2 commandes
- [ ] Cliquer sur "Supprimer (2)"
- [ ] La modale de confirmation apparaît
- [ ] Cliquer sur "Confirmer la suppression"
- [ ] Message de succès affiché
- [ ] Commandes supprimées de la liste

#### Test 5 : Annulation
- [ ] Sélectionner des commandes
- [ ] Cliquer sur "Supprimer"
- [ ] Cliquer sur "Annuler" dans la modale
- [ ] La modale se ferme
- [ ] Les commandes restent sélectionnées

#### Test 6 : Permissions
- [ ] Se connecter en tant que GESTIONNAIRE
- [ ] Les checkboxes ne sont PAS visibles
- [ ] Le bouton de suppression ne s'affiche PAS
- [ ] Se connecter en tant qu'ADMIN
- [ ] Les checkboxes sont visibles

---

## 📝 Logs Backend

### Exemple de logs lors de la suppression
```
🗑️  Demande de suppression de 3 commande(s)...
   IDs: [123, 456, 789]
📊 3 commande(s) trouvée(s)
📋 Commandes à supprimer :
   - CMD-12345: Jean Dupont (Bee Venom) - A_APPELER
   - CMD-12346: Marie Martin (ScarGel) - NOUVELLE
   - CMD-12347: Pierre Durand (Boxer L) - A_APPELER
   ✅ 15 entrées d'historique supprimées
   ✅ 2 notifications supprimées
   ✅ 1 RDV supprimés
   ✅ 3 commandes supprimées
✅ Suppression terminée avec succès
```

---

## 🔒 Sécurité

### Protection Backend
```javascript
// Middleware d'authentification
authenticate

// Middleware d'autorisation (ADMIN uniquement)
authorize('ADMIN')
```

### Validation
```javascript
// Validation du body
if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
  return res.status(400).json({
    error: 'Veuillez fournir un tableau d\'IDs de commandes à supprimer.'
  });
}
```

### Transaction Prisma
```javascript
// Suppression atomique (tout ou rien)
await prisma.$transaction(async (tx) => {
  await tx.statusHistory.deleteMany(...);
  await tx.expressNotification.deleteMany(...);
  await tx.rdvProgramme.deleteMany(...);
  await tx.order.deleteMany(...);
});
```

---

## 🚀 Déploiement

### Frontend (Vercel)
```bash
git add frontend/src/pages/appelant/Orders.tsx
git add frontend/src/lib/api.ts
git commit -m "feat: ajout suppression multiple commandes À appeler (admin)"
git push origin main
```

### Backend (Railway)
```bash
git add routes/delete-orders.routes.js
git commit -m "feat: ajout endpoint suppression multiple commandes"
git push origin main
```

---

## 📞 Support

En cas de problème :
1. Vérifier les permissions utilisateur (doit être ADMIN)
2. Vérifier les logs backend
3. Vérifier la console du navigateur pour les erreurs
4. Vérifier que les IDs des commandes sont valides

---

## ✨ Résumé

**Avant :**
- ❌ Impossible de supprimer plusieurs commandes à la fois
- ❌ Nécessitait de supprimer une par une

**Après :**
- ✅ Sélection multiple avec checkboxes
- ✅ Bouton "Tout sélectionner"
- ✅ Suppression en masse sécurisée
- ✅ Confirmation avant suppression
- ✅ Feedback utilisateur clair
- ✅ Réservé aux ADMIN uniquement

**🎉 Fonctionnalité opérationnelle et sécurisée !**
