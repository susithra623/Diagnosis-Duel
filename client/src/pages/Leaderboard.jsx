import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Trophy } from 'lucide-react';
import { usePlayer } from '../App.jsx';
import { api } from '../services/api.js';
import { Card, ErrorBanner, SectionTitle, Spinner } from '../components/ui.jsx';

export default function Leaderboard() {
  const { player } = usePlayer();
  const [rows, setRows] = useState(null);
  const [samples, setSamples] = useState(true);
  const [err, setErr] = useState('');
  useEffect(() => { api.leaderboard(samples).then(setRows).catch((e) => setErr(e.message)); }, [samples]);
  if (err) return <ErrorBanner message={err} />;
  if (!rows) return <Spinner />;
  const me = rows.find((r) => r.id === player?.id);
  const podium = rows.slice(0, 3);
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0b1f3a]"><Trophy /> Leaderboard</h1>
        <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={samples} onChange={(e) => setSamples(e.target.checked)} /> Show sample/demo entries</label><Link to="/" className="underline text-blue-700">Back to game</Link></div>
      </div>
      {rows.length === 0 ? <Card className="p-10 text-center text-slate-500">No scores yet. Complete a mission to appear here.</Card> : <>
        <div className="grid md:grid-cols-3 gap-4">
          {podium.map((r, i) => <Card key={r.id} className={`p-5 text-center ${i === 0 ? 'glow border-amber-400' : ''}`}><Crown className={`mx-auto ${['text-amber-400', 'text-slate-300', 'text-orange-400'][i]}`} /><div className="text-xs text-slate-500">#{r.rank}</div><div className="font-black text-lg">{r.name}{r.sample && <span className="ml-1 text-xs text-slate-500">(sample)</span>}</div><div className="text-3xl font-black text-[#0b1f3a]">{r.score}</div><div className="text-xs text-slate-500">Trust {r.trust} · Level {r.level}</div></Card>)}
        </div>
        {me ? <div className="rounded-xl border border-cyan-400 bg-blue-50 p-4 text-sm">Your rank: <b>#{me.rank}</b> of {rows.length} · {me.score} pts · Trust {me.trust} · Level {me.level}</div> : player && <div className="text-sm text-slate-500">Complete a case to enter the ranking.</div>}
        <Card className="overflow-hidden"><SectionTitle icon={Trophy}>Rankings</SectionTitle>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Rank', 'Player', 'Score', 'Cases', 'Accuracy', 'Trust', 'Level', 'Badges'].map((h) => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id} className={`border-t border-slate-100 ${r.id === player?.id ? 'bg-blue-50 font-semibold' : ''}`}>
              <td className="px-4 py-3">#{r.rank}</td><td className="px-4 py-3">{r.name}{r.id === player?.id && <span className="ml-2 text-xs bg-blue-700 text-white px-2 py-0.5 rounded-full">You</span>}{r.sample && <span className="ml-2 text-xs border border-slate-500 text-slate-400 px-1.5 rounded">SAMPLE</span>}</td>
              <td className="px-4 py-3">{r.score}</td><td className="px-4 py-3">{r.completed}</td><td className="px-4 py-3">{r.accuracy}%</td><td className="px-4 py-3">{r.trust}</td><td className="px-4 py-3">L{r.level}</td><td className="px-4 py-3">{r.badges}</td></tr>)}</tbody></table></div>
          <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">Sorted by total score, then Trust Score, then accuracy. Accuracy counts correct diagnoses and justified "insufficient information" answers. Real entries live in server memory unless MongoDB is configured, so they reset when the server restarts. Sample entries are static demo data.</div></Card>
      </>}
    </div>
  );
}
