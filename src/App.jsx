import React, { useState, useEffect, useCallback } from ‘react’;

const STRIPE_LINK = ‘https://buy.stripe.com/14A8wPadZ2MmbRF0A4a3u00’;

const TAUX_OPTIONS = [
{ label: ‘Auto-entrepreneur - Prestation de services (21.2%)’, value: 21.2 },
{ label: ‘Auto-entrepreneur - Vente de marchandises (12.8%)’, value: 12.8 },
{ label: ‘Auto-entrepreneur - Liberal CIPAV (21.2%)’, value: 21.2 },
{ label: ‘EIRL / EI au reel (estimation 45%)’, value: 45 },
{ label: ‘Personnalise’, value: null },
];

const fmt = (n) =>
new Intl.NumberFormat(‘fr-FR’, { style: ‘currency’, currency: ‘EUR’ }).format(n || 0);

const pct = (n) => `${(n || 0).toFixed(1)}%`;

function calcul(f) {
const prixVente = parseFloat(f.prixVente) || 0;
const matieres = parseFloat(f.matieres) || 0;
const transport = parseFloat(f.transport) || 0;
const outillage = parseFloat(f.outillage) || 0;
const autresFrais = parseFloat(f.autresFrais) || 0;
const heures = parseFloat(f.heures) || 0;
const tauxHoraire = parseFloat(f.tauxHoraire) || 0;
const taux = parseFloat(f.tauxCotisations) || 0;
const coutMain = heures * tauxHoraire;
const cotisations = (prixVente * taux) / 100;
const totalCharges = matieres + transport + outillage + autresFrais + coutMain + cotisations;
const beneficeNet = prixVente - totalCharges;
const marge = prixVente > 0 ? (beneficeNet / prixVente) * 100 : 0;
let sante = ‘Deficitaire’;
if (marge >= 20) sante = ‘Rentable’;
else if (marge >= 0) sante = ‘Risque’;
return { prixVente, matieres, transport, outillage, autresFrais, coutMain, cotisations, totalCharges, beneficeNet, marge, sante };
}

function genererPDF(fields, res) {
if (typeof window === ‘undefined’ || !window.jspdf) {
alert(‘jsPDF non charge’);
return;
}
const { jsPDF } = window.jspdf;
const doc = new jsPDF({ unit: ‘mm’, format: ‘a4’ });
doc.setFillColor(10, 11, 15);
doc.rect(0, 0, 210, 297, ‘F’);
doc.setFillColor(17, 19, 24);
doc.rect(0, 0, 210, 40, ‘F’);
doc.setTextColor(79, 255, 160);
doc.setFontSize(22);
doc.setFont(‘helvetica’, ‘bold’);
doc.text(‘ProfitMaster’, 15, 18);
doc.setFontSize(10);
doc.setTextColor(160, 170, 190);
doc.text(‘Bilan de Rentabilite’, 15, 26);
doc.text(’Genere le ’ + new Date().toLocaleDateString(‘fr-FR’), 15, 32);
const couleurSante = res.sante === ‘Rentable’ ? [79, 255, 160] : res.sante === ‘Risque’ ? [255, 190, 50] : [255, 80, 80];
doc.setFillColor(…couleurSante);
doc.roundedRect(140, 10, 55, 20, 4, 4, ‘F’);
doc.setTextColor(10, 11, 15);
doc.setFontSize(13);
doc.setFont(‘helvetica’, ‘bold’);
doc.text(res.sante.toUpperCase(), 167.5, 22, { align: ‘center’ });
let y = 55;
const drawSection = (titre, lignes) => {
doc.setFillColor(17, 19, 24);
doc.roundedRect(10, y - 6, 190, 10 + lignes.length * 9, 3, 3, ‘F’);
doc.setTextColor(79, 255, 160);
doc.setFontSize(11);
doc.setFont(‘helvetica’, ‘bold’);
doc.text(titre, 18, y);
y += 8;
lignes.forEach(([label, valeur]) => {
doc.setTextColor(160, 170, 190);
doc.setFontSize(9);
doc.setFont(‘helvetica’, ‘normal’);
doc.text(label, 20, y);
doc.setTextColor(230, 235, 245);
doc.text(valeur, 190, y, { align: ‘right’ });
y += 9;
});
y += 6;
};
drawSection(‘Revenus’, [[‘Prix de vente’, fmt(res.prixVente)]]);
drawSection(‘Couts’, [
[‘Matieres’, fmt(res.matieres)],
[‘Transport’, fmt(res.transport)],
[‘Outillage’, fmt(res.outillage)],
[‘Autres frais’, fmt(res.autresFrais)],
]);
drawSection(‘Main oeuvre’, [[fields.heures + ’h x ’ + fmt(parseFloat(fields.tauxHoraire) || 0), fmt(res.coutMain)]]);
drawSection(‘Cotisations’, [[’Taux ’ + fields.tauxCotisations + ‘%’, fmt(res.cotisations)]]);
doc.setFillColor(79, 255, 160);
doc.roundedRect(10, y, 190, 40, 4, 4, ‘F’);
doc.setTextColor(10, 11, 15);
doc.setFontSize(13);
doc.setFont(‘helvetica’, ‘bold’);
doc.text(‘BENEFICE NET REEL’, 105, y + 12, { align: ‘center’ });
doc.setFontSize(28);
doc.text(fmt(res.beneficeNet), 105, y + 27, { align: ‘center’ });
doc.setFontSize(11);
doc.text(’Marge : ’ + pct(res.marge), 105, y + 36, { align: ‘center’ });
doc.setTextColor(60, 70, 90);
doc.setFontSize(8);
doc.text(‘ProfitMaster - Calculateur de rentabilite’, 105, 290, { align: ‘center’ });
doc.save(‘bilan-profitmaster.pdf’);
}

