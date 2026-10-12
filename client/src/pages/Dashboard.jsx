import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Archive, Award, CheckCircle2, Flame, Gavel, Play, RotateCcw, ShieldCheck, Target, Trophy, UserRound } from 'lucide-react';
import { usePlayer } from '../App.jsx';
import { Avatar, BadgeIcon, Card, ConfidenceMeter, ErrorBanner, SectionTitle, Spinner, XpBar } from '../components/ui.jsx';

const Stat = ({ label, value, sub }) => <Card className="p-4"><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div><div className="text-3xl font-black text-[#0b1f3a] mt-1">{value}</div>{sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}</Card>;
const Act = ({ icon: I, label, onClick, cls = 'bg-white border border-slate-300 hover:bg-slate-50', disabled, sub }) => (
  <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center justify-center gap-1 font-semibold py-4 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}><span className="flex items-center gap-2"><I size={18} /> {label}</span>{sub && <span className="text-xs font-normal opacity-80">{sub}</span>}</button>
);

export default function Dashboard() {
  const { player: p, signIn, signOut, ready } = usePlayer();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  if (!ready) return <Spinner />;

  if (!p) {
    const go = () => (name.trim() ? signIn(name).catch((e) => setErr(e.message)) : setErr('Please enter a name to start.'));
    return (
      <div className="max-w-xl mx-auto mt-10 animate-slide">
        <div className="text-center mb-6"><div className="inline-flex p-3 rounded-2xl grad-xp text-white mb-3"><Activity size={32} /></div>
          <h1 className="text-3xl font-black text-[#0b1f3a]">Diagnosis Duel</h1><p className="text-slate-500 mt-2">From AI Prediction to Trustworthy Decision-Making.</p></div>
        <Card className="p-6 space-y-4"><ErrorBanner message={err} />
          <label className="text-sm font-semibold" htmlFor="pname">Enter your name or team name</label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} placeholder="e.g. Team Nova" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
          <button onClick={go} className="w-full flex items-center justify-center gap-2 bg-[#0b1f3a] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg"><UserRound size={16} /> Enter Command Center</button></Card>
      </div>
    );
  }
  const fresh = () => { sessionStorage.setItem('dd_fresh', '1'); nav('/play'); };
  return (
    <div className="space-y-6">
      <Card className="p-6 glow"><div className="flex flex-wrap items-center gap-5">
        <Avatar name={p.name} size={72} />
        <div className="flex-1 min-w-60">
          <div className="text-xs font-semibold tracking-widest text-cyan-300">CLINICAL COMMAND CENTER</div>
          <h1 className="text-2xl md:text-3xl font-black">{p.name}</h1>
          <div className="text-purple-300 font-semibold">Level {p.level} · {p.levelTitle}</div>
          <div className="mt-2 max-w-xl"><XpBar xp={p.xp} from={p.levelXp} to={p.nextXp} /></div>
        </div>
        <div className="text-center"><div className="flex items-center gap-1 text-orange-400 font-black text-3xl"><Flame /> {p.streak}</div><div className="text-xs text-slate-500">current streak</div><button onClick={signOut} className="text-xs text-slate-500 underline mt-2">Switch player</button></div>
      </div></Card>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Stat label="Score" value={p.score} /><Stat label="XP" value={p.xp} />
        <Stat label="Trust Score" value={p.hasTrust ? p.trust : '—'} sub={p.hasTrust ? (p.provisional ? 'provisional' : '/ 100') : 'Not enough rounds yet'} />
        <Stat label="Cases" value={p.completed} sub={`${p.correct} correct`} /><Stat label="Accuracy" value={`${p.accuracy}%`} sub="good decisions" /><Stat label="Rank" value={`#${p.rank}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
        <Act icon={Play} label="Start Mission" onClick={fresh} cls="bg-blue-700 hover:bg-blue-800 text-white" />
        <Act icon={RotateCcw} label="Continue" sub={p.hasActive ? 'resume investigation' : 'no active case'} onClick={() => nav(p.activeJudge ? '/judge' : '/play')} disabled={!p.hasActive} />
        <Act icon={Gavel} label="Judge Mode" onClick={() => nav('/judge')} cls="bg-amber-500 hover:bg-amber-600 text-white" />
        <Act icon={Trophy} label="Leaderboard" onClick={() => nav('/leaderboard')} />
        <Act icon={Award} label="Achievements" onClick={() => nav('/achievements')} />
        <Act icon={Archive} label="Case Archive" onClick={() => nav('/archive')} />
        <Act icon={ShieldCheck} label="Consent" onClick={() => nav('/consent')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card><SectionTitle icon={Target}>Session Missions</SectionTitle><div className="p-5 space-y-4">
          {p.missions.map((m) => <div key={m.id}><div className="flex justify-between text-sm"><span className="flex items-center gap-1.5">{m.done && <CheckCircle2 size={14} className="text-green-500" />}{m.title}</span><span className="text-purple-300 text-xs font-bold">+{m.xp} XP</span></div><div className="mt-1"><ConfidenceMeter value={(m.progress / m.target) * 100} height="h-1.5" /></div><div className="text-xs text-slate-500">{m.progress}/{m.target}{m.done ? ' · claimed' : ''}</div></div>)}
        </div></Card>
        <Card><SectionTitle icon={Award}>Recent Badges</SectionTitle><div className="p-5 space-y-3">
          {p.recentBadges.length ? p.recentBadges.map((b) => <div key={b.id} className="flex items-center gap-3"><span className="p-2 rounded-xl bg-purple-500/25 text-purple-300"><BadgeIcon name={b.icon} /></span><div><div className="font-semibold text-sm">{b.name}</div><div className="text-xs text-slate-500">{b.desc}</div></div></div>) : <div className="text-sm text-slate-500">No badges yet. Request useful evidence or recognize real uncertainty to earn your first.</div>}
          <button onClick={() => nav('/achievements')} className="text-xs text-blue-700 underline">All achievements</button>
        </div></Card>
        <Card><SectionTitle icon={Activity}>Recent Cases</SectionTitle><div className="p-5 space-y-2 text-sm">
          {p.recent.length ? p.recent.map((r, i) => <div key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-1"><span className="truncate">{r.caseId.toUpperCase()} · {r.complaint}</span><b className={r.points >= 0 ? 'text-green-700' : 'text-red-700'}>{r.points > 0 ? '+' : ''}{r.points}</b></div>) : <div className="text-slate-500">No completed cases yet. Start a mission!</div>}
        </div></Card>
      </div>

      <Card className="p-5"><div className="text-xs font-semibold text-slate-500 mb-2">TRUST BREAKDOWN</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          {[['Accuracy', `${p.stats.accuracy}%`], ['Calibration', `${p.stats.calibration}%`], ['Evidence usage', `${p.stats.evidenceUsage}%`], ['Appropriate uncertainty', p.stats.appropriateUncertainty == null ? 'n/a' : `${p.stats.appropriateUncertainty}%`], ['Overconfident rounds', p.stats.overconfidenceCount]].map(([l, v]) => <div key={l}><div className="text-slate-500 text-xs">{l}</div><div className="text-xl font-bold">{v}</div></div>)}
        </div>
        <div className="text-xs text-slate-500 mt-3">Trust Score = average of per-round trust (55% calibration + 25% good decision + 20% evidence use − overconfidence penalty). {p.trustMessage}</div></Card>
      <div className="text-center text-sm text-slate-500">Diagnosis Duel rewards not just getting the answer right, but knowing why, knowing how sure you are, and knowing when you need more evidence.</div>
    </div>
  );
}
