import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

export const Card = ({ className = '', children }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
);

export const SectionTitle = ({ icon: Icon, children, right }) => (
  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
      {Icon && <Icon size={16} className="text-blue-700" />} {children}
    </h3>
    {right}
  </div>
);

const RISK = {
  High: 'bg-red-50 text-red-700 border-red-200', HIGH: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200', MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200', Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-green-50 text-green-700 border-green-200', LOW: 'bg-green-50 text-green-700 border-green-200',
  Unknown: 'bg-slate-100 text-slate-600 border-slate-200',
};
export const RiskBadge = ({ level }) => {
  const Icon = /high/i.test(level) ? ShieldAlert : /low/i.test(level) ? ShieldCheck : AlertTriangle;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${RISK[level] || RISK.Unknown}`}><Icon size={12} />{String(level).toUpperCase()}</span>;
};

// Horizontal confidence meter. Amber when the AI is unsure, green when high, blue otherwise.
export const ConfidenceMeter = ({ value, insufficient, height = 'h-3' }) => {
  const color = insufficient ? 'bg-amber-500' : value >= 80 ? 'bg-green-500' : 'bg-blue-600';
  return (
    <div className={`w-full ${height} bg-slate-200 rounded-full overflow-hidden`}>
      <div className={`${height} ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.max(2, value)}%` }} />
    </div>
  );
};

export const ErrorBanner = ({ message, onClose }) =>
  message ? (
    <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
      <span className="flex items-center gap-2"><AlertTriangle size={16} /> {message}</span>
      {onClose && <button onClick={onClose} className="font-semibold">Dismiss</button>}
    </div>
  ) : null;

export const Spinner = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-20 text-slate-500"><div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />{text}</div>
);

import { Award, CircleHelp, Flame, RefreshCw, Search, ShieldCheck as SC, Sparkles, Target, Trophy } from 'lucide-react';
const BICON = { Search, CircleHelp, Target, Trophy, ShieldCheck: SC, RefreshCw, Sparkles, Flame };
export const BadgeIcon = ({ name, size = 24 }) => { const I = BICON[name] || Award; return <I size={size} />; };

export const XpBar = ({ xp, from, to }) => (
  <div>
    <div className="h-3 rounded-full bg-slate-200 overflow-hidden"><div className="h-3 grad-xp rounded-full transition-all duration-1000" style={{ width: `${to ? Math.min(100, ((xp - from) / (to - from)) * 100) : 100}%` }} /></div>
    <div className="flex justify-between text-xs text-slate-500 mt-1"><span>{xp} XP</span><span>{to ? `${to - xp} XP to next level` : 'MAX LEVEL'}</span></div>
  </div>
);
export const Avatar = ({ name, size = 56 }) => (
  <div className="rounded-2xl grad-xp flex items-center justify-center font-black text-white shrink-0" style={{ width: size, height: size, fontSize: size / 2.4 }}>{(name || '?').trim().slice(0, 2).toUpperCase()}</div>
);
