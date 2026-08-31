# VIP Car Rental Madagascar

Site public autonome hébergé sur GitHub Pages, avec backend Supabase séparé.

- Réservations stockées dans Supabase (plus de localStorage)
- Authentification administrateur via Supabase Auth
- Tableau de bord protégé par session et Row Level Security
- Validation accessible des formulaires et interface responsive
- Flotte et routes longue distance

## Mise en service Supabase

1. Ouvrir le projet Supabase VIP Car Rental.
2. Aller dans **SQL Editor**, coller puis exécuter `supabase-schema.sql`.
3. Aller dans **Authentication > Users** et créer/inviter l’administrateur.
4. Désactiver l’inscription publique si aucun compte client n’est nécessaire.

Ne jamais placer une clé `sb_secret_...` ou `service_role` dans ce dépôt.
