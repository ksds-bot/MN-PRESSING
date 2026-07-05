'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GarmentForm {
  type: string;
  description: string;
  observations: string;
  photoUrls: string[];
  uploading: boolean;
}

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Client
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Commande
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [observations, setObservations] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // Vêtements
  const [garments, setGarments] = useState<GarmentForm[]>([
    { type: '', description: '', observations: '', photoUrls: [], uploading: false },
  ]);

  const remaining =
    totalPrice && paidAmount
      ? (parseFloat(totalPrice) - parseFloat(paidAmount)).toFixed(0)
      : totalPrice
      ? totalPrice
      : '0';

  function addGarment() {
    setGarments([
      ...garments,
      { type: '', description: '', observations: '', photoUrls: [], uploading: false },
    ]);
  }

  function removeGarment(index: number) {
    setGarments(garments.filter((_, i) => i !== index));
  }

  function updateGarment(index: number, field: keyof GarmentForm, value: any) {
    const updated = [...garments];
    (updated[index] as any)[field] = value;
    setGarments(updated);
  }

  async function handlePhotoUpload(index: number, file: File) {
    const token = localStorage.getItem('accessToken');
    updateGarment(index, 'uploading', true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        const updated = [...garments];
        updated[index].photoUrls.push(data.data.secure_url);
        updated[index].uploading = false;
        setGarments(updated);
      } else {
        setError(`Erreur upload photo: ${data.error}`);
        updateGarment(index, 'uploading', false);
      }
    } catch (err) {
      setError('Erreur lors de l\'upload de la photo');
      updateGarment(index, 'uploading', false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName || !phoneNumber) {
      setError('Le nom et le téléphone du client sont requis');
      return;
    }

    if (!expectedReturnDate) {
      setError('La date prévue de retrait est requise');
      return;
    }

    if (!totalPrice) {
      setError('Le prix total est requis');
      return;
    }

    if (garments.some((g) => !g.type || !g.description)) {
      setError('Chaque vêtement doit avoir un type et une description');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('accessToken');

    try {
      // 1. Créer ou trouver le client
      const customerRes = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email: customerEmail || undefined,
        }),
      });

      const customerData = await customerRes.json();

      if (!customerData.success) {
        setError(customerData.error || 'Erreur lors de la création du client');
        setSubmitting(false);
        return;
      }

      // 2. Créer la commande avec les vêtements
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: customerData.customer.id,
          depositDate,
          expectedReturnDate,
          observations,
          totalPrice: parseFloat(totalPrice),
          paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
          garments: garments.map((g) => ({
            type: g.type,
            description: g.description,
            observations: g.observations,
            photoUrls: g.photoUrls,
          })),
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        setError(orderData.error || 'Erreur lors de la création de la commande');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/commandes/nouvelle');
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError('Erreur serveur, réessayez.');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-green-600 text-lg font-semibold">✅ Commande enregistrée avec succès !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Nouvelle commande</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Client */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Informations client</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>
          </div>

          {/* Section Dates & Observations */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Dates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date de dépôt *</label>
                <input
                  type="date"
                  required
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date de retrait prévue *</label>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observations générales</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                rows={2}
              />
            </div>
          </div>

          {/* Section Vêtements */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-slate-800">Vêtements</h2>
              <button
                type="button"
                onClick={addGarment}
                className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium"
              >
                + Ajouter un vêtement
              </button>
            </div>

            <div className="space-y-4">
              {garments.map((garment, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                  {garments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGarment(index)}
                      className="absolute top-2 right-2 text-red-500 text-sm"
                    >
                      Retirer
                    </button>
                  )}
                  <p className="text-sm font-medium text-slate-500 mb-2">Vêtement {index + 1}</p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Type (ex: Chemise, Pantalon...)"
                      required
                      value={garment.type}
                      onChange={(e) => updateGarment(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                    <input
                      type="text"
                      placeholder="Description (ex: Chemise blanche à rayures)"
                      required
                      value={garment.description}
                      onChange={(e) => updateGarment(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                    <input
                      type="text"
                      placeholder="Observations (tache, bouton manquant...)"
                      value={garment.observations}
                      onChange={(e) => updateGarment(index, 'observations', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />

                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Photos</label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(index, file);
                        }}
                        className="text-sm"
                      />
                      {garment.uploading && (
                        <p className="text-xs text-blue-600 mt-1">Envoi en cours...</p>
                      )}
                      {garment.photoUrls.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {garment.photoUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="vêtement"
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Financière */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Informations financières</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix total (FCFA) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Montant payé (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Reste à payer : <span className="font-bold text-blue-900">{remaining} FCFA</span>
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer la commande'}
          </button>
        </form>
      </div>
    </div>
  );
}
