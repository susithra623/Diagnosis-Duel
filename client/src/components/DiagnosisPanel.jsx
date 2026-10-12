import { Gauge, Gavel, Search, Send } from 'lucide-react';
import { Card, SectionTitle } from './ui.jsx';
import { riskMeter } from '../lib/risk.js';

const LEVELS = [['Very Low', 10], ['Low', 30], ['Medium', 50], ['High', 75], ['Very High', 92]];
const levelOf = (c) => (c < 20 ? 0 : c < 40 ? 1 : c < 60 ? 2 : c < 85 ? 3 : 4);
const TONE = { LOW: ['bg-green-500', 'text-green-700', 'LOW RISK'], MODERATE: ['bg-amber-500', 'text-amber-700', 'MODERATE RISK'], HIGH: ['bg-red-500', 'text-red-700', 'HIGH RISK'] };

export default function DiagnosisPanel({ options, dx, setDx, conf, setConf, onSubmit, onMore, busy, ai, expired }) {
  const risk = riskMeter({ dx, conf, ai });
  const [bar, txt, label] = TONE[risk.level];
  const idx = ['LOW', 'MODERATE', 'HIGH'].indexOf(risk.level);
  return (
    <Card>
      <SectionTitle icon={Gavel}>Your Decision</SectionTitle>
      <div className="p-5 space-y-5">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">DIAGNOSIS</div>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button key={o.id} onClick={() => setDx(o.id)} aria-pressed={dx === o.id} className={`px-3 py-1.5 rounded-full text-sm border transition ${dx === o.id ? 'bg-[#0b1f3a] text-white border-cyan-300' : 'bg-white border-slate-300 hover:border-cyan-400'}`}>{o.name}</button>
            ))}
            <button onClick={() => setDx('INSUFFICIENT')} aria-pressed={dx === 'INSUFFICIENT'} className={`px-3 py-1.5 rounded-full text-sm border transition ${expired ? 'animate-pulse' : ''} ${dx === 'INSUFFICIENT' ? 'bg-amber-500 text-white border-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-400'}`}>⚠️ Insufficient information</button>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">CONFIDENCE · {conf}%</div>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {LEVELS.map(([l, v], i) => <button key={l} onClick={() => setConf(v)} className={`py-1.5 rounded-md text-xs border transition ${levelOf(conf) === i ? 'bg-blue-700 text-white border-cyan-300' : 'bg-white border-slate-300 hover:border-cyan-400'}`}>{l}</button>)}
          </div>
          <input type="range" min="0" max="100" value={conf} onChange={(e) => setConf(Number(e.target.value))} className="w-full accent-cyan-400" aria-label="Confidence percentage" />
        </div>
        <div className="rounded-lg border border-slate-300 p-3 bg-slate-50">
          <div className="flex items-center justify-between mb-2"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Gauge size={14} /> RISK METER</span><span className={`font-bold text-sm ${txt}`}>{label}</span></div>
          <div className="grid grid-cols-3 gap-1">{[0, 1, 2].map((i) => <div key={i} className={`h-2.5 rounded-full ${i <= idx ? bar : 'bg-slate-200'}`} />)}</div>
          <ul className="mt-2 text-xs text-slate-300 list-disc pl-4 space-y-0.5">{risk.factors.map((f, i) => <li key={i}>{f}</li>)}</ul>
          {risk.warning && <div className="mt-2 text-sm font-semibold text-amber-700">{risk.warning}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onSubmit} disabled={busy} className="flex-1 min-w-40 flex items-center justify-center gap-2 bg-[#0b1f3a] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"><Send size={16} /> Submit Diagnosis</button>
          <button onClick={onMore} className="flex items-center justify-center gap-2 border border-blue-700 text-blue-800 hover:bg-blue-50 font-semibold py-2.5 px-4 rounded-lg"><Search size={16} /> More Evidence</button>
        </div>
      </div>
    </Card>
  );
}
