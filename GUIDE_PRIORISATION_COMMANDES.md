# 📌 GUIDE - Priorisation des Commandes
## Faire remonter une commande en haut de la liste "À appeler"

---

## 🎯 OBJECTIF

Permettre aux **Administrateurs** et **Gestionnaires** de **prioriser certaines commandes** pour les faire remonter en haut de la liste "À appeler", assurant ainsi un traitement prioritaire par les appelants.

---

## ✨ NOUVELLE FONCTIONNALITÉ

### Qui peut prioriser ?

- ✅ **ADMIN** - Peut prioriser/déprioriser n'importe quelle commande
- ✅ **GESTIONNAIRE** - Peut prioriser/déprioriser n'importe quelle commande
- ❌ **APPELANT** - Ne peut pas prioriser (mais voit les commandes priorisées en haut)
- ❌ **GESTIONNAIRE_STOCK** - Ne peut pas prioriser
- ❌ **LIVREUR** - Ne peut pas prioriser

### Quelles commandes peuvent être priorisées ?

Seules les commandes avec les statuts suivants :
- ✅ **NOUVELLE** - Nouvelle commande
- ✅ **A_APPELER** - En attente d'appel
- ✅ **INJOIGNABLE** - Client injoignable
- ✅ **RETOURNE** - Commande retournée

❌ Les commandes **VALIDEE**, **ASSIGNEE**, **LIVREE**, **EXPEDITION**, **EXPRESS** ne peuvent PAS être priorisées.

---

## 🚀 COMMENT UTILISER

### ÉTAPE 1 : Accéder à la liste des commandes

1. Connectez-vous en tant qu'**Admin** ou **Gestionnaire**
2. Allez dans **"Commandes"** (menu latéral)
3. Vous verrez toutes les commandes du système

### ÉTAPE 2 : Prioriser une commande

Pour faire remonter une commande urgente en haut de la liste "À appeler" :

1. **Trouvez la commande** que vous voulez prioriser
2. Dans la colonne **"Actions"** (dernière colonne), cliquez sur l'icône :
   - 🔼 **Flèche verte vers le haut** = Prioriser la commande

3. **Confirmez** l'action dans la popup :
   ```
   📌 Prioriser cette commande ?

   Commande: CMD-12345
   Client: Jean Dupont

   La commande remontera en haut de la liste "À appeler".
   ```

4. Cliquez **OK**

### ÉTAPE 3 : Vérifier la priorisation

✅ **Confirmation visuelle :**
- Message de succès : `📌 Commande priorisée ! Elle apparaîtra en haut de la liste "À appeler"`
- La ligne de la commande devient **verte** (fond vert clair)
- Un badge **"📌 Prioritaire"** apparaît à côté de la référence
- Une **barre verte** apparaît à gauche de la ligne

**Exemple visuel :**

```
┌───────────────────────────────────────────────────────┐
│ │ 📌 Prioritaire CMD-12345 │ Jean Dupont │ ... │ ⬇️ │ │ ← Fond vert
├───────────────────────────────────────────────────────┤
│   CMD-12346 │ Marie Konan │ ... │ ⬆️ │            │ ← Normal
└───────────────────────────────────────────────────────┘
  ↑ Barre verte à gauche
```

### ÉTAPE 4 : Retirer la priorité (optionnel)

Si vous voulez retirer la priorité d'une commande :

1. **Trouvez la commande priorisée** (fond vert + badge "Prioritaire")
2. Dans la colonne **"Actions"**, cliquez sur l'icône :
   - 🔽 **Flèche violette vers le bas** = Retirer la priorité

3. **Confirmez** l'action
4. La commande redevient normale (sans badge, sans fond vert)

---

## 👀 CE QUE VOIENT LES APPELANTS

### Liste "À appeler"

Les appelants verront automatiquement les commandes priorisées **EN HAUT** de leur liste :

```
┌────────────────────────────────────────────┐
│ Commandes à appeler (15)                   │
├────────────────────────────────────────────┤
│ 📌 Prioritaire CMD-12345 (Jean Dupont)     │ ← En haut
│ 📌 Prioritaire CMD-12346 (Marie Konan)     │ ← En haut
│ CMD-12347 (Paul Durand)                    │ ← Normal
│ CMD-12348 (Sophie Martin)                  │ ← Normal
│ ...                                         │
└────────────────────────────────────────────┘
```

**Tri automatique :**
1. **Commandes priorisées** (ordre : plus récemment priorisées en premier)
2. Puis commandes normales (ordre : plus récentes en premier)

---

