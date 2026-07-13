'use client';

import { useRouter } from 'next/navigation';

interface Section {
  title: string;
  items: { label: string; description: string }[];
}

const SECTIONS: Section[] = [
  {
    title: 'Tableau de bord',
    items: [
      {
        label: 'Statistiques',
        description:
          "Vue d'ensemble des commandes des 7 derniers jours, du chiffre d'affaires, et de la répartition des commandes par statut.",
      },
      {
        label: 'Accès rapide',
        description:
          'Boutons vers les commandes, la création de commande, le bilan, l\'export et la gestion des utilisateurs.',
      },
    ],
  },
  {
    title: 'Commandes',
    items: [
      {
        label: 'Créer une commande',
        description:
          "Enregistrer un nouveau client (ou en choisir un existant), ajouter un ou plusieurs vêtements avec description et photos, fixer le prix total et la date de retrait prévue.",
      },
      {
        label: 'Statuts de commande',
        description:
          'Chaque commande suit 5 étapes : Reçu → En lavage → En repassage → Prêt → Livré. Seul un administrateur peut changer librement le statut ; un employé peut faire évoluer ses propres commandes tant qu\'elles ne sont pas encore livrées.',
      },
      {
        label: 'Paiements',
        description:
          "Enregistrer un ou plusieurs paiements partiels sur une commande. Le montant restant à payer est calculé automatiquement.",
      },
      {
        label: 'Observations / incidents',
        description:
          "Ajouter à tout moment un message visible par le client sur son lien de suivi (ex : panne de machine, coupure d'électricité, retard). Chaque message est daté et reste affiché avec l'historique complet. Seul un administrateur peut supprimer un message.",
      },
      {
        label: 'Notification WhatsApp',
        description:
          'Quand une commande passe au statut "Prêt", un bouton permet d\'envoyer directement un message WhatsApp au client pour l\'informer.',
      },
    ],
  },
  {
    title: 'Lien de suivi client',
    items: [
      {
        label: 'Suivi sans connexion',
        description:
          "Chaque commande a un lien unique (ex : /suivi/xxxx) à transmettre au client. Il n'a besoin d'aucun compte ni mot de passe pour consulter l'avancement de sa commande.",
      },
      {
        label: 'Ce que le client voit',
        description:
          'Le statut actuel de sa commande, la progression visuelle des 5 étapes, le détail des vêtements, les dates de dépôt/retrait/livraison, les observations éventuelles signalées par le pressing, et le récapitulatif du paiement (total, payé, restant).',
      },
    ],
  },
  {
    title: 'Clients',
    items: [
      {
        label: 'Fiche client',
        description:
          "Historique complet des commandes d'un client, ses coordonnées, et accès rapide pour créer une nouvelle commande à son nom.",
      },
    ],
  },
  {
    title: 'Bilan & Export',
    items: [
      {
        label: 'Bilan financier',
        description:
          'Vue synthétique du chiffre d\'affaires encaissé et des montants restants à percevoir sur une période donnée.',
      },
      {
        label: 'Export',
        description: 'Génération de rapports (PDF) des commandes pour archivage ou comptabilité.',
      },
    ],
  },
  {
    title: 'Utilisateurs (Admin uniquement)',
    items: [
      {
        label: 'Gestion des comptes',
        description:
          "Un administrateur peut créer des comptes employés, consulter l'historique des connexions, et gérer les accès à l'application.",
      },
    ],
  },
];

export default function DocumentationPage() {
  const router = useRouter();

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={bgStyle}>
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: '#C81E6E' }}
      />
      <div
        className="absolute top-40 -right-16 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: '#87CEEB' }}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 relative">
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 mb-4 flex items-center gap-1"
        >
          ← Retour
        </button>

        <div className="text-center mb-6">
          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            MN <span style={{ color: '#C81E6E' }}>Pressing</span>
          </h1>
          <p className="text-xs text-slate-400">Documentation & aide</p>
        </div>

        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-2xl p-5 mb-4"
            style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-1 h-5 rounded-full"
                style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }}
              />
              <h2
                className="font-semibold text-sm"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
              >
                {section.title}
              </h2>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.label}>
                  <p className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>
                    {item.label}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact support technique */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
            boxShadow: '0 12px 28px -8px rgba(200, 30, 110, 0.45)',
          }}
        >
          <p
            className="text-white font-semibold text-base mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Besoin d&apos;aide ?
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Pour tout problème technique rencontré sur l&apos;application, contactez le support.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://wa.me/237692860695"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl"
              style={{ background: '#25D366', color: '#fff' }}
            >
              📱 WhatsApp — 692 860 695
            </a>
            <a
              href="tel:+237652591205"
              className="flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl bg-white"
              style={{ color: '#1A1A2E' }}
            >
              📞 Appel — 652 591 205
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MN Pressing — Documentation de l&apos;application
        </p>
      </div>
    </div>
  );
}
