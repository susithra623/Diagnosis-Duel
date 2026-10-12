import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Award, Sparkles, Star, TrendingUp } from 'lucide-react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
const ICON = { badge: Award, xp: Star, level: TrendingUp, info: Sparkles };

// Achievement / XP / level-up notifications. Each auto-dismisses after 4.5s (timers cleaned up on unmount).
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { ...t, id }]);
    timers.current.push(setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4500));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-16 right-4 z-50 space-y-2 w-80" role="status" aria-live="polite">
        {items.map((t) => { const Icon = ICON[t.kind] || Sparkles; return (
          <div key={t.id} className={`animate-pop flex gap-3 rounded-xl border p-3 shadow-xl glow ${t.kind === 'badge' ? 'bg-purple-900/90 border-purple-400' : t.kind === 'level' ? 'bg-amber-900/90 border-amber-400' : 'bg-slate-900/95 border-cyan-500'}`}>
            <Icon className="shrink-0 mt-0.5 text-white" size={20} /><div><div className="font-bold text-sm text-white">{t.title}</div><div className="text-xs text-slate-200">{t.text}</div></div>
          </div>); })}
      </div>
    </ToastCtx.Provider>
  );
}