## 🔧 FONCTIONNEMENT TECHNIQUE

### Backend (API)

**Nouvelle route créée :**

```http
POST /api/orders/:id/prioritize
Permissions: ADMIN, GESTIONNAIRE

Response 200:
{
  "order": { ... },
  "message": "Commande priorisée avec succès..."
}
```

**Ce qui se passe :**
1. Vérifier que la commande existe
2. Vérifier que le statut permet la priorisation
3. Mettre à jour `renvoyeAAppelerAt` = date actuelle
4. Forcer le statut à `A_APPELER` (si c'était `NOUVELLE`)
5. Créer un historique de statut
6. Retourner la commande mise à jour

**Route pour retirer la priorité :**

```http
POST /api/orders/:id/unprioritize
Permissions: ADMIN, GESTIONNAIRE

Response 200:
{
  "order": { ... },
  "message": "Priorité retirée avec succès."
}
```

### Frontend

**Nouvelles fonctions API :**

```typescript
// frontend/src/lib/api.ts
ordersApi.prioritize(orderId)
ordersApi.unprioritize(orderId)
```

**Nouveau bouton dans :**
- `frontend/src/pages/admin/Orders.tsx` (page Admin)

### Schéma de données

**Champ utilisé :**
```prisma
model Order {
  // ...
  renvoyeAAppelerAt DateTime? // Date de priorisation
  // ...
}
```

**Tri intelligent :**
```sql
ORDER BY
  renvoyeAAppelerAt DESC NULLS LAST,
  createdAt DESC
```

Cela signifie :
1. Les commandes avec `renvoyeAAppelerAt` rempli remontent en haut
2. Triées par date de priorisation (plus récentes en premier)
3. Les commandes sans `renvoyeAAppelerAt` viennent après
4. Triées par date de création

---

## 📊 CAS D'USAGE

### Cas 1 : Client VIP urgent

**Situation :**
- Un client VIP appelle le service client
- Il veut être rappelé en priorité
- Sa commande est CMD-15432

**Action :**
1. Admin ouvre "Commandes"
2. Recherche CMD-15432
3. Clique sur 🔼 (prioriser)
4. Confirme

**Résultat :**
- La commande CMD-15432 remonte EN HAUT de la liste "À appeler"
- Le prochain appelant disponible la verra en premier
- Le client sera rappelé rapidement

---

### Cas 2 : Commande avec problème à résoudre rapidement

**Situation :**
- Une commande CMD-16789 a une adresse incomplète
- Le gestionnaire veut qu'elle soit traitée en priorité
- Pour confirmer l'adresse avec le client rapidement

**Action :**
1. Gestionnaire ouvre "Commandes"
2. Recherche CMD-16789
3. Clique sur 🔼 (prioriser)
4. Confirme

**Résultat :**
- La commande remonte en haut
- Un appelant la voit rapidement
- Appelle le client pour confirmer l'adresse
- Problème résolu rapidement

---

### Cas 3 : Multiple commandes à traiter en urgence

**Situation :**
- 5 commandes doivent être traitées avant 18h
- Il est 17h30
- Besoin de les prioriser toutes

**Action :**
1. Admin/Gestionnaire ouvre "Commandes"
2. Pour chaque commande :
   - Trouve la commande
   - Clique 🔼 (prioriser)
   - Confirme

**Résultat :**
- Les 5 commandes remontent en haut
- Les appelants les traitent en priorité
- Objectif de 18h respecté

---

## 🎨 INDICATEURS VISUELS

### Dans la liste Admin/Gestionnaire

**Commande priorisée :**
```
┌─────────────────────────────────────────────────┐
│ │ 📌 Prioritaire CMD-12345 │ Jean │ ⬇️ │      │
│ │ Fond vert clair                                │
│ │ Barre verte à gauche                          │
└─────────────────────────────────────────────────┘
```

**Commande normale :**
```
┌─────────────────────────────────────────────────┐
│   CMD-12346 │ Marie │ ⬆️ │                     │
│   Fond blanc                                     │
└─────────────────────────────────────────────────┘
```

### Icônes d'action

| Icône | Signification | Couleur |
|-------|---------------|---------|
| 🔼 `ArrowUpCircle` | Prioriser (faire remonter) | Vert |
| 🔽 `ArrowDownCircle` | Retirer priorité | Violet |

---

## ⚠️ POINTS IMPORTANTS

### 1. La priorisation n'est PAS permanente

- La priorisation affecte le **tri** de la liste, pas le statut permanent
- Quand la commande est **traitée** (validée/annulée), elle quitte la liste "À appeler"
- La priorité est alors **sans effet** (la commande n'est plus dans "À appeler")

### 2. Priorisation multiple

- Vous pouvez prioriser **autant de commandes** que nécessaire
- **Ordre** : Les commandes priorisées les plus récemment remontent le plus haut
- Exemple :
  ```
  Priorisé à 10h00 : CMD-100 → Position 3
  Priorisé à 10h15 : CMD-200 → Position 2
  Priorisé à 10h30 : CMD-300 → Position 1 (en haut)
  ```

### 3. Retirer la priorité

- Si vous retirez la priorité, la commande **redescend** dans la liste normale
- Elle reprend sa position selon sa **date de création**

### 4. Historique

- Chaque priorisation est **enregistrée** dans l'historique de la commande
- Vous pouvez voir qui a priorisé et quand :
  ```
  📌 Commande priorisée par Sophie Martin - Remontée en haut de la liste
  Date : 21/12/2024 10:30
  ```

---

## 🔍 VÉRIFICATION

### Comment vérifier qu'une commande est priorisée ?

**Méthode 1 : Visuel dans la liste**
- Fond vert
- Badge "📌 Prioritaire"
- Barre verte à gauche

**Méthode 2 : Position dans la liste**
- Ouvrir la page "À appeler" (en tant qu'appelant)
- La commande doit être **en haut**

**Méthode 3 : Historique de la commande**
- Cliquer sur la commande → Voir détails
- Onglet "Historique"
- Vérifier l'entrée "📌 Commande priorisée..."

---

## 📱 NOTIFICATIONS

Actuellement, il n'y a **pas de notification automatique** aux appelants quand une commande est priorisée.

**Les appelants voient simplement :**
- La commande en haut de leur liste
- Avec le badge "📌 Prioritaire"

**Amélioration future possible :**
- Notification push/toast : "Une nouvelle commande prioritaire est disponible"
- Badge de compteur : "3 commandes prioritaires"

---

## 🚀 DÉPLOIEMENT

### Backend (Railway)

**Fichiers modifiés :**
```
routes/order.routes.js
  → +70 lignes (2 nouvelles routes)
```

**Redéploiement :**
```bash
git add routes/order.routes.js
git commit -m "feat: Ajout priorisation commandes"
git push origin main
```

Railway redéploie automatiquement.

### Frontend (Vercel)

**Fichiers modifiés :**
```
frontend/src/lib/api.ts
  → +10 lignes (2 nouvelles fonctions)

frontend/src/pages/admin/Orders.tsx
  → +50 lignes (mutations + boutons + indicateurs visuels)
```

**Redéploiement :**
```bash
cd frontend
git add src/lib/api.ts src/pages/admin/Orders.tsx
git commit -m "feat: Interface priorisation commandes"
git push origin main
```

Vercel redéploie automatiquement.

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [x] Backend : Route POST /api/orders/:id/prioritize créée
- [x] Backend : Route POST /api/orders/:id/unprioritize créée
- [x] Backend : Permissions ADMIN + GESTIONNAIRE configurées
- [x] Backend : Historique de priorisation enregistré
- [x] Frontend : Fonction ordersApi.prioritize() créée
- [x] Frontend : Fonction ordersApi.unprioritize() créée
- [x] Frontend : Boutons prioriser/déprioriser ajoutés
- [x] Frontend : Mutations React Query créées
- [x] Frontend : Indicateurs visuels (fond vert, badge, barre)
- [x] Documentation : Guide utilisateur créé
- [ ] Test : Prioriser une commande
- [ ] Test : Vérifier qu'elle remonte en haut
- [ ] Test : Retirer la priorité
- [ ] Test : Vérifier les permissions (Admin/Gestionnaire only)

---

## 🎯 RÉSUMÉ

**AVANT :**
- Les commandes "À appeler" étaient triées par date de création
- Pas de moyen de faire remonter une commande urgente

**APRÈS :**
- ✅ Admin/Gestionnaire peut **prioriser** n'importe quelle commande
- ✅ Les commandes priorisées remontent **automatiquement en haut**
- ✅ Indicateurs visuels clairs (fond vert, badge)
- ✅ Possibilité de **retirer la priorité**
- ✅ Historique complet de toutes les priorisations

**BÉNÉFICES :**
- ⚡ Traitement plus rapide des commandes urgentes
- 🎯 Meilleure gestion des priorités
- 👥 Satisfaction client améliorée
- 📊 Traçabilité complète

---

**FONCTIONNALITÉ PRÊTE À L'EMPLOI ! 📌🚀**

*Document créé le 21 décembre 2024*

