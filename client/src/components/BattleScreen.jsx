import { useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, FastForward, HelpCircle, Stethoscope, Swords, XCircle } from 'lucide-react';
import { Card, ConfidenceMeter, RiskBadge } from './ui.jsx';
import { riskMeter } from '../lib/risk.js';

const OUT = { correct: ['Correct', 'bg-green-100 text-green-800 border-green-300', CheckCircle2], wrong: ['Incorrect', 'bg-red-100 text-red-800 border-red-300', XCircle], uncertain: ['Uncertain', 'bg-amber-100 text-amber-800 border-amber-300', HelpCircle] };
const Pill = ({ outcome, who }) => { const [l, c, I] = OUT[outcome]; return <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-semibold text-sm animate-pop ${c}`}><I size={15} /> {who}: {l}</div>; };
const List = ({ title, items }) => <div className="text-left"><div className="text-xs font-semibold text-slate-500 mb-1">{title}</div><ul className="text-sm list-disc pl-4 space-y-0.5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;

// Staged reveal: lock -> human -> AI -> reference answer. Timers are cleaned up on unmount; "Skip" jumps to the end.
export default function BattleScreen({ result, ai0, decisionRisk, onDone }) {
  const [stage, setStage] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    const ts = [setTimeout(() => setStage(1), 500), setTimeout(() => setStage(2), 1500), setTimeout(() => setStage(3), 2800)];
    return () => ts.forEach(clearTimeout);
  }, []);
  useEffect(() => { if (stage >= 3 && !fired.current) { fired.current = true; onDone(); } }, [stage]);
  const a = result.ai.analysis, d = result.doctor, show = (n) => (stage >= n ? 'animate-slide' : 'opacity-0');
  return (
    <Card className="overflow-hidden glow">
      <div className="bg-[#0b1f3a] text-white text-center py-2 font-semibold tracking-widest text-sm flex items-center justify-center gap-2"><Swords size={16} /> DIAGNOSIS DUEL {stage < 3 && <button onClick={() => setStage(3)} className="ml-3 text-xs flex items-center gap-1 opacity-80 hover:opacity-100"><FastForward size={12} /> skip</button>}</div>
      <div className="grid md:grid-cols-[1fr_auto_1fr] items-stretch">
        <div className={`p-5 text-center ${show(1)}`}>
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-300"><Stethoscope size={18} /> HUMAN CLINICIAN <span className="text-xs text-slate-500">🔒 locked</span></div>
          <div className="text-xs text-slate-500 mt-3">Selected diagnosis</div><div className="text-xl font-bold text-[#0b1f3a]">{d.name}</div>
          <div className="text-xs text-slate-500 mt-2">Confidence</div><div className="text-3xl font-black">{d.confidence}%</div>
          <div className="mt-2 text-sm">Evidence reviewed: <b>{d.evidenceReviewed}</b> items · Decision risk: <RiskBadge level={decisionRisk} /></div>
          {stage >= 3 && <Pill outcome={d.outcome} who="You" />}
        </div>
        <div className="flex items-center justify-center text-3xl font-black text-cyan-400 px-3 py-2">VS</div>
        <div className={`p-5 text-center ${show(2)}`}>
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-300"><Bot size={18} /> AI OPPONENT <span className="text-xs text-slate-500">rule-based</span></div>
          <div className="text-xs text-slate-500 mt-3">AI result</div><div className="text-xl font-bold text-[#0b1f3a]">{result.ai.name}</div>
          <div className="text-xs text-slate-500 mt-2">Confidence estimate</div><div className="text-3xl font-black">{a.confidence}%</div>
          <div className="mt-2 text-sm">Uncertainty: <b>{a.uncertainty}</b></div>
          <div className="mt-2 space-y-1">{a.ranked.map((r) => <div key={r.id} className="flex items-center gap-2 text-xs"><span className="w-36 truncate text-left">{r.name}</span><div className="flex-1"><ConfidenceMeter value={r.p} height="h-1.5" /></div><span>{r.p}%</span></div>)}</div>
          {stage >= 3 && <Pill outcome={result.ai.outcome} who="AI" />}
        </div>
      </div>
      <div className={`grid md:grid-cols-3 gap-4 px-5 pb-5 ${show(2)}`}>
        <List title="AI: SUPPORTING EVIDENCE" items={a.evidenceFor.length ? a.evidenceFor.slice(0, 4) : ['None strong enough']} />
        <List title="AI: MISSING INFORMATION" items={a.missing.length ? a.missing : ['Nothing critical']} />
        <List title="AI: ALTERNATIVES" items={a.ranked.slice(1).map((r) => `${r.name} (${r.p}%)`)} />
      </div>
      <div className={`border-t border-slate-200 bg-slate-50 p-5 text-center ${show(3)}`}>
        <div className="text-xs font-semibold text-slate-500 tracking-widest">REFERENCE ANSWER</div>
        <div className="text-3xl font-black text-green-700 animate-pop">{result.truth.name}</div>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl mx-auto">{result.truth.explanation}</p>
        {result.aiNote && <p className="mt-2 text-sm text-amber-700 font-semibold">{result.aiNote}</p>}
        <div className="mt-3 inline-block text-sm font-semibold px-3 py-1 rounded-full bg-white border border-slate-300">
          {result.winner === 'none' ? 'Practice replay: no score change' : result.winner === 'doctor' ? `You win the round (${d.score} vs AI ${result.ai.score})` : result.winner === 'ai' ? `AI wins the round (${result.ai.score} vs your ${d.score})` : `Draw (${d.score} each)`}
        </div>
        <div className="text-xs text-slate-500 mt-2">Rounds are judged on correctness and calibrated confidence against the reference answer, never on who sounds more sure.</div>
      </div>
    </Card>
  );
}
