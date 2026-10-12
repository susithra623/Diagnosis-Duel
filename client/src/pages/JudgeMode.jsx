import { useEffect, useState } from 'react';
import { Gavel, ListOrdered, RotateCcw, Shuffle, Trophy, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../App.jsx';
import { api } from '../services/api.js';
import { Card, ErrorBanner } from '../components/ui.jsx';
import CaseScreen from './CaseScreen.jsx';

const NOTES = ['1. Easy: correct diagnosis', '2. Ambiguous: AI says "insufficient information"', '3. Fever is a distractor: human and AI may disagree', '4. Looks like heartburn: overconfidence is penalised', '5. New evidence changes AI confidence'];

export default function JudgeMode() {
  const { player, signIn } = usePlayer();
  const [name, setName] = useState('');
  const [mode, setMode] = useState(null); // null | 'random' | 'script' | 'resume'
  const [idx, setIdx] = useState(0);
  const [played, setPlayed] = useState([]);
  const [seq, setSeq] = useState([]);
  const [duration, setDuration] = useState(120);
  const [err, setErr] = useState('');
  useEffect(() => { api.meta().then((m) => { setSeq(m.judgeSequence); setDuration(m.config.judgeSeconds); }).catch(() => {}); }, []);

  const enter = () => (name.trim() ? signIn(name).then(() => setName('')).catch((e) => setErr(e.message)) : setErr('Enter the judge or team name first.'));
  const begin = (m) => { setPlayed([]); setIdx(0); setMode(m); };

  if (!mode) return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-center"><div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-700 mb-2"><Gavel size={28} /></div><h1 className="text-3xl font-black text-[#0b1f3a]">Judge Mode</h1>
        <p className="text-slate-500 mt-1">Live challenge: the AI's diagnosis stays hidden until you submit. Results feed the leaderboard.</p></div>
      <ErrorBanner message={err} onClose={() => setErr('')} />
      <Card className="p-5 space-y-3"><div className="flex items-center gap-2 font-bold"><UserRound size={18} /> Player / team</div>
        <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enter()} placeholder={player ? `Playing as ${player.name} (type a name to switch)` : 'Enter judge or team name'} className="flex-1 border border-slate-300 rounded-lg px-3 py-2" />
          <button onClick={enter} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 rounded-lg">{player ? 'Switch' : 'Enter'}</button></div>
        <label className="flex items-center gap-2 text-sm">Time per case <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="border border-slate-300 rounded-lg px-2 py-1">{[60, 90, 120, 180, 300].map((s) => <option key={s} value={s}>{s / 60 >= 1 && s % 60 === 0 ? `${s / 60} min` : `${s} s`}</option>)}</select></label></Card>
      {player && <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3"><div className="flex items-center gap-2 font-bold"><Shuffle size={18} className="text-blue-700" /> Fresh random case</div><p className="text-sm text-slate-500">A case this player has not completed yet.</p>
          <button onClick={() => begin('random')} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg">Start challenge</button></Card>
        <Card className="p-5 space-y-3"><div className="flex items-center gap-2 font-bold"><ListOrdered size={18} className="text-amber-500" /> Scripted 5-case demo</div>
          <ul className="text-sm text-slate-500 space-y-0.5">{NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
          <button onClick={() => begin('script')} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg">Start scripted demo</button></Card>
        {player.activeJudge && <Card className="p-5 md:col-span-2 flex items-center justify-between"><span className="text-sm">You have an unfinished judge case.</span><button onClick={() => begin('resume')} className="flex items-center gap-2 border border-cyan-400 text-blue-700 font-semibold px-4 py-2 rounded-lg"><RotateCcw size={16} /> Resume</button></Card>}
      </div>}
    </div>
  );

  const done = mode === 'script' && idx >= seq.length;
  if (done) return (
    <Card className="max-w-xl mx-auto p-8 text-center space-y-4"><Trophy className="mx-auto text-amber-500" size={40} /><h2 className="text-2xl font-black">Demo complete</h2>
      <p className="text-slate-500">Score <b className="text-slate-100">{player.score}</b> · XP <b className="text-slate-100">{player.xp}</b> · Trust <b className="text-slate-100">{player.trust}</b>/100 · Rank <b className="text-slate-100">#{player.rank}</b></p>
      <div className="flex gap-3 justify-center"><Link to="/leaderboard" className="bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg">Leaderboard</Link><button onClick={() => setMode(null)} className="border border-slate-300 font-semibold px-5 py-2.5 rounded-lg">Back to Judge Mode</button></div></Card>
  );

  const startOpts = mode === 'resume' ? { continue: true } : mode === 'script' ? { forceCaseId: seq[idx], duration } : { judgeRandom: true, exclude: played, duration };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>{mode === 'script' ? `Scripted demo · case ${idx + 1} of ${seq.length}` : `Judge challenge · case ${idx + 1}`} · {player.name}</span><button onClick={() => setMode(null)} className="underline">Leave Judge Mode</button></div>
      <CaseScreen key={`${mode}-${idx}`} judge startOpts={startOpts} presenterNote={mode === 'script'} nextLabel={mode === 'script' && idx === seq.length - 1 ? 'Finish demo' : 'Next case'}
        onNext={(id) => { setPlayed((p) => [...p, id]); if (mode === 'resume') setMode('random'); setIdx(idx + 1); }} />
    </div>
  );
}
