# 🚀 TEST EXPRESS EN AGENCE - GUIDE RAPIDE

**Durée** : 3 minutes  
**Objectif** : Vérifier que toutes les commandes EXPRESS_ARRIVE sont affichées

---

## ✅ MÉTHODE 1 : Test dans le Navigateur (RECOMMANDÉ - 2 min)

### Étape 1 : Connectez-vous
1. Allez sur https://afgestion.net
2. Connectez-vous en tant qu'**ADMIN** ou **GESTIONNAIRE**

### Étape 2 : Ouvrez la Console
1. Appuyez sur **F12** (ou Clic droit > Inspecter)
2. Cliquez sur l'onglet **"Console"**

### Étape 3 : Vérification depuis "Toutes les Commandes"
1. Allez dans **"Toutes les commandes"**
2. Dans la console, collez et exécutez ce code :

```javascript
// Compter les commandes EXPRESS_ARRIVE
fetch('https://gs-pipeline-production.up.railway.app/api/orders?status=EXPRESS_ARRIVE', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 COMMANDES EXPRESS_ARRIVE DANS LA BASE');
  console.log('Total:', data.orders.length);
  console.table(data.orders.map(o => ({
    Référence: o.orderReference,
    Client: o.clientNom,
    Téléphone: o.clientTelephone,
    Produit: o.produitNom,
    Agence: o.agenceRetrait || '❌ VIDE',
    Code: o.codeExpedition || '❌ VIDE',
    'Date arrivée': o.arriveAt ? new Date(o.arriveAt).toLocaleDateString('fr-FR') : '❌ VIDE'
  })));
});
```

### Étape 4 : Vérification depuis "EXPRESS - En agence"
1. Allez dans **"EXPRESS - En agence"**
2. **Désactivez TOUS les filtres** (important !)
3. Dans la console, collez et exécutez ce code :

```javascript
// Vérifier ce qui est affiché dans la page
fetch('https://gs-pipeline-production.up.railway.app/api/express/en-agence', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 COMMANDES DANS "EXPRESS - EN AGENCE"');
  console.log('Total:', data.orders.length);
  console.log('Non retirées (EXPRESS_ARRIVE):', data.stats.nonRetires);
  console.log('Retirées (EXPRESS_LIVRE):', data.stats.retires);
  console.log('Montant en attente:', data.stats.montantEnAttente.toLocaleString('fr-FR') + ' FCFA');
  
  // Afficher détails des non retirées
  const nonRetirees = data.orders.filter(o => o.status === 'EXPRESS_ARRIVE');
  console.table(nonRetirees.map(o => ({
    Référence: o.orderReference,
    Client: o.clientNom,
    Agence: o.agenceRetrait || '❌ VIDE',
    Code: o.codeExpedition || '❌ VIDE',
    'Jours en agence': o.joursEnAgence,
    Notifications: o.nombreNotifications
  })));
});
```

### Étape 5 : Comparaison
1. Regardez les résultats dans la console
2. **Comparez** le nombre de commandes des deux requêtes
3. **Résultat attendu** :
   - ✅ Nombre de `EXPRESS_ARRIVE` dans "Toutes les commandes" = Nombre de "Non retirées" dans "EXPRESS - En agence"

---

## 🔍 MÉTHODE 2 : Test Visuel (1 min)

### Étape 1 : Comptage "Toutes les Commandes"
1. Allez dans **"Toutes les commandes"**
2. Filtre "Statut" → Sélectionnez **"EXPRESS_ARRIVE"**
3. **Notez le nombre** affiché en haut (ex: "Affichage 1-10 sur **5** commandes")

### Étape 2 : Comptage "EXPRESS - En agence"
1. Allez dans **"EXPRESS - En agence"**
2. **Désactivez TOUS les filtres** :
   - ✅ Videz le champ de recherche
   - ✅ Agence : "Toutes"
   - ✅ Statut : "Tous"
   - ✅ Décochez "Non retirés uniquement"
3. Regardez les cartes avec badge **vert "En agence"**
4. **Comptez-les** (ou regardez dans les stats en haut)

### Étape 3 : Comparaison
- ✅ **Si les nombres sont identiques** → Tout fonctionne parfaitement ! 🎉
- ❌ **Si les nombres diffèrent** → Il y a un problème (voir section suivante)

---

## 🧪 MÉTHODE 3 : Script Node.js (3 min)

### Prérequis
Vous devez récupérer votre **token d'authentification** :

1. Allez sur https://afgestion.net
2. Connectez-vous
3. Appuyez sur **F12** → Onglet **"Console"**
4. Tapez : `localStorage.getItem('token')`
5. Appuyez sur **Entrée**
6. **Copiez** le token affiché (sans les guillemets)

