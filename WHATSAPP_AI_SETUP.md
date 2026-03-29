# Integration WhatsApp 360Messenger + Agent IA (GS Pipeline)

## 1) Variables d'environnement (Railway backend)

Ajouter ces variables dans Railway:

```env
# Provider WhatsApp
WHATSAPP_PROVIDER=360MESSENGER

# 360Messenger - Envoi de messages
WHATSAPP_360_SEND_URL=https://.../send...
WHATSAPP_360_API_KEY=xxxxxxxx
WHATSAPP_360_API_KEY_HEADER=x-api-key
WHATSAPP_360_API_KEY_PREFIX=
WHATSAPP_360_API_KEY_QUERY_PARAM=

# Mapping des champs payload d'envoi (adaptable selon doc 360)
WHATSAPP_360_TO_FIELD=number
WHATSAPP_360_MESSAGE_FIELD=message
WHATSAPP_360_TYPE_FIELD=type
WHATSAPP_360_TEXT_TYPE_VALUE=text

# Optionnel: JSON d'arguments supplementaires pour 360
WHATSAPP_360_EXTRA_PAYLOAD={"is_group":0}

# Securisation webhook entrant (optionnel mais recommande)
WHATSAPP_WEBHOOK_SECRET=un_secret_webhook_long

# Agent IA
WHATSAPP_AI_ENABLED=true
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
AI_TEMPERATURE=0.3

# Optionnel (historique status)
WHATSAPP_SYSTEM_USER_ID=1

# V2 commerciale - escalation auto si information manquante
WHATSAPP_MAX_MISSING_INFO_ATTEMPTS=2
```

### A quoi sert chaque variable 360

- `WHATSAPP_360_SEND_URL`  
  URL exacte de l'endpoint "send message" 360Messenger.

- `WHATSAPP_360_API_KEY`  
  API Key recuperee dans ton espace 360Messenger.

- `WHATSAPP_360_API_KEY_HEADER`  
  Nom du header qui transporte la cle (souvent `x-api-key` ou `Authorization`).

- `WHATSAPP_360_API_KEY_PREFIX`  
  Prefixe avant la cle (ex: `Bearer `) si la doc l'exige.

- `WHATSAPP_360_API_KEY_QUERY_PARAM`  
  Si la doc passe la cle en query string (ex: `api_key`), mets ce nom ici.

- `WHATSAPP_360_TO_FIELD` / `WHATSAPP_360_MESSAGE_FIELD`  
  Noms de champs du body pour numero et message (selon la doc).

- `WHATSAPP_360_EXTRA_PAYLOAD`  
  JSON pour ajouter des parametres fixes requis par 360.

## 2) Webhook a configurer dans 360Messenger

- **Webhook URL**: `https://gs-pipeline-production.up.railway.app/api/whatsapp/webhook`
- Si 360 permet un header secret webhook, mets le meme que `WHATSAPP_WEBHOOK_SECRET` en `x-webhook-secret`.

Le backend accepte plusieurs formats de payload webhook (Meta-like, JSON generique, format simple).

## 3) Ce que fait le bot

- Recoit les messages WhatsApp texte entrants.
- Repond automatiquement (FAQ produit, service client, SAV).
- Detecte intention de commande et collecte:
  - produit
  - quantite
  - ville
  - adresse
- Quand le client confirme, cree une commande dans GS Pipeline avec:
  - `status = VALIDEE`
  - `sourceCampagne = "WhatsApp AI Bot"`
  - `sourcePage = "WhatsApp"`

## 4) Migration base de donnees

Depuis le backend:

```bash
npx prisma migrate deploy
```

En local dev:

```bash
npx prisma migrate dev
```

## 5) Redemarrage Railway

Apres ajout des variables + deploy code:
- Redemarre le service backend Railway une fois.

## 6) Notes importantes

- Le bot gere seulement les messages texte pour le moment.
- Le client peut demander un humain en ecrivant: `agent`, `humain`, `conseiller`.
- Pour reactiver le bot: `retour bot`.
- V2 commerciale active:
  - arguments produit personnalisables,
  - objections/FAQ par produit,
  - closing intelligent,
  - escalade automatique vers humain si info manquante repetee.

## 6.1) Configurer la base connaissance commerciale (nouveau)

Routes admin (token ADMIN/GESTIONNAIRE requis):

- `GET /api/whatsapp/knowledge?search=BEE`
- `PUT /api/whatsapp/knowledge/:productId`
- `DELETE /api/whatsapp/knowledge/:productId`

Exemple payload `PUT`:

```json
{
  "keyBenefits": "Ameliore l'energie et la concentration, formule premium.",
  "usageTips": "Prendre 1 dose matin et soir apres repas.",
  "objectionHandling": [
    { "keywords": ["cher", "prix"], "answer": "Le prix inclut une formule concentree et un suivi client." },
    { "keywords": ["peur", "danger"], "answer": "Le produit est utilise selon dosage recommande, avec conseils clairs." }
  ],
  "faq": [
    { "keywords": ["livraison"], "answer": "Livraison rapide selon ta ville." },
    { "keywords": ["resultat"], "answer": "Les premiers effets varient selon la regularite d'utilisation." }
  ],
  "closingScript": "Si tu veux, je valide ta commande maintenant en 1 minute.",
  "missingInfoEscalation": "Je te passe un conseiller pour une reponse precise sur ce point."
}
```

## 7) Test rapide de bout en bout

1. Dans 360Messenger, envoie un message test entrant vers ton webhook.  
2. Verifie que la conversation apparait dans `Admin > WhatsApp Inbox`.  
3. Envoie au bot: `Je commande BEE_VENOM quantite 1 ville Abidjan`.  
4. Puis: `je confirme`.  
5. Verifie qu'une commande est creee en `VALIDEE` dans ta plateforme.

## 8) Si l'envoi ne part pas

Si les messages sortants echouent:
- corrige `WHATSAPP_360_SEND_URL`,
- ajuste `WHATSAPP_360_API_KEY_HEADER` et/ou `WHATSAPP_360_API_KEY_QUERY_PARAM`,
- ajuste `WHATSAPP_360_TO_FIELD` et `WHATSAPP_360_MESSAGE_FIELD` selon l'exemple exact de la doc/Postman.
