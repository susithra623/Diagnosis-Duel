// ALL game rules live here (scoring, XP, levels, trust, badges, missions). Routes only call these functions.
const UNSURE = 'INSUFFICIENT';

// Configurable prototype parameters (NOT validated clinical values)
const CONFIG = {
  correct: 80, calibrationBonus: 20, insufficientOk: 80, insufficientMisleading: 40, insufficientNeedless: 10,
  wrongLow: -20, wrongMid: -50, wrongHigh: -100, evidencePerTest: 20, revisionBonus: 30,
  budget: 3, completeXp: 10, judgeSeconds: 120,
};

// Level thresholds by total XP
const LEVELS = [
  { n: 1, title: 'Rookie Investigator', xp: 0, desc: 'Basic, relatively clear cases' },
  { n: 2, title: 'Clinical Detective', xp: 80, desc: 'More symptoms and clues' },
  { n: 3, title: 'Evidence Strategist', xp: 200, desc: 'Cases that need evidence collection' },
  { n: 4, title: 'Uncertainty Specialist', xp: 350, desc: 'Ambiguous, incomplete information' },
  { n: 5, title: 'Diagnosis Duel Master', xp: 550, desc: 'Complex, careful decisions' },
];
const levelFor = (xp) => [...LEVELS].reverse().find((l) => xp >= l.xp);

// ---- Round scoring. evidenceStrength = the engine's confidence given the evidence the player had.
function scoreRound({ dx, conf, truth, aiInsufficient, aiCorrect, evidenceStrength, usefulTests = 0, evidencePts = 0, changedCorrectly = false }) {
  const items = [];
  let outcome, calibration, good, bonusEarned = false;
  const justified = conf <= evidenceStrength + 25; // confidence not far above what the evidence supports
  if (dx === UNSURE) {
    outcome = 'uncertain';
    if (aiInsufficient) { items.push(['Honest uncertainty: evidence was genuinely insufficient', CONFIG.insufficientOk, 'base']); calibration = 1; good = true; }
    else if (!aiCorrect) { items.push(['Cautious when the available evidence was misleading', CONFIG.insufficientMisleading, 'base']); calibration = 0.8; good = true; }
    else { items.push(['"Not sure" although the evidence pointed to an answer', CONFIG.insufficientNeedless, 'base']); calibration = 0.5; good = false; }
  } else if (dx === truth) {
    outcome = 'correct'; good = true;
    items.push(['Correct diagnosis', CONFIG.correct, 'base']);
    if (justified && conf >= 40) { items.push(['Calibration bonus: confidence matched the evidence', CONFIG.calibrationBonus, 'bonus']); bonusEarned = true; }
    calibration = justified ? 0.4 + 0.6 * Math.min(1, conf / 100) : Math.max(0.2, 1 - (conf - evidenceStrength - 25) / 100);
  } else {
    outcome = 'wrong'; good = false;
    calibration = 1 - conf / 100;
    if (conf < 40) items.push(['Wrong diagnosis, low confidence', CONFIG.wrongLow, 'penalty']);
    else if (conf < 70) items.push(['Wrong diagnosis, medium confidence', CONFIG.wrongMid, 'penalty']);
    else items.push(['CONFIDENT WRONG diagnosis: overconfidence penalty', CONFIG.wrongHigh, 'penalty']);
  }
  if (evidencePts > 0) items.push([`Useful evidence requested (${usefulTests})`, evidencePts, 'evidence']);
  if (changedCorrectly) items.push(['Correctly revised diagnosis after new evidence', CONFIG.revisionBonus, 'revision']);
  const total = items.reduce((s, [, v]) => s + v, 0);
  const overconfident = (outcome === 'wrong' && conf >= 70) || (outcome === 'correct' && !justified);
  // Round trust = 55% calibration + 25% good decision + 20% evidence use, minus overconfidence penalty
  let trust = 0.55 * calibration + 0.25 * (good ? 1 : 0) + 0.2 * (usefulTests > 0 ? 1 : outcome === 'uncertain' && good ? 0.7 : 0.3);
  if (overconfident) trust -= 0.2;
  trust = Math.max(0, Math.min(1, trust));
  // Feedback text always derived from the actual result
  let feedback;
  if (outcome === 'uncertain') feedback = good ? 'You recognized uncertainty instead of making an unsupported guess.' : 'The evidence already pointed to an answer; "not sure" earned very little.';
  else if (outcome === 'correct') feedback = bonusEarned ? 'Excellent: your confidence matched the available evidence.' : 'Correct answer, but your confidence was higher than the evidence justified.';
  else feedback = conf >= 70 ? 'High confidence was not justified by the evidence.' : 'Wrong answer, but your caution limited the damage.';
  if (changedCorrectly) feedback += ' A useful test improved your decision.';
  return { items: items.map(([label, points, kind]) => ({ label, points, kind })), total, outcome, calibration, good, overconfident, calibrated: bonusEarned, roundTrust: trust, feedback };
}

