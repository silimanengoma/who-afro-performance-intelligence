# Automatisations et notifications

## État actuel (prototype)

Douze déclencheurs sont implémentés et **simulés** : ils créent des entrées dans
le centre de notifications (`notifications`, `simulated=true`) et le fil
d'activité — **aucun message réel n'est envoyé**.

| # | Déclencheur | Template | Implémenté dans |
|---|---|---|---|
| 1 | Demande d'accès reçue | `access_requested` | `AccesProfessionnel.tsx` |
| 2 | Accès approuvé | `access_approved` | `AccessRequests.tsx` |
| 3 | Bienvenue professionnelle | `access_approved` (corps bienvenue) | idem |
| 4 | Consultation sans sélection (relance) | `showroom_no_selection` | à raccorder : requête planifiée (voir ci-dessous) |
| 5 | Sélection abandonnée (relance) | `selection_abandoned` | indicateur calculé dans `Stats.tsx` ; envoi à raccorder |
| 6 | Demande de devis | `quote_requested` | `QuoteNew.tsx` |
| 7 | Devis disponible | `quote_sent` | `QuotesAdmin.tsx` |
| 8 | Rappel avant expiration du devis | `quote_expiring` | à raccorder : requête planifiée |
| 9 | Confirmation d'acceptation | `quote_accepted` | `Quotes.tsx` (buyer) |
| 10 | Confirmation de commande | `order_created` | acceptation du devis |
| 11 | Notification d'expédition | `order_shipped` | `OrdersAdmin.tsx` |
| 12 | Demande de retour d'expérience | `feedback_request` | à raccorder après `delivered` |

## Raccordement futur (production)

1. **E-mail** : fournisseur transactionnel (Resend, Brevo…). Créer une Edge
   Function Supabase `send-notification` déclenchée par un webhook sur
   `notifications` (insert) ; passer `simulated=false` une fois l'envoi confirmé.
2. **WhatsApp** : WhatsApp Business API (Meta) via la même Edge Function.
3. **Relances planifiées** (déclencheurs 4, 5, 8, 12) : `pg_cron` côté Supabase
   (requêtes sur `activities`, `selections.updated_at`, `quotes.valid_until`,
   `orders.status`) insérant les notifications correspondantes.

**Règle absolue : ne rien envoyer sans configuration explicite du fournisseur
et autorisation de la maison.**