### Exécution
1. Ouvrez `verifier_express_api.js`
2. Ligne 21, remplacez `VOTRE_TOKEN_ICI` par votre token
3. Sauvegardez le fichier
4. Ouvrez PowerShell et exécutez :

```powershell
cd "C:\Users\MSI\Desktop\GS cursor"
node verifier_express_api.js
```

### Résultat
Le script affichera :
- ✅ Liste de toutes les commandes EXPRESS_ARRIVE
- ✅ Statistiques détaillées
- ✅ Problèmes détectés (agence manquante, code manquant, etc.)
- ✅ Recommandations

---

## 🚨 QUE FAIRE SI LES NOMBRES NE CORRESPONDENT PAS ?

### Cas 1 : Moins de commandes dans "EXPRESS - En agence"
**Causes possibles** :
- ❌ Filtres actifs → **Solution** : Désactivez tous les filtres
- ❌ Commandes avec statut `EXPRESS` (pas `EXPRESS_ARRIVE`) → **Solution** : Le livreur doit marquer arrivé

### Cas 2 : Plus de commandes dans "EXPRESS - En agence"
**Cause** : Les commandes `EXPRESS_LIVRE` (retirées) sont aussi affichées
**Solution** : Cochez le filtre "Non retirés uniquement"

### Cas 3 : Commandes affichées mais sans code
**Cause** : Le champ `codeExpedition` est vide
**Solution** : 
1. Allez dans "Toutes les commandes"
2. Cherchez la commande
3. Modifiez-la pour ajouter le code d'expédition

---

## 📊 RÉSULTATS ATTENDUS

### ✅ TOUT EST OK si :
```
Toutes les commandes :
  EXPRESS_ARRIVE = 5 commandes

EXPRESS - En agence :
  Non retirées = 5 commandes
  
✅ Les 5 commandes sont visibles avec :
   • Code d'expédition (badge bleu)
   • Agence de retrait
   • Nombre de jours en agence
   • Boutons "Notifier" et "Client a retiré"
```

### ⚠️ ATTENTION si :
```
Toutes les commandes :
  EXPRESS_ARRIVE = 8 commandes

EXPRESS - En agence :
  Non retirées = 5 commandes
  
❌ 3 commandes MANQUENT !
   
Vérifiez :
1. Les filtres sont-ils désactivés ?
2. Ces 3 commandes ont-elles bien deliveryType = 'EXPRESS' ?
3. Ces 3 commandes ont-elles bien status = 'EXPRESS_ARRIVE' ?
```

---

## 🎯 TEST DE BOUT EN BOUT (OPTIONNEL)

Si vous voulez tester le cycle complet :

### 1. Créer une commande EXPRESS
- En tant qu'**APPELANT**
- Client paie 10%
- Définir agence : "Abidjan-Plateau"

### 2. Assigner un livreur
- En tant qu'**GESTIONNAIRE**
- Assigner la commande

### 3. Marquer arrivé
- En tant qu'**LIVREUR**
- Aller dans "Mes Expéditions"
- Cliquer "Confirmer l'expédition"
- Remplir :
  - Code expédition : `TEST-12345`
  - Upload photo (optionnel)
- Confirmer

### 4. Vérifier affichage
- En tant qu'**GESTIONNAIRE**
- Aller dans "EXPRESS - En agence"
- ✅ La commande doit apparaître
- ✅ Le code `TEST-12345` doit être visible (badge bleu)

### 5. Notifier
- Cliquer "Notifier"
- ✅ Le code doit être affiché dans la modal

### 6. Confirmer retrait
- Client vient payer les 90%
- Cliquer "Client a retiré"
- ✅ La commande passe en bas de liste (grisée)
- ✅ Statut change à `EXPRESS_LIVRE`

---

## 📝 CHECKLIST FINALE

- [ ] J'ai désactivé TOUS les filtres dans "EXPRESS - En agence"
- [ ] J'ai comparé les nombres entre "Toutes les commandes" et "EXPRESS - En agence"
- [ ] Les nombres correspondent (ou j'ai identifié pourquoi)
- [ ] Toutes les commandes affichées ont un code d'expédition
- [ ] Toutes les commandes affichées ont une agence de retrait
- [ ] J'ai notifié les clients dont les colis sont arrivés
- [ ] J'ai vérifié les commandes en attente depuis > 7 jours

---

## ✅ C'EST PARTI !

**Lancez la MÉTHODE 1 maintenant** (la plus rapide) :
1. Ouvrez https://afgestion.net
2. Connectez-vous
3. Appuyez sur F12
4. Copiez-collez les codes JavaScript ci-dessus

**Résultat en 2 minutes** ! 🚀

---

**FIN DU GUIDE**

*Si vous avez des questions ou si les résultats ne correspondent pas, consultez `VERIFICATION_EXPRESS_EN_AGENCE.md` pour plus de détails.*