// ---- Trust Score: mean of round trust over the last 20 rounds, x100. Provisional below 3 rounds.
const trustOf = (h) => (h.length ? Math.round((h.slice(-20).reduce((s, r) => s + r.roundTrust, 0) / Math.min(h.length, 20)) * 100) : 0);
function trustMessage(h) {
  if (!h.length) return 'Not enough rounds yet';
  const t = trustOf(h), pre = h.length < 3 ? ' (provisional)' : '';
  if (t >= 80) return 'High trust: your confidence generally matches the available evidence.' + pre;
  if (t >= 60) return 'Moderate trust: mostly calibrated, but some confidence exceeded the evidence.' + pre;
  if (t >= 40) return 'Developing trust: request evidence before committing to high confidence.' + pre;
  return 'Low trust: confident answers are not yet backed by evidence. Say "not sure" when you are not.' + pre;
}
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
function statsOf(p) {
  const h = p.history;
  const opp = h.filter((r) => r.uncertainOpp).length;
  return { accuracy: pct(h.filter((r) => r.good).length, h.length), calibration: h.length ? Math.round((h.reduce((s, r) => s + r.calibration, 0) / h.length) * 100) : 0,
    evidenceUsage: pct(h.filter((r) => r.usedEvidence).length, h.length), appropriateUncertainty: opp ? pct(h.filter((r) => r.outcome === 'uncertain' && r.good).length, opp) : null,
    overconfidenceCount: h.filter((r) => r.overconfident).length, trust: trustOf(h), rounds: h.length };
}

// ---- Achievements (each +25 XP once)
const BADGES = [
  { id: 'detective', icon: 'Search', name: 'Evidence Detective', desc: 'Request useful evidence 3 times', xp: 25, test: (p) => p.usefulEvidenceTotal >= 3, prog: (p) => [p.usefulEvidenceTotal, 3] },
  { id: 'uncertainty', icon: 'CircleHelp', name: 'Uncertainty Master', desc: 'Correctly recognize insufficient information', xp: 25, test: (p) => p.history.some((r) => r.outcome === 'uncertain' && r.good && r.uncertainOpp), prog: (p) => [p.history.filter((r) => r.outcome === 'uncertain' && r.good && r.uncertainOpp).length, 1] },
  { id: 'calibrated', icon: 'Target', name: 'Calibrated Thinker', desc: 'Average calibration of the last 3 rounds ≥ 75%', xp: 25, test: (p) => { const l = p.history.slice(-3); return l.length === 3 && l.reduce((s, r) => s + r.calibration, 0) / 3 >= 0.75; }, prog: (p) => [Math.min(3, p.history.length), 3] },
  { id: 'master', icon: 'Trophy', name: 'Diagnosis Master', desc: '5+ cases with ≥ 80% good decisions', xp: 25, test: (p) => p.history.length >= 5 && p.history.filter((r) => r.good).length / p.history.length >= 0.8, prog: (p) => [Math.min(5, p.history.length), 5] },
  { id: 'riskavoider', icon: 'ShieldCheck', name: 'Risk Avoider', desc: 'No overconfident errors in your last 4 cases', xp: 25, test: (p) => p.history.length >= 4 && !p.history.slice(-4).some((r) => r.overconfident), prog: (p) => [Math.min(4, p.history.length), 4] },
  { id: 'comeback', icon: 'RefreshCw', name: 'Comeback Champion', desc: 'Correctly revise your diagnosis after new evidence', xp: 25, test: (p) => p.history.some((r) => r.revised), prog: (p) => [p.history.filter((r) => r.revised).length, 1] },
  { id: 'perfect', icon: 'Sparkles', name: 'Perfect Investigation', desc: 'Correct + useful evidence + calibration bonus in one case', xp: 25, test: (p) => p.history.some((r) => r.outcome === 'correct' && r.usedEvidence && r.calibrated), prog: (p) => [p.history.filter((r) => r.outcome === 'correct' && r.usedEvidence && r.calibrated).length, 1] },
  { id: 'streak', icon: 'Flame', name: 'Streak Keeper', desc: 'Make 3 good decisions in a row', xp: 25, test: (p) => p.bestStreak >= 3, prog: (p) => [Math.min(3, p.bestStreak), 3] },
];
function checkBadges(p) {
  const fresh = [];
  for (const b of BADGES) if (!p.badges[b.id] && b.test(p)) { p.badges[b.id] = Date.now(); fresh.push(b.id); }
  return fresh;
}
const badgeView = (p) => BADGES.map((b) => { const [v, t] = b.prog(p); return { id: b.id, icon: b.icon, name: b.name, desc: b.desc, xp: b.xp, earned: !!p.badges[b.id], at: p.badges[b.id] || null, progress: Math.min(v, t), target: t }; });

// ---- Session missions (progress persisted on the player profile)
const MISSIONS = [
  { id: 'cases3', title: 'Complete 3 cases', target: 3, xp: 50 },
  { id: 'evidence2', title: 'Request 2 useful pieces of evidence', target: 2, xp: 30 },
  { id: 'unsure1', title: 'Correctly identify an insufficient-information case', target: 1, xp: 40 },
  { id: 'calm1', title: 'Finish a case without unsupported high confidence', target: 1, xp: 30 },
];
// Add progress; returns missions completed by this call (reward paid once)
function bumpMission(p, id, n = 1) {
  const def = MISSIONS.find((m) => m.id === id), s = (p.missions[id] ||= { progress: 0, done: false });
  if (s.done) return null;
  s.progress = Math.min(def.target, s.progress + n);
  if (s.progress >= def.target) { s.done = true; return def; }
  return null;
}
const missionView = (p) => MISSIONS.map((m) => ({ ...m, progress: p.missions[m.id]?.progress || 0, done: !!p.missions[m.id]?.done }));

module.exports = { scoreRound, trustOf, trustMessage, statsOf, checkBadges, badgeView, bumpMission, missionView, levelFor, LEVELS, CONFIG, UNSURE, BADGES, MISSIONS };
