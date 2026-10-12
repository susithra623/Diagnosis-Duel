import { ArrowRight, Ban, CheckCircle2, FlaskConical, HeartPulse, MinusCircle, ScanLine, Search, Stethoscope, TrendingDown } from 'lucide-react';
import { Card, SectionTitle } from './ui.jsx';

const ICON = { imaging: ScanLine, labs: FlaskConical, vitals: Stethoscope };
const EFFECT = { supports: { Icon: CheckCircle2, cls: 'text-green-700', label: 'Supports hypothesis' }, weakens: { Icon: TrendingDown, cls: 'text-red-700', label: 'Weakens hypothesis' }, inconclusive: { Icon: MinusCircle, cls: 'text-amber-700', label: 'Inconclusive' } };

// Evidence Hunt: limited investigation budget, animated lab requests, and a timeline of clues.
export default function EvidencePanel({ tests, requested, log, onRequest, busyTest, budget, budgetLeft, disabled, blind }) {
  return (
    <Card>
      <SectionTitle icon={Search} right={
        <span className="flex items-center gap-2 text-xs text-slate-500">Requests left
          {Array.from({ length: budget }).map((_, i) => <span key={i} className={`w-3 h-3 rounded-full border ${i < budgetLeft ? 'bg-cyan-400 border-cyan-300' : 'border-slate-500'}`} />)}
        </span>}>Investigate Further</SectionTitle>
      <div className="px-5 pt-4 text-xs text-slate-500">Clues discovered: <b className="text-slate-200">{requested.length}</b> / {tests.length} · Useful tests earn +20 (once each). You may also answer "Insufficient information".</div>
      <div className="p-5 grid sm:grid-cols-2 gap-2">
        {tests.map((t) => {
          const Icon = ICON[t.cat] || HeartPulse, done = requested.includes(t.id), busy = busyTest === t.id;
          const off = done || disabled || !!busyTest || budgetLeft <= 0;
          return (
            <button key={t.id} disabled={off} onClick={() => onRequest(t.id)} aria-label={`Request ${t.label}`}
              className={`relative overflow-hidden flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition ${done ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-cyan-300 text-slate-800'} disabled:cursor-not-allowed`}>
              {busy && <span className="scanning absolute inset-0" />}
              <span className="relative flex items-center gap-2"><Icon size={16} className={done ? '' : 'text-blue-700'} />{t.label}</span>
              <span className="relative text-xs">{busy ? 'Investigating…' : done ? 'Completed' : budgetLeft <= 0 ? 'No budget' : 'Request'}</span>
            </button>
          );
        })}
      </div>
      {log.length > 0 && (
        <div className="px-5 pb-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 tracking-widest">EVIDENCE TIMELINE</div>
          {log.map((e, i) => {
            const fx = EFFECT[e.effect];
            return (
              <div key={i} className="animate-slide border-l-4 border-cyan-400 bg-blue-50/50 rounded-r-lg p-3">
                <div className="flex justify-between gap-2 text-sm"><span>🔎 <b>New clue!</b> {e.test.label}: {e.test.result}</span>{e.points > 0 && <span className="text-green-700 font-bold text-xs whitespace-nowrap">+{e.points} pts</span>}</div>
                <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${fx.cls}`}><fx.Icon size={14} /> {e.note}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-500">AI {blind ? 'confidence' : 'leading hypothesis'}</span>
                  <b>{e.beforeInsufficient ? `Unsure ${e.beforeConfidence}%` : `${e.beforeConfidence}%`}</b><ArrowRight size={14} />
                  <b className={e.afterConfidence >= e.beforeConfidence ? 'text-green-700' : 'text-red-700'}>{e.afterInsufficient ? `Unsure ${e.afterConfidence}%` : `${e.afterConfidence}%`}</b>
                </div>
                <div className="text-sm text-slate-300 mt-1">Why it matters: {e.reason}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
export const BlockedNote = ({ message }) => <div className="animate-slide flex gap-2 text-sm bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-700"><Ban size={16} className="mt-0.5 shrink-0" />{message}</div>;
