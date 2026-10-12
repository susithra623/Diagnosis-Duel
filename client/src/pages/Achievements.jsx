import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { usePlayer } from '../App.jsx';
import AchievementPanel from '../components/AchievementPanel.jsx';
import { Card } from '../components/ui.jsx';

export default function Achievements() {
  const { player } = usePlayer();
  if (!player) return <Card className="p-8 text-center">Please <Link className="text-blue-700 underline" to="/">enter your name</Link> first.</Card>;
  const n = player.badges.filter((b) => b.earned).length;
  return (
    <div className="space-y-5">
      <div><h1 className="flex items-center gap-2 text-2xl font-black text-[#0b1f3a]"><Award /> Achievements</h1><p className="text-slate-500 text-sm">{n} of {player.badges.length} unlocked. Each badge pays +25 XP once and cannot be farmed.</p></div>
      <AchievementPanel badges={player.badges} />
      <Card className="p-5"><div className="font-semibold mb-3">Levels</div><div className="grid md:grid-cols-5 gap-3 text-sm">
        {player.levels.map((l) => <div key={l.n} className={`rounded-lg border p-3 ${player.level >= l.n ? 'border-purple-400 bg-purple-50' : 'border-slate-300 opacity-70'}`}><div className="text-xs text-slate-500">Level {l.n} · {l.xp} XP</div><div className="font-bold">{l.title}</div><div className="text-xs text-slate-500">{l.desc}</div></div>)}
      </div></Card>
    </div>
  );
}
