import { useEffect, useState } from 'react';
import { Flame, Gauge, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { BadgeIcon, Card, SectionTitle, XpBar } from './ui.jsx';

const KIND = { base: 'Base', bonus: 'Calibration bonus', penalty: 'Penalty', evidence: 'Evidence', revision: 'Revision bonus' };
function useCountUp(target) {
  const [v, setV] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setV(Math.round((target * i) / 25)); if (i >= 25) clearInterval(t); }, 25); return () => clearInterval(t); }, [target]);
  return v;
}

export default function RewardScreen({ result }) {
  const { score, rewards: r, player: p } = result;
  const shown = useCountUp(score.total);
  return (
    <Card className="animate-slide">
      <SectionTitle icon={Gauge}>Mission Rewards</SectionTitle>
      {result.replay && <div className="m-5 mb-0 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">Practice replay: you already completed this case, so no points, XP, streak or Trust changes were applied. Feedback below is for learning.</div>}
      <div className="p-5 grid md:grid-cols-2 gap-6">
        <div>
          <div className={`text-5xl font-black ${score.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>{shown > 0 ? '+' : ''}{shown}<span className="text-base text-slate-500 font-semibold"> final score</span></div>
          <ul className="mt-3 space-y-1.5 text-sm">{score.items.map((it, i) => <li key={i} className="flex justify-between gap-3 border-b border-slate-100 pb-1"><span><span className="text-xs text-slate-500">{KIND[it.kind]} · </span>{it.label}</span><b className={it.points >= 0 ? 'text-green-700' : 'text-red-700'}>{it.points > 0 ? '+' : ''}{it.points}</b></li>)}</ul>
          <p className="mt-3 text-sm text-slate-200">{score.feedback}</p>
          {score.penaltyNote && <div className="mt-2 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">{score.penaltyNote}</div>}
        </div>
        {r && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Star size={14} /> XP EARNED</div>
              <div className="text-3xl font-black text-purple-400">+{r.xpGain + r.missionXp + r.badgeXp} XP</div>
              <div className="text-xs text-slate-500">Round {r.xpGain} · missions {r.missionXp} · badges {r.badgeXp}</div>
              {r.levelUp && <div className="mt-2 animate-pop rounded-lg border border-amber-400 bg-amber-50 p-3 font-bold text-amber-700 flex items-center gap-2"><TrendingUp size={18} /> LEVEL UP! Level {r.levelUp.to}: {r.levelUp.title}</div>}
              <div className="mt-2"><div className="text-sm mb-1">Level {p.level}: {p.levelTitle}</div><XpBar xp={p.xp} from={p.levelXp} to={p.nextXp} /></div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={14} /> TRUST SCORE</div>
              <div className="text-3xl font-black text-[#0b1f3a]">{r.trustAfter}<span className="text-base text-slate-500">/100</span>
                <span className={`ml-2 text-base ${r.trustAfter - r.trustBefore >= 0 ? 'text-green-700' : 'text-red-700'}`}>{r.trustAfter - r.trustBefore >= 0 ? '▲' : '▼'} {Math.abs(r.trustAfter - r.trustBefore)}</span></div>
              <div className="text-sm text-slate-300">{p.trustMessage}</div>
            </div>
            <div className="flex items-center gap-2 text-sm"><Flame size={16} className="text-orange-400" /> Streak: <b>{p.streak}</b> (best {p.bestStreak})</div>
            {r.missionsDone.length > 0 && <div className="text-sm text-green-700">Mission complete: {r.missionsDone.map((m) => `${m.title} (+${m.xp} XP)`).join(', ')}</div>}
            {r.newBadges.length > 0 && <div className="space-y-2">{r.newBadges.map((b) => <div key={b.id} className="animate-pop flex items-center gap-3 rounded-lg border border-purple-400 bg-purple-50 p-3"><span className="text-purple-300"><BadgeIcon name={b.icon} /></span><div><div className="font-bold text-sm">Achievement unlocked: {b.name}</div><div className="text-xs text-slate-300">{b.desc} · +{b.xp} XP</div></div></div>)}</div>}
          </div>
        )}
      </div>
    </Card>
  );
}
