import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { Activity, Archive as ArchiveIcon, Award, Gavel, LayoutDashboard, Play, ShieldCheck, Trophy } from 'lucide-react';
import { api } from './services/api.js';
import Dashboard from './pages/Dashboard.jsx';
import CaseScreen from './pages/CaseScreen.jsx';
import JudgeMode from './pages/JudgeMode.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import ConsentCenter from './pages/ConsentCenter.jsx';
import Achievements from './pages/Achievements.jsx';
import Archive from './pages/Archive.jsx';
import { ToastProvider } from './components/Toasts.jsx';

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

const links = [
  ['/', 'Dashboard', LayoutDashboard], ['/play', 'Play', Play], ['/judge', 'Judge Mode', Gavel], ['/leaderboard', 'Leaderboard', Trophy], ['/achievements', 'Achievements', Award], ['/archive', 'Archive', ArchiveIcon], ['/consent', 'Consent Center', ShieldCheck],
];

export default function App() {
  const [player, setPlayer] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore the player from the saved id (if the server still knows them)
  useEffect(() => {
    const id = localStorage.getItem('dd_player');
    if (!id) return setReady(true);
    api.getPlayer(id).then(setPlayer).catch(() => localStorage.removeItem('dd_player')).finally(() => setReady(true));
  }, []);

  const signIn = async (name) => { const p = await api.createPlayer(name); localStorage.setItem('dd_player', p.id); setPlayer(p); };
  const signOut = () => { localStorage.removeItem('dd_player'); setPlayer(null); };

  return (
    <PlayerContext.Provider value={{ player, setPlayer, signIn, signOut, ready }}>
      <ToastProvider>
      <header className="bg-[#0b1f3a] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-lg"><Activity className="text-sky-400" /> Diagnosis Duel</NavLink>
          <nav className="flex flex-wrap gap-1 text-sm">
            {links.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${isActive ? 'bg-white/15' : 'text-slate-300 hover:bg-white/10'}`}>
                <Icon size={15} /> {label}
              </NavLink>
            ))}
          </nav>
          {player && <div className="ml-auto text-sm text-slate-300">Player: <b className="text-white">{player.name}</b> · {player.score} pts</div>}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/play" element={<PlayRoute />} />
          <Route path="/judge" element={<JudgeMode />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/consent" element={<ConsentCenter />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="*" element={<div className="text-center py-20 text-slate-500">Page not found. <NavLink className="underline text-blue-700" to="/">Back to Command Center</NavLink></div>} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-500 pb-8 px-4">
        Educational simulation using synthetic cases only. Not a clinically validated diagnostic device. Do not use for real patient care.
      </footer>
    </ToastProvider>
    </PlayerContext.Provider>
  );
}

// Practice route: resumes the active mission after a refresh. A fresh mission starts only when a button requested it
// (flag in sessionStorage is consumed once), so refreshing never abandons or duplicates a mission.
function PlayRoute() {
  const [fresh] = useState(() => { const f = sessionStorage.getItem('dd_fresh') === '1'; const id = sessionStorage.getItem('dd_force'); sessionStorage.removeItem('dd_fresh'); sessionStorage.removeItem('dd_force'); return { f, id }; });
  const [n, setN] = useState(0);
  const startOpts = n === 0 && !fresh.f ? { continue: true } : n === 0 && fresh.id ? { forceCaseId: fresh.id } : {};
  return <CaseScreen key={n} startOpts={startOpts} onNext={() => setN(n + 1)} />;
}
