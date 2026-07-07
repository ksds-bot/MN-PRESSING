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

const inputStyle: React.CSSProperties = {
  boxShadow: 'none',
};

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 4px 20px -6px rgba(26, 26, 46, 0.08)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: 'linear-gradient(180deg, #C81E6E, #87CEEB)' }}
          />
          <h2
            className="font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
        {label} {required && <span style={{ color: '#C81E6E' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const fieldClasses =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:bg-white transition-all text-sm';

function focusPink(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.boxShadow = '0 0 0 3px rgba(200, 30, 110, 0.15)';
  e.target.style.borderColor = '#C81E6E';
}
function blurPink(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.boxShadow = 'none';
  e.target.style.borderColor = '';
}

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [observations, setObservations] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

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
        headers: { Authorization: `Bearer ${token}` },
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
      setError("Erreur lors de l'upload de la photo");
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
        window.location.href = '/commandes/nouvelle';
      }, 1500);
    } catch (err) {
      setError('Erreur serveur, réessayez.');
      setSubmitting(false);
    }
  }

  const bgStyle = {
    background: 'linear-gradient(160deg, #FDF2F8 0%, #FFFFFF 40%, #E0F2FE 100%)',
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={bgStyle}>
        <div
          className="bg-white rounded-2xl p-8 text-center max-w-sm"
          style={{ boxShadow: '0 20px 60px -15px rgba(200, 30, 110, 0.25)' }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ background: '#DCFCE7' }}
          >
            ✅
          </div>
          <p
            className="text-lg font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            Commande enregistrée
          </p>
          <p className="text-sm text-slate-400 mt-1">Redirection en cours...</p>
        </div>
      </div>
    );
  }

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
        <div className="mb-6">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}
          >
            Nouvelle <span style={{ color: '#C81E6E' }}>commande</span>
          </h1>
          <p className="text-xs text-slate-400 italic">MN Pressing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionCard title="Informations client">
            <div className="space-y-3">
              <Field label="Nom complet" required>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
              <Field label="Téléphone" required>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
              <Field label="Email (optionnel)">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Dates">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Date de dépôt" required>
                <input
                  type="date"
                  required
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
              <Field label="Retrait prévu" required>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
            </div>
            <Field label="Observations générales">
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                onFocus={focusPink}
                onBlur={blurPink}
                className={fieldClasses}
                rows={2}
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Vêtements"
            action={
              <button
                type="button"
                onClick={addGarment}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: '#FDF2F8', color: '#C81E6E' }}
              >
                + Ajouter
              </button>
            }
          >
            <div className="space-y-4">
              {garments.map((garment, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 relative"
                  style={{ background: '#FAFAFA', border: '1px solid #F1F5F9' }}
                >
                  {garments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGarment(index)}
                      className="absolute top-3 right-3 text-xs font-medium"
                      style={{ color: '#EF4444' }}
                    >
                      Retirer
                    </button>
                  )}
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: '#C81E6E' }}
                  >
                    Vêtement {index + 1}
                  </p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Type (ex: Chemise, Pantalon...)"
                      required
                      value={garment.type}
                      onChange={(e) => updateGarment(index, 'type', e.target.value)}
                      onFocus={focusPink}
                      onBlur={blurPink}
                      className={fieldClasses + ' bg-white'}
                    />
                    <input
                      type="text"
                      placeholder="Description (ex: Chemise blanche à rayures)"
                      required
                      value={garment.description}
                      onChange={(e) => updateGarment(index, 'description', e.target.value)}
                      onFocus={focusPink}
                      onBlur={blurPink}
                      className={fieldClasses + ' bg-white'}
                    />
                    <input
                      type="text"
                      placeholder="Observations (tache, bouton manquant...)"
                      value={garment.observations}
                      onChange={(e) => updateGarment(index, 'observations', e.target.value)}
                      onFocus={focusPink}
                      onBlur={blurPink}
                      className={fieldClasses + ' bg-white'}
                    />

                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Photos (depuis la galerie)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(index, file);
                        }}
                        className="text-xs"
                      />
                      {garment.uploading && (
                        <p className="text-xs mt-1" style={{ color: '#87CEEB' }}>
                          Envoi en cours...
                        </p>
                      )}
                      {garment.photoUrls.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {garment.photoUrls.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={url}
                              alt="vêtement"
                              className="w-16 h-16 object-cover rounded-lg"
                              style={{ border: '1px solid #F1F5F9' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Informations financières">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix total (FCFA)" required>
                <input
                  type="number"
                  required
                  min="0"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
              <Field label="Montant payé (FCFA)">
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  onFocus={focusPink}
                  onBlur={blurPink}
                  className={fieldClasses}
                />
              </Field>
            </div>
            <div
              className="mt-4 rounded-xl p-3 flex justify-between items-center"
              style={{ background: '#FDF2F8' }}
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Reste à payer
              </span>
              <span className="text-lg font-bold" style={{ color: '#C81E6E' }}>
                {remaining} FCFA
              </span>
            </div>
          </SectionCard>

          {error && (
            <p className="text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #C81E6E 0%, #A0164F 100%)',
              boxShadow: '0 8px 20px -6px rgba(200, 30, 110, 0.5)',
            }}
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer la commande'}
          </button>
        </form>
      </div>
    </div>
  );
}