function InputField({ label, id, value, onChange, placeholder, prefix, hint }) {
return (
<div style={{ marginBottom: 16 }}>
<label style={{ display: ‘block’, fontSize: 12, fontWeight: 600, color: ‘#8A95AA’, marginBottom: 6, textTransform: ‘uppercase’ }}>
{label}
</label>
<div style={{ position: ‘relative’ }}>
<span style={{ position: ‘absolute’, left: 14, top: ‘50%’, transform: ‘translateY(-50%)’, color: ‘#4FFFA0’, fontSize: 14, fontWeight: 700 }}>{prefix || ‘€’}</span>
<input
id={id}
type=“number”
min=“0”
step=“0.01”
value={value}
onChange={(e) => onChange(e.target.value)}
placeholder={placeholder || ‘0’}
inputMode=“decimal”
style={{
width: ‘100%’,
background: ‘#0A0B0F’,
border: ‘1.5px solid #1E2230’,
borderRadius: 10,
color: ‘#E8EDF5’,
fontSize: 16,
padding: ‘12px 14px 12px 34px’,
outline: ‘none’,
boxSizing: ‘border-box’,
fontFamily: ‘monospace’,
}}
onFocus={(e) => (e.target.style.borderColor = ‘#4FFFA0’)}
onBlur={(e) => (e.target.style.borderColor = ‘#1E2230’)}
/>
</div>
{hint && <p style={{ fontSize: 11, color: ‘#4A5568’, marginTop: 4 }}>{hint}</p>}
</div>
);
}

function SanteIndicateur({ sante }) {
const configs = {
Rentable: { bg: ‘rgba(79,255,160,0.12)’, color: ‘#4FFFA0’, border: ‘#4FFFA0’, emoji: ‘✅’ },
Risque: { bg: ‘rgba(255,190,50,0.12)’, color: ‘#FFBE32’, border: ‘#FFBE32’, emoji: ‘⚠️’ },
Deficitaire: { bg: ‘rgba(255,80,80,0.12)’, color: ‘#FF5050’, border: ‘#FF5050’, emoji: ‘🔴’ },
};
const config = configs[sante] || configs[‘Deficitaire’];
return (
<div style={{ background: config.bg, border: ’1.5px solid ’ + config.border, borderRadius: 12, padding: ‘10px 18px’, display: ‘flex’, alignItems: ‘center’, gap: 10 }}>
<span style={{ fontSize: 20 }}>{config.emoji}</span>
<div>
<div style={{ fontSize: 11, color: ‘#8A95AA’, textTransform: ‘uppercase’ }}>Sante du projet</div>
<div style={{ fontSize: 18, fontWeight: 800, color: config.color }}>{sante}</div>
</div>
</div>
);
}

function ResultCard({ label, value, highlight }) {
return (
<div style={{ background: highlight ? ‘rgba(79,255,160,0.07)’ : ‘#111318’, border: ’1.5px solid ’ + (highlight ? ‘#4FFFA0’ : ‘#1E2230’), borderRadius: 12, padding: ‘14px 18px’ }}>
<div style={{ fontSize: 11, color: ‘#8A95AA’, textTransform: ‘uppercase’, marginBottom: 4 }}>{label}</div>
<div style={{ fontSize: highlight ? 26 : 20, fontWeight: 800, color: highlight ? ‘#4FFFA0’ : ‘#E8EDF5’, fontFamily: ‘monospace’ }}>{value}</div>
</div>
);
}

function SimulationMensuelle({ beneficeNet }) {
const paliers = [5, 10, 20, 30, 50];
return (
<div style={{ background: ‘#111318’, border: ‘1px solid #1A1E2A’, borderRadius: 16, padding: ‘22px 20px’, marginTop: 16 }}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 10, marginBottom: 18 }}>
<span style={{ fontSize: 18 }}>🚀</span>
<h3 style={{ fontSize: 15, fontWeight: 800, color: ‘#4FFFA0’ }}>SIMULATION MENSUELLE</h3>
</div>
<p style={{ fontSize: 12, color: ‘#4A5568’, marginBottom: 16 }}>
Si tu fais ce nombre de clients par mois, tu gagnes :
</p>
{paliers.map((nb) => {
const total = beneficeNet * nb;
const isGood = total >= 2000;
return (
<div key={nb} style={{
display: ‘flex’,
justifyContent: ‘space-between’,
alignItems: ‘center’,
background: ‘#0A0B0F’,
borderRadius: 10,
padding: ‘12px 16px’,
marginBottom: 8,
border: ‘1px solid #1A1E2A’,
}}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 8 }}>
<span style={{ fontSize: 16 }}>{nb >= 20 ? ‘🔥’ : ‘👤’}</span>
<span style={{ fontSize: 14, color: ‘#8A95AA’ }}>
<strong style={{ color: ‘#E8EDF5’ }}>{nb} clients</strong> / mois
</span>
</div>
<span style={{ fontSize: 16, fontWeight: 800, color: isGood ? ‘#4FFFA0’ : ‘#E8EDF5’, fontFamily: ‘monospace’ }}>
{fmt(total)}
</span>
</div>
);
})}
<p style={{ fontSize: 11, color: ‘#2E3545’, marginTop: 12, textAlign: ‘center’ }}>
Basé sur un bénéfice net de {fmt(beneficeNet)} par client
</p>
</div>
);
}

function ModalPaywall({ onClose, onPay }) {
return (
<div style={{ position: ‘fixed’, inset: 0, zIndex: 999, background: ‘rgba(5,6,10,0.88)’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, padding: 20, backdropFilter: ‘blur(8px)’ }}>
<div style={{ background: ‘#111318’, border: ‘1.5px solid #4FFFA0’, borderRadius: 20, maxWidth: 400, width: ‘100%’, padding: ‘32px 28px’, position: ‘relative’ }}>
<button onClick={onClose} style={{ position: ‘absolute’, top: 16, right: 16, background: ‘none’, border: ‘none’, color: ‘#4A5568’, fontSize: 22, cursor: ‘pointer’ }}>X</button>
<div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
<h2 style={{ color: ‘#E8EDF5’, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Securisez votre projet</h2>
<p style={{ color: ‘#8A95AA’, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
Obtenez votre <strong style={{ color: ‘#4FFFA0’ }}>Bilan PDF complet</strong> pret a partager avec vos clients.
</p>
<div style={{ background: ‘#0A0B0F’, borderRadius: 12, padding: ‘16px 20px’, marginBottom: 24, textAlign: ‘center’ }}>
<div style={{ fontSize: 11, color: ‘#4A5568’, textTransform: ‘uppercase’ }}>Acces unique</div>
<div style={{ fontSize: 36, fontWeight: 900, color: ‘#4FFFA0’ }}>2,00 €</div>
<div style={{ fontSize: 12, color: ‘#8A95AA’ }}>Paiement securise via Stripe</div>
</div>
<button onClick={onPay} style={{ width: ‘100%’, background: ‘linear-gradient(135deg, #4FFFA0, #2ECC71)’, border: ‘none’, borderRadius: 12, color: ‘#0A0B0F’, fontSize: 16, fontWeight: 800, padding: ‘15px’, cursor: ‘pointer’ }}>
Payer et Telecharger
</button>
</div>
</div>
);
}

function Section({ title, icon, children }) {
return (
<div style={{ background: ‘#111318’, borderRadius: 16, padding: ‘22px 20px’, marginBottom: 16, border: ‘1px solid #1A1E2A’ }}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 10, marginBottom: 18 }}>
<span style={{ fontSize: 18 }}>{icon}</span>
<h3 style={{ fontSize: 15, fontWeight: 800, color: ‘#4FFFA0’ }}>{title}</h3>
</div>
{children}
</div>
);
}

export default function ProfitMaster() {
const [fields, setFields] = useState({
prixVente: ‘’, matieres: ‘’, transport: ‘’, outillage: ‘’, autresFrais: ‘’, heures: ‘’, tauxHoraire: ‘’, tauxCotisations: ‘21.2’, tauxPersonnalise: ‘’, tauxOption: ‘21.2’,
});
const [showPaywall, setShowPaywall] = useState(false);
const [pdfPaid, setPdfPaid] = useState(false);
const setField = (key) => (val) => setFields((prev) => ({ …prev, [key]: val }));
const res = calcul(fields);

useEffect(() => {
const params = new URLSearchParams(window.location.search);
if (params.get(‘paid’) === ‘true’) setPdfPaid(true);
}, []);

const handlePDFClick = useCallback(() => {
if (pdfPaid) genererPDF(fields, res);
else setShowPaywall(true);
}, [pdfPaid, fields, res]);

const handlePay = () => {
window.open(STRIPE_LINK, ‘_blank’);
setShowPaywall(false);
};

const tauxActuel = fields.tauxOption === ‘custom’
? (parseFloat(fields.tauxPersonnalise) || 0)
: parseFloat(fields.tauxOption);

useEffect(() => {
setFields((prev) => ({ …prev, tauxCotisations: String(tauxActuel) }));
}, [tauxActuel]);

useEffect(() => {
const style = document.createElement(‘style’);
style.textContent = `* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #0A0B0F; color: #E8EDF5; font-family: sans-serif; } input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; } select { -webkit-appearance: none; appearance: none; }`;
document.head.appendChild(style);
return () => document.head.removeChild(style);
}, []);

return (
<div style={{ minHeight: ‘100vh’, background: ‘#0A0B0F’, paddingBottom: 40 }}>
<div style={{ background: ‘linear-gradient(180deg, #111318 0%, #0A0B0F 100%)’, borderBottom: ‘1px solid #1A1E2A’, padding: ‘20px 20px 18px’, textAlign: ‘center’ }}>
<div style={{ fontSize: 11, color: ‘#4FFFA0’, letterSpacing: ‘0.18em’, textTransform: ‘uppercase’, marginBottom: 6 }}>OUTIL PROFESSIONNEL</div>
<h1 style={{ fontSize: 28, fontWeight: 900, color: ‘#4FFFA0’ }}>ProfitMaster</h1>
<p style={{ color: ‘#4A5568’, fontSize: 13, marginTop: 4 }}>Calculateur de Rentabilite Universel</p>
</div>

```
  <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
    <Section title="REVENUS" icon="💰">
      <InputField label="Prix de vente estime" value={fields.prixVente} onChange={setField('prixVente')} hint="Le montant facture au client" />
    </Section>
    <Section title="COUTS DIRECTS" icon="📦">
      <InputField label="Matieres premieres" value={fields.matieres} onChange={setField('matieres')} />
      <InputField label="Transport / Essence" value={fields.transport} onChange={setField('transport')} />
      <InputField label="Outillage" value={fields.outillage} onChange={setField('outillage')} />
      <InputField label="Autres frais" value={fields.autresFrais} onChange={setField('autresFrais')} />
    </Section>
    <Section title="TEMPS PASSE" icon="🕐">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <InputField label="Heures" prefix="h" value={fields.heures} onChange={setField('heures')} />
        <InputField label="Taux/heure" value={fields.tauxHoraire} onChange={setField('tauxHoraire')} />
      </div>
      <div style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>
        Cout main oeuvre : <span style={{ color: '#8A95AA' }}>{fmt(res.coutMain)}</span>
      </div>
    </Section>
    <Section title="FISCALITE" icon="🏛️">
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <select value={fields.tauxOption} onChange={(e) => setFields((prev) => ({ ...prev, tauxOption: e.target.value }))}
          style={{ width: '100%', background: '#0A0B0F', border: '1.5px solid #1E2230', borderRadius: 10, color: '#E8EDF5', fontSize: 14, padding: '12px 40px 12px 14px', outline: 'none', cursor: 'pointer' }}>
          {TAUX_OPTIONS.map((o) => (
            <option key={o.label} value={o.value === null ? 'custom' : String(o.value)}>{o.label}</option>
          ))}
        </select>
      </div>
      {fields.tauxOption === 'custom' && (
        <InputField label="Taux personnalise (%)" prefix="%" value={fields.tauxPersonnalise} onChange={setField('tauxPersonnalise')} />
      )}
      <div style={{ fontSize: 12, color: '#4A5568' }}>
        Cotisations : <span style={{ color: '#8A95AA' }}>{fmt(res.cotisations)} ({fields.tauxCotisations}% du CA)</span>
      </div>
    </Section>

    {res.prixVente > 0 && (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#4FFFA0', textTransform: 'uppercase', marginBottom: 12 }}>Resultats en temps reel</div>
        <SanteIndicateur sante={res.sante} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <ResultCard label="Benefice Net" value={fmt(res.beneficeNet)} highlight />
          <ResultCard label="Marge Nette" value={pct(res.marge)} />
          <ResultCard label="Total Charges" value={fmt(res.totalCharges)} />
          <ResultCard label="Cotisations" value={fmt(res.cotisations)} />
        </div>

        <SimulationMensuelle beneficeNet={res.beneficeNet} />

        <button onClick={handlePDFClick} style={{ marginTop: 16, width: '100%', background: pdfPaid ? 'linear-gradient(135deg, #4FFFA0, #2ECC71)' : '#111318', border: '2px solid #4FFFA0', borderRadius: 14, color: pdfPaid ? '#0A0B0F' : '#4FFFA0', fontSize: 15, fontWeight: 800, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {pdfPaid ? 'Telecharger mon Bilan PDF' : 'Telecharger le Bilan PDF - 2,00 €'}
        </button>
      </div>
    )}

    {res.prixVente === 0 && (
      <div style={{ textAlign: 'center', padding: '30px 20px', color: '#2E3545' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
        <p style={{ fontSize: 14 }}>Renseignez votre prix de vente pour voir les resultats.</p>
      </div>
    )}
  </div>
  {showPaywall && <ModalPaywall onClose={() => setShowPaywall(false)} onPay={handlePay} />}
</div>
```

);
}