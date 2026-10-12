import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Eye, Pill, Stethoscope, UserRound } from 'lucide-react';
import { usePlayer } from '../App.jsx';
import { api } from '../services/api.js';
import { riskMeter } from '../lib/risk.js';
import { useToast } from '../components/Toasts.jsx';
import { Card, ErrorBanner, SectionTitle, Spinner } from '../components/ui.jsx';
import EvidencePanel, { BlockedNote } from '../components/EvidencePanel.jsx';
import DiagnosisPanel from '../components/DiagnosisPanel.jsx';
import AIAnalysisPanel from '../components/AIAnalysisPanel.jsx';
import BattleScreen from '../components/BattleScreen.jsx';
import RewardScreen from '../components/RewardScreen.jsx';

const GROUPS = [['symptoms', 'Symptoms'], ['vitals', 'Vital signs'], ['history', 'Medical history']];
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One mission: investigate -> evidence -> decide -> battle -> rewards. All scoring happens on the server.
export default function CaseScreen({ judge = false, startOpts = {}, onNext, nextLabel = 'Next mission', presenterNote = false }) {
  const { player, setPlayer } = usePlayer();
  const toast = useToast();
  const [m, setM] = useState(null);            // mission state from server
  const [dx, setDx] = useState(null);
  const [conf, setConf] = useState(50);
  const [busyTest, setBusyTest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [blockedMsgs, setBlockedMsgs] = useState([]);
  const [endAt, setEndAt] = useState(null);
  const [secs, setSecs] = useState(null);
  const [intro, setIntro] = useState(true);
  const decisionRisk = useRef('MODERATE');
  const evidenceRef = useRef(null);
  const submitted = useRef(false); // guards double-clicks

  useEffect(() => {
    if (!player) return;
    let live = true;
    api.startGame({ playerId: player.id, judge, ...startOpts }).then((g) => {
      if (!live) return;
      setM(g); setDx(g.draftDx); if (g.secsLeft != null) setEndAt(Date.now() + g.secsLeft * 1000);
      setTimeout(() => live && setIntro(false), 1500);
    }).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [player?.id]);

  useEffect(() => { // countdown, derived from a fixed end time so it is accurate and stops when the round ends
    if (!judge || !endAt || result) return;
    const tick = () => setSecs(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    tick(); const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [judge, endAt, result]);

  if (!player) return <Card className="p-8 text-center">Please <Link className="text-blue-700 underline" to="/">enter your name on the Dashboard</Link> first.</Card>;
  if (error && !m) return <div className="space-y-3"><ErrorBanner message={error} /><Link to="/" className="underline text-blue-700">Back to Command Center</Link></div>;
  if (!m) return <Spinner text="Preparing mission..." />;
  const c = m.case, expired = judge && secs === 0 && !result;

  const requestTest = async (testId) => {
    setBusyTest(testId); setError('');
    try {
      const [r] = await Promise.all([api.requestEvidence({ playerId: player.id, missionId: m.missionId, testId, draftDx: dx }), sleep(900)]);
      if (r.blocked) setBlockedMsgs((b) => [...b, r.message]);
      else {
        if (r.entry.points) toast({ kind: 'xp', title: `New clue! +${r.entry.points} pts`, text: `${r.entry.test.label} was a useful request.` });
        if (r.missionDone) toast({ kind: 'xp', title: 'Mission complete', text: `${r.missionDone.title}: +${r.missionDone.xp} XP` });
      }
      setM(r);
      api.getPlayer(player.id).then(setPlayer).catch(() => {});
    } catch (e) { setError(e.message); } finally { setBusyTest(null); }
  };

  const submit = async () => {
    if (!dx) return setError('Please choose a diagnosis (or "Insufficient information") before submitting.');
    if (submitted.current) return;
    submitted.current = true; setSubmitting(true); setError('');
    try {
      decisionRisk.current = riskMeter({ dx, conf, ai: m.ai }).level;
      const r = await api.submit({ playerId: player.id, missionId: m.missionId, diagnosis: dx, confidence: conf });
      setResult(r); setPlayer(r.player); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { submitted.current = false; setError(e.message); } finally { setSubmitting(false); }
  };

  const onRevealed = () => {
    setRevealed(true);
    const r = result.rewards; if (!r) return;
    if (r.levelUp) toast({ kind: 'level', title: `LEVEL UP: ${r.levelUp.title}`, text: `You reached level ${r.levelUp.to}.` });
    r.newBadges.forEach((b) => toast({ kind: 'badge', title: `Achievement unlocked: ${b.name}`, text: `${b.desc} (+${b.xp} XP)` }));
    r.missionsDone.forEach((x) => toast({ kind: 'xp', title: 'Mission complete', text: `${x.title}: +${x.xp} XP` }));
  };

  return (
    <div className="space-y-5 relative">
      {intro && <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#06101f]/80 mission-intro"><div className="text-center"><div className="text-sm text-cyan-300 tracking-[.5em]">{judge ? 'JUDGE CHALLENGE' : 'MISSION START'}</div><div className="text-4xl font-black text-white">Patient {c.id.toUpperCase()}</div></div></div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-blue-700 tracking-widest">{judge ? 'JUDGE MODE · BLIND DUEL' : 'MISSION'} · DIFFICULTY {c.difficulty}/5{m.replay && ' · PRACTICE REPLAY (no rewards)'}</div>
          <h1 className="text-2xl font-black text-[#0b1f3a]">Patient {c.id.toUpperCase()}: {c.age}y {c.gender}</h1>
          <div className="text-xs text-slate-500">Synthetic educational case · educational simulation, not medical advice</div>
        </div>
        {judge && !result && secs != null && <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg border ${secs <= 20 ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' : 'bg-white border-slate-300'}`} role="timer"><Clock size={18} /> {fmt(secs)}{expired && <span className="text-sm font-sans">Time is up: decide now</span>}</div>}
      </div>
      {presenterNote && m.scenario && <div className="flex items-center gap-2 text-sm bg-purple-50 border border-purple-200 text-purple-900 rounded-lg px-4 py-2"><Eye size={16} /> Presenter note: {m.scenario}</div>}
      {expired && <div className="text-sm bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-2">The timer ended. You may still submit; if you are unsure, "Insufficient information" is always a safe, honest choice.</div>}
      <ErrorBanner message={error} onClose={() => setError('')} />

      {result ? (
        <div className="space-y-5">
          <BattleScreen result={result} decisionRisk={decisionRisk.current} onDone={onRevealed} />
          {revealed && <>
            <RewardScreen result={result} />
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onNext(c.id)} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg">{nextLabel} <ArrowRight size={16} /></button>
              <button onClick={() => setReview(!review)} className="flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 bg-white font-semibold"><BookOpen size={16} /> {review ? 'Hide' : 'Review'} case</button>
              <Link to="/leaderboard" className="px-6 py-3 rounded-lg border border-slate-300 bg-white font-semibold">Leaderboard</Link>
            </div>
            {review && <Card><SectionTitle icon={BookOpen}>Case review</SectionTitle><div className="p-5 grid md:grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs font-semibold text-slate-500 mb-1">PRESENTATION</div><ul className="space-y-1">{c.findings.map((f, i) => <li key={i} className="bg-slate-50 rounded px-2 py-1">{f.label}</li>)}</ul></div>
              <div><div className="text-xs font-semibold text-slate-500 mb-1">ALL TEST RESULTS</div><ul className="space-y-1">{result.allTests.map((t, i) => <li key={i} className="bg-slate-50 rounded px-2 py-1">{t.label}: {t.result} <span className="text-xs text-slate-500">{t.requested ? '(you requested)' : '(not requested)'}</span></li>)}</ul></div>
              <div className="md:col-span-2"><AIAnalysisPanel ai={result.ai.analysis} full /></div></div></Card>}
          </>}
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <Card>
              <SectionTitle icon={UserRound}>Available Evidence</SectionTitle>
              <div className="p-5 space-y-4">
                <div><div className="text-xs font-semibold text-slate-500">CHIEF COMPLAINT</div><div className="text-lg font-semibold">{c.complaint}</div></div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {GROUPS.map(([k, label]) => (
                    <div key={k}><div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1"><Stethoscope size={12} />{label.toUpperCase()}</div>
                      <ul className="space-y-1 text-sm">{c.findings.filter((f) => f.cat === k).map((f, i) => <li key={i} className="bg-slate-50 rounded px-2 py-1">{f.label}</li>)}{!c.findings.some((f) => f.cat === k) && <li className="text-xs text-slate-400 italic">Not shared by patient</li>}</ul></div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700"><Pill size={14} /> Medications: {c.medications.join(', ')}</div>
              </div>
            </Card>
            <div ref={evidenceRef} className="space-y-3">
              <EvidencePanel tests={c.tests} requested={m.requested} log={m.log} onRequest={requestTest} busyTest={busyTest} budget={m.budget} budgetLeft={m.budgetLeft} blind={judge} disabled={submitting} />
              {blockedMsgs.map((b, i) => <BlockedNote key={i} message={b} />)}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <AIAnalysisPanel ai={m.ai} />
            <DiagnosisPanel options={c.options} dx={dx} setDx={setDx} conf={conf} setConf={setConf} onSubmit={submit} busy={submitting} ai={m.ai} expired={expired} onMore={() => evidenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
          </div>
        </div>
      )}
    </div>
  );
}
