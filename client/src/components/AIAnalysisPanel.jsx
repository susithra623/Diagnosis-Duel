import { AlertTriangle, Bot, CircleHelp, Lock, Repeat, SearchX } from 'lucide-react';
import { Card, ConfidenceMeter, RiskBadge, SectionTitle } from './ui.jsx';

const Col = ({ icon: Icon, title, color, items }) => (
  <div className={`rounded-lg border p-3 ${color}`}>
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2"><Icon size={14} />{title}</div>
    <ul className="space-y-1.5 text-sm list-disc pl-4">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
  </div>
);

// Shows the AI's current view: diagnosis (or INSUFFICIENT INFORMATION), confidence, and the three explanation boxes.
export default function AIAnalysisPanel({ ai, full = false }) {
  if (!ai) return null;
  const masked = ai.masked;
  return (
    <Card>
      <SectionTitle icon={Bot} right={masked && <span className="flex items-center gap-1 text-xs text-slate-500"><Lock size={12} /> Blind duel: hypothesis hidden</span>}>AI Analysis</SectionTitle>
      <div className="p-5 space-y-4">
        {ai.insufficient ? (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 animate-slide">
            <div className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle size={18} /> ⚠️ INSUFFICIENT INFORMATION</div>
            <div className="mt-1 text-sm text-amber-900">Confidence: <b>{ai.confidence}%</b></div>
            <div className="mt-1 text-sm text-amber-900">{ai.reason}</div>
            <div className="mt-2 text-sm font-semibold text-amber-900">Recommended action: {ai.recommended}</div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold text-slate-500">AI DIAGNOSIS</div>
            <div className="text-xl font-bold text-[#0b1f3a]">{masked ? <span className="flex items-center gap-2 text-slate-400"><Lock size={16} /> Hidden until you submit</span> : ai.name}</div>
          </div>
        )}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1"><span>CONFIDENCE</span><span className="text-slate-900 text-sm">{ai.confidence}%</span></div>
          <ConfidenceMeter value={ai.confidence} insufficient={ai.insufficient} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm items-center">
          <span>Uncertainty: <b>{ai.uncertainty}</b></span>
          <span className="flex items-center gap-1.5">Risk: <RiskBadge level={ai.risk} /></span>
        </div>
        {!ai.insufficient && <p className="text-sm text-slate-700">{ai.reason}</p>}
        {!masked && ai.ranked?.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500">DIFFERENTIAL</div>
            {ai.ranked.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs"><span className="w-40 truncate">{r.name}</span><div className="flex-1"><ConfidenceMeter value={r.p} height="h-1.5" /></div><span className="w-8 text-right">{r.p}%</span></div>
            ))}
          </div>
        )}
        <div className={`grid gap-3 ${full ? 'md:grid-cols-3' : ''}`}>
          <Col icon={CircleHelp} title="Why?" color="bg-blue-50 border-blue-200 text-blue-950" items={ai.why} />
          <Col icon={SearchX} title="What is missing?" color="bg-amber-50 border-amber-200 text-amber-950" items={ai.missing.length ? ai.missing : ['Nothing critical: key evidence is available.']} />
          <Col icon={Repeat} title="What would change my mind?" color="bg-purple-50 border-purple-200 text-purple-950" items={ai.changeMind} />
        </div>
      </div>
    </Card>
  );
}
