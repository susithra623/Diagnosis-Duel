import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive as ArchiveIcon, Lock } from 'lucide-react';
import { usePlayer } from '../App.jsx';
import { api } from '../services/api.js';
import { Card, ErrorBanner, Spinner } from '../components/ui.jsx';

// Reference answers stay hidden until YOU have completed that case.
export default function Archive() {
  const { player } = usePlayer();
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (player) api.archive(player.id).then(setRows).catch((e) => setErr(e.message)); }, [player?.id]);
  if (!player) return <Card className="p-8 text-center">Please <Link className="text-blue-700 underline" to="/">enter your name</Link> first.</Card>;
  if (err) return <ErrorBanner message={err} />;
  if (!rows) return <Spinner />;
  const play = (id) => { sessionStorage.setItem('dd_fresh', '1'); sessionStorage.setItem('dd_force', id); nav('/play'); };
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-black text-[#0b1f3a]"><ArchiveIcon /> Case Archive</h1>
      <p className="text-sm text-slate-500">All cases are synthetic educational scenarios. Completed cases can be reviewed; replaying a completed case is practice only (no points or XP).</p>
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex justify-between items-start gap-3"><div><div className="text-xs text-slate-500">{c.id.toUpperCase()} · difficulty {c.difficulty}/5 · {c.age}y {c.gender}</div><div className="font-semibold">{c.complaint}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${c.completed ? 'border-green-400 text-green-700' : 'border-slate-500 text-slate-400'}`}>{c.completed ? 'Completed' : 'New'}</span></div>
            {c.completed ? <div className="mt-3 text-sm space-y-1">
              <div>Your answer: <b>{c.last.yourAnswer}</b> · Reference: <b>{c.last.truth}</b> · {c.last.points >= 0 ? '+' : ''}{c.last.points} pts</div>
              <button onClick={() => setOpen(open === c.id ? null : c.id)} className="text-xs text-blue-700 underline">{open === c.id ? 'Hide' : 'Show'} explanation</button>
              {open === c.id && <div className="text-slate-300"><p>{c.last.explanation}</p><ul className="mt-1 list-disc pl-4 text-xs">{c.last.tests.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
            </div> : <div className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Lock size={12} /> Reference answer locked until you complete this case</div>}
            <button onClick={() => play(c.id)} className="mt-3 text-sm font-semibold px-3 py-1.5 rounded-lg border border-cyan-400 text-blue-700 hover:bg-blue-50">{c.completed ? 'Practice replay' : 'Play this case'}</button>
          </Card>
        ))}
      </div>
    </div>
  );
}
