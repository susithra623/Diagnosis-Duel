import { useEffect, useState } from 'react';
import { AlertTriangle, Lock, ShieldCheck, Unlock } from 'lucide-react';
import { api } from '../services/api.js';
import { Card, ConfidenceMeter, ErrorBanner, SectionTitle, Spinner } from '../components/ui.jsx';

const DATA = [['symptoms', 'Symptoms'], ['vitals', 'Vital Signs & Exam'], ['history', 'Medical History'], ['labs', 'Lab & Cardiac Tests'], ['imaging', 'Previous Imaging'], ['genetic', 'Genetic Information']];
const PURPOSES = [['diagnosis', 'Diagnosis Assistance', 'AI may use the data to support this diagnosis.'], ['training', 'AI Training', 'Stored as a preference only: this prototype never trains on data.'], ['research', 'Research', 'Stored as a preference only: no data leaves this app.']];

const Toggle = ({ on, onChange, label, sub }) => (
  <button onClick={onChange} className={`w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${on ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
    <span><span className="font-semibold text-sm">{label}</span>{sub && <span className="block text-xs text-slate-500">{sub}</span>}</span>
    <span className={`flex items-center gap-1 text-xs font-bold ${on ? 'text-green-700' : 'text-slate-500'}`}>{on ? <Unlock size={14} /> : <Lock size={14} />}{on ? 'ALLOWED' : 'BLOCKED'}</span>
  </button>
);

export default function ConsentCenter() {
  const [cases, setCases] = useState([]);
  const [pid, setPid] = useState('c9');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { fetch('/api/cases').then((r) => r.json()).then(setCases).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { api.getConsent(pid).then(setD).catch((e) => setErr(e.message)); }, [pid]);

  const change = (group, key) => {
    const next = { data: { ...d.consent.data }, purposes: { ...d.consent.purposes } };
    next[group][key] = !next[group][key];
    setD({ ...d, consent: next }); // optimistic
    api.saveConsent({ patientId: pid, ...next }).then(setD).catch((e) => setErr(e.message));
  };

  if (!d) return err ? <ErrorBanner message={err} /> : <Spinner />;
  const reduced = d.potentialConfidence < d.baselineConfidence || d.preview.blocked?.length > 0 || !d.consent.purposes.diagnosis;
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div><h1 className="flex items-center gap-2 text-2xl font-black text-[#0b1f3a]"><ShieldCheck className="text-blue-700" /> Patient Consent Center</h1><p className="text-slate-600 text-sm">Patients see and control exactly what the AI can use. Changes apply immediately to this patient’s cases.</p></div>
      <ErrorBanner message={err} onClose={() => setErr('')} />
      <div className="flex flex-wrap items-center gap-2 text-sm"><label className="font-semibold">Patient:</label>
        <select value={pid} onChange={(e) => setPid(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white">{cases.map((c) => <option key={c.id} value={c.id}>{c.id.toUpperCase()} · {c.age}y {c.gender} · {c.complaint}</option>)}</select></div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card><SectionTitle>Data permissions</SectionTitle><div className="p-5 space-y-2">{DATA.map(([k, l]) => <Toggle key={k} on={d.consent.data[k]} onChange={() => change('data', k)} label={l} sub={k === 'genetic' ? 'No genetic data exists for synthetic cases.' : null} />)}</div></Card>
        <Card><SectionTitle>Purpose</SectionTitle><div className="p-5 space-y-2">{PURPOSES.map(([k, l, s]) => <Toggle key={k} on={d.consent.purposes[k]} onChange={() => change('purposes', k)} label={l} sub={s} />)}</div></Card>
      </div>
      <Card className="p-5 space-y-3">
        <div className="font-semibold">Your selected permissions affect what the AI can use.</div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-slate-500 mb-1">AI confidence with ALL permitted tests · now</div><div className="text-2xl font-black">{d.potentialConfidence}%</div><ConfidenceMeter value={d.potentialConfidence} /></div>
          <div><div className="text-xs text-slate-500 mb-1">AI confidence with full consent</div><div className="text-2xl font-black text-slate-500">{d.baselineConfidence}%</div><ConfidenceMeter value={d.baselineConfidence} /></div>
        </div>
        {reduced
          ? <div className="flex gap-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> AI confidence may be reduced because selected information is unavailable{d.preview.blocked?.length ? `: ${d.preview.blocked.join(', ')}.` : '.'}</div>
          : <div className="bg-green-50 border border-green-300 text-green-900 rounded-lg p-3 text-sm">All relevant information is available to the AI for this patient.</div>}
        <div className="text-xs text-slate-500">Prototype only: consent here is a simulation of transparency and control, not a legal consent workflow.</div>
      </Card>
    </div>
  );
}
