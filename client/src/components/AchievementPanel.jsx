import { Lock } from 'lucide-react';
import { BadgeIcon, Card, ConfidenceMeter } from './ui.jsx';

// Full badge grid: locked / unlocked state, unlock condition, XP reward, progress.
export default function AchievementPanel({ badges = [], compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
      {badges.map((b) => (
        <Card key={b.id} className={`p-4 ${b.earned ? 'glow border-purple-400' : 'opacity-70'}`}>
          <div className="flex items-start justify-between"><div className={`p-2 rounded-xl ${b.earned ? 'bg-purple-500/25 text-purple-300' : 'bg-slate-200 text-slate-500'}`}>{b.earned ? <BadgeIcon name={b.icon} /> : <Lock size={24} />}</div><span className="text-xs font-bold text-purple-300">+{b.xp} XP</span></div>
          <div className="mt-2 font-bold">{b.name}</div>
          <div className="text-xs text-slate-500 min-h-8">{b.desc}</div>
          {b.earned ? <div className="mt-2 text-xs text-green-700 font-semibold">Unlocked {new Date(b.at).toLocaleDateString()}</div>
            : <div className="mt-2"><ConfidenceMeter value={(b.progress / b.target) * 100} height="h-1.5" /><div className="text-xs text-slate-500 mt-1">{b.progress}/{b.target}</div></div>}
        </Card>
      ))}
    </div>
  );
}
