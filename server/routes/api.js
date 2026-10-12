const express = require('express');
const { CASES, JUDGE_SEQUENCE } = require('../data/cases');
const { analyze, maskAi, maskText, explainChange, DEFAULT_CONSENT, CAT_LABEL, CONDITIONS } = require('../services/engine');
const S = require('../services/scoring');
const store = require('../services/store');

const router = express.Router();
const { UNSURE, CONFIG } = S;
const SAMPLES = [
  { id: 's1', name: 'Dr. Alex', score: 820, accuracy: 91, trust: 94, completed: 12, level: 5, badges: 7 },
  { id: 's2', name: 'Team Nova', score: 790, accuracy: 88, trust: 91, completed: 11, level: 5, badges: 6 },
  { id: 's3', name: 'Team Vision', score: 730, accuracy: 84, trust: 89, completed: 10, level: 4, badges: 5 },
  { id: 's4', name: 'Dr. Rao', score: 610, accuracy: 80, trust: 82, completed: 8, level: 4, badges: 4 },
].map((s) => ({ ...s, sample: true }));

class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const getCase = (id) => { const c = CASES.find((x) => x.id === id); if (!c) throw new ApiError(404, 'That case could not be found.'); return c; };
const getConsent = (id) => store.consents.get(id) || DEFAULT_CONSENT;
const getPlayer = (id) => { const p = store.players.get(id); if (!p) throw new ApiError(404, 'Player not found. Please sign in again.'); return normalize(p); };
const nameOf = (id) => CONDITIONS.find((x) => x.id === id)?.name;

// Fill in fields added by newer versions so older in-memory/Mongo profiles never break
function normalize(p) {
  Object.assign(p, { xp: p.xp || 0, streak: p.streak || 0, bestStreak: p.bestStreak || 0, usefulEvidenceTotal: p.usefulEvidenceTotal || 0, history: p.history || [], seen: p.seen || [], badges: p.badges || {}, missions: p.missions || {}, active: p.active || null });
  return p;
}

// Answer options for a case: truth + likely distractors (deterministic), never labelled
function optionsFor(c) {
  const ids = new Set([c.diagnosis, ...analyze(c, []).ranked.map((r) => r.id), ...c.tests.flatMap((t) => t.probes)]);
  for (const x of CONDITIONS) if (ids.size < 6) ids.add(x.id);
  return CONDITIONS.filter((x) => ids.has(x.id)).slice(0, 6).concat(CONDITIONS.filter((x) => ids.has(x.id)).slice(6)).map(({ id, name }) => ({ id, name }));
}
// Strip every hidden field before sending a case to the browser
const publicCase = (c) => ({
  id: c.id, age: c.age, gender: c.gender, complaint: c.complaint, difficulty: c.difficulty, medications: c.medications,
  findings: c.findings.map(({ cat, label }) => ({ cat, label })), tests: c.tests.map(({ id, label, cat }) => ({ id, label, cat })), options: optionsFor(c),
});
const viewAi = (ai, blind) => (blind ? maskAi(ai) : ai);

// ---- Player view
function leaderboard(withSamples = true) {
  const real = [...store.players.values()].map(normalize).map((p) => ({ id: p.id, name: p.name, score: p.score, accuracy: S.statsOf(p).accuracy, trust: S.statsOf(p).trust, completed: p.completed, level: S.levelFor(p.xp).n, badges: Object.keys(p.badges).length, sample: false }));
  return [...(withSamples ? SAMPLES : []), ...real].sort((a, b) => b.score - a.score || b.trust - a.trust || b.accuracy - a.accuracy).map((r, i) => ({ ...r, rank: i + 1 }));
}
function playerView(p) {
  const lv = S.levelFor(p.xp), next = S.LEVELS[lv.n] || null, st = S.statsOf(p);
  const badges = S.badgeView(p);
  return { id: p.id, name: p.name, score: p.score, xp: p.xp, completed: p.completed, correct: p.correct, accuracy: st.accuracy, stats: st,
    trust: st.trust, hasTrust: st.rounds > 0, provisional: st.rounds < 3, trustMessage: S.trustMessage(p.history),
    level: lv.n, levelTitle: lv.title, levelXp: lv.xp, nextXp: next?.xp ?? null, nextTitle: next?.title ?? null, levels: S.LEVELS,
    streak: p.streak, bestStreak: p.bestStreak, rank: leaderboard().find((r) => r.id === p.id)?.rank, badges,
    recentBadges: badges.filter((b) => b.earned).sort((a, b) => b.at - a.at).slice(0, 3), missions: S.missionView(p),
    recent: p.history.slice(-5).reverse(), hasActive: !!p.active, activeJudge: !!p.active?.judge };
}

router.get('/health', (req, res) => res.json({ ok: true, storage: store.mode(), cases: CASES.length }));
router.get('/meta', (req, res) => res.json({ conditions: CONDITIONS.map(({ id, name }) => ({ id, name })), levels: S.LEVELS, catLabels: CAT_LABEL, judgeSequence: JUDGE_SEQUENCE, config: { budget: CONFIG.budget, judgeSeconds: CONFIG.judgeSeconds } }));
router.get('/cases/:id', wrap((req, res) => res.json(publicCase(getCase(req.params.id)))));
router.get('/cases', (req, res) => res.json(CASES.map((c) => ({ id: c.id, age: c.age, gender: c.gender, complaint: c.complaint, difficulty: c.difficulty }))));

router.post('/players', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 30);
  if (!name) throw new ApiError(400, 'Please enter a player name.');
  const id = 'p_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let p = store.players.get(id);
  if (!p) { p = normalize({ id, name, score: 0, completed: 0, correct: 0 }); await store.savePlayer(p); }
  res.json(playerView(normalize(p)));
}));
router.get('/players/:id', wrap((req, res) => res.json(playerView(getPlayer(req.params.id)))));

// ---- Mission state sent to the browser (no hidden answers)
function missionView(m, blind) {
  const c = getCase(m.caseId), consent = getConsent(c.id);
  return { missionId: m.id, case: publicCase(c), ai: viewAi(analyze(c, m.requested, consent), blind), blind, judge: m.judge, replay: m.replay, scenario: m.scenario,
    requested: m.requested, log: m.log, budget: m.budget, budgetLeft: m.budget - m.requested.length, evidencePts: m.evidencePts,
    secsLeft: m.judge ? Math.max(0, Math.round((m.deadline - Date.now()) / 1000)) : null, duration: m.duration, draftDx: m.preDx || null };
}

// ---- Start (or continue) a mission
router.post('/game/start', wrap(async (req, res) => {
  const { playerId, forceCaseId, exclude = [], judgeRandom = false, judge = false, continue: cont = false, duration } = req.body;
  const p = getPlayer(playerId);
  if (cont && p.active) return res.json(missionView(p.active, p.active.judge));
  let c, scenario = null;
  const unseen = CASES.filter((x) => !p.seen.includes(x.id) && !exclude.includes(x.id));
  if (forceCaseId) { c = getCase(forceCaseId); scenario = c.judgeRole || null; }
  else if (judgeRandom) { const pool = unseen.length ? unseen : CASES.filter((x) => !exclude.includes(x.id)); c = (pool.length ? pool : CASES)[Math.floor(Math.random() * (pool.length || CASES.length))]; }
  else {
    const lvl = S.levelFor(p.xp).n;
    const pool = (unseen.length ? unseen : CASES).filter((x) => x.difficulty <= lvl + 1);
    c = [...(pool.length ? pool : CASES)].sort((a, b) => Math.abs(a.difficulty - lvl) - Math.abs(b.difficulty - lvl) || a.id.localeCompare(b.id, undefined, { numeric: true }))[0];
  }
  const secs = Math.max(30, Math.min(600, Number(duration) || CONFIG.judgeSeconds));
  p.active = { id: 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), caseId: c.id, requested: [], log: [], budget: CONFIG.budget, evidencePts: 0, usefulTests: 0, preDx: null, judge: !!judge, scenario,
    replay: p.seen.includes(c.id), startedAt: Date.now(), duration: secs, deadline: Date.now() + secs * 1000 };
  await store.savePlayer(p);
  res.json(missionView(p.active, p.active.judge));
}));

// ---- Request evidence (server enforces budget, duplicates and reward rules)
router.post('/evidence/request', wrap(async (req, res) => {
  const { playerId, missionId, testId, draftDx = null } = req.body;
  const p = getPlayer(playerId), m = p.active;
  if (!m || m.id !== missionId) throw new ApiError(404, 'This mission is no longer active. Start a new mission.');
  const c = getCase(m.caseId), t = c.tests.find((x) => x.id === testId), consent = getConsent(c.id);
  if (!t) throw new ApiError(400, 'That test is not available for this patient.');
  if (m.requested.includes(testId)) throw new ApiError(409, 'You already requested this test.');
  if (draftDx) m.preDx = draftDx; // diagnosis the player was leaning towards BEFORE this evidence
  if (consent.data[t.cat] === false) {
    await store.savePlayer(p);
    return res.json({ blocked: true, message: `The patient has not consented to sharing ${CAT_LABEL[t.cat]}. This result is unavailable to the AI and the clinician. (No budget used.)`, ...missionView(m, m.judge) });
  }
  if (m.requested.length >= m.budget) throw new ApiError(400, 'Investigation budget used up. Decide now, or choose "Not sure" if the evidence is insufficient.');
  const before = analyze(c, m.requested, consent), after = analyze(c, [...m.requested, testId], consent);
  const d = after.confidence - before.confidence;
  const effect = before.leadingId !== after.leadingId ? 'weakens' : d >= 5 ? 'supports' : d <= -5 ? 'weakens' : 'inconclusive';
  const note = { supports: 'This evidence supports the current hypothesis.', weakens: 'This result weakens the current hypothesis.', inconclusive: 'The evidence is inconclusive.' }[effect];
  const mask = (s) => (m.judge ? maskText(s) : s);
  let points = 0, missionDone = null;
  if (t.key && !m.replay) { points = CONFIG.evidencePerTest; m.evidencePts += points; m.usefulTests += 1; p.usefulEvidenceTotal += 1; missionDone = S.bumpMission(p, 'evidence2'); if (missionDone) p.xp += missionDone.xp; }
  const entry = { test: { id: t.id, label: t.label, result: t.result }, beforeConfidence: before.confidence, afterConfidence: after.confidence, beforeInsufficient: before.insufficient, afterInsufficient: after.insufficient,
    reason: mask(explainChange(c, before, after, testId)), effect, note, useful: !!t.key, points };
  m.log.push(entry); m.requested.push(testId);
  await store.savePlayer(p);
  res.json({ blocked: false, entry, missionDone, ...missionView(m, m.judge) });
}));

// ---- Submit: server scores everything; client never sends points/xp
router.post('/diagnosis/submit', wrap(async (req, res) => {
  const { playerId, missionId, diagnosis, confidence } = req.body;
  const p = getPlayer(playerId), m = p.active;
  if (!m || m.id !== missionId) throw new ApiError(409, 'This round was already submitted (or the mission expired). Start a new mission.');
  const c = getCase(m.caseId), conf = Number(confidence);
  if (!(diagnosis === UNSURE || optionsFor(c).some((o) => o.id === diagnosis))) throw new ApiError(400, 'Please choose a diagnosis from the options (or "Insufficient information").');
  if (!Number.isFinite(conf) || conf < 0 || conf > 100) throw new ApiError(400, 'Confidence must be a number between 0 and 100.');

  const consent = getConsent(c.id), ai = analyze(c, m.requested, consent);
  const aiDx = ai.insufficient ? UNSURE : ai.diagnosis, aiCorrect = aiDx === c.diagnosis;
  const changedCorrectly = !!m.preDx && m.preDx !== diagnosis && diagnosis === c.diagnosis && m.requested.length > 0;
  const base = { truth: c.diagnosis, aiInsufficient: ai.insufficient, aiCorrect, evidenceStrength: ai.confidence };
  const doc = S.scoreRound({ ...base, dx: diagnosis, conf, usefulTests: m.usefulTests, evidencePts: m.evidencePts, changedCorrectly });
  const aiRound = S.scoreRound({ ...base, dx: aiDx, conf: ai.confidence });

  const before = { xp: p.xp, level: S.levelFor(p.xp).n, trust: S.trustOf(p.history), score: p.score };
  let xpGain = 0, newBadges = [], missionsDone = [];
  if (!m.replay) { // replays are practice only: no score, XP, streak or trust changes
    xpGain = Math.max(0, Math.round(doc.total / 2)) + CONFIG.completeXp;
    p.score += doc.total; p.completed += 1; p.correct += doc.outcome === 'correct' ? 1 : 0;
    p.streak = doc.good ? p.streak + 1 : 0; p.bestStreak = Math.max(p.bestStreak, p.streak);
    p.seen.push(c.id);
    p.history.push({ caseId: c.id, complaint: c.complaint, outcome: doc.outcome, good: doc.good, calibration: doc.calibration, calibrated: doc.calibrated, roundTrust: doc.roundTrust, overconfident: doc.overconfident,
      usedEvidence: m.usefulTests > 0, uncertainOpp: ai.insufficient, revised: changedCorrectly, conf, points: doc.total, xp: xpGain, dx: diagnosis === UNSURE ? 'Not sure' : nameOf(diagnosis), at: Date.now() });
    p.xp += xpGain;
    const md = [S.bumpMission(p, 'cases3'), doc.outcome === 'uncertain' && doc.good && ai.insufficient ? S.bumpMission(p, 'unsure1') : null, !doc.overconfident ? S.bumpMission(p, 'calm1') : null].filter(Boolean);
    missionsDone = md.map((x) => ({ id: x.id, title: x.title, xp: x.xp })); md.forEach((x) => (p.xp += x.xp));
    newBadges = S.checkBadges(p); S.BADGES.filter((b) => newBadges.includes(b.id)).forEach((b) => (p.xp += b.xp));
  }
  p.active = null;
  await store.savePlayer(p);

  const view = playerView(p), lvAfter = S.levelFor(p.xp);
  res.json({
    replay: m.replay, truth: { id: c.diagnosis, name: nameOf(c.diagnosis), explanation: c.explanation },
    doctor: { dx: diagnosis, name: diagnosis === UNSURE ? 'Insufficient information' : nameOf(diagnosis), confidence: conf, outcome: doc.outcome, score: doc.total, evidenceReviewed: c.findings.length + m.requested.length },
    ai: { dx: aiDx, name: ai.insufficient ? 'Insufficient information' : ai.name, confidence: ai.confidence, outcome: aiCorrect ? 'correct' : ai.insufficient ? 'uncertain' : 'wrong', score: aiRound.total, feedback: aiRound.feedback, analysis: ai },
    winner: m.replay ? 'none' : doc.total > aiRound.total ? 'doctor' : doc.total < aiRound.total ? 'ai' : 'tie',
    aiNote: aiCorrect ? null : ai.insufficient ? 'The AI declined to commit: it judged the evidence insufficient.' : 'The AI was wrong on this case. A higher AI confidence never means it wins.',
    score: { items: doc.items, total: doc.total, feedback: doc.feedback, penaltyNote: doc.overconfident && doc.outcome === 'wrong' ? 'A confident wrong answer costs far more than an honest "not sure".' : null },
    rewards: m.replay ? null : { xpGain, missionsDone, missionXp: missionsDone.reduce((s, x) => s + x.xp, 0), newBadges: S.badgeView(p).filter((b) => newBadges.includes(b.id)), badgeXp: S.BADGES.filter((b) => newBadges.includes(b.id)).reduce((s, b) => s + b.xp, 0),
      levelUp: lvAfter.n > before.level ? { from: before.level, to: lvAfter.n, title: lvAfter.title } : null, trustBefore: before.trust, trustAfter: view.trust },
    allTests: c.tests.map((t) => ({ label: t.label, result: t.result, requested: m.requested.includes(t.id) })), player: view,
  });
}));

router.get('/archive/:playerId', wrap((req, res) => {
  const p = getPlayer(req.params.playerId);
  res.json(CASES.map((c) => { const h = [...p.history].reverse().find((r) => r.caseId === c.id);
    return { id: c.id, age: c.age, gender: c.gender, complaint: c.complaint, difficulty: c.difficulty, completed: !!h,
      last: h ? { outcome: h.outcome, points: h.points, yourAnswer: h.dx, truth: nameOf(c.diagnosis), explanation: c.explanation, tests: c.tests.map((t) => `${t.label}: ${t.result}`) } : null }; }));
}));
router.get('/leaderboard', (req, res) => res.json(leaderboard(req.query.samples !== '0')));

// ---- Consent
const consentPayload = (c) => {
  const consent = getConsent(c.id), all = c.tests.map((t) => t.id);
  const ai = analyze(c, [], consent), potential = analyze(c, all, consent), baseline = analyze(c, all, DEFAULT_CONSENT);
  return { patientId: c.id, patient: `${c.age}y ${c.gender}, ${c.complaint}`, consent, preview: ai, potentialConfidence: potential.insufficient ? Math.min(potential.confidence, 49) : potential.confidence, potentialInsufficient: potential.insufficient, baselineConfidence: baseline.confidence, labels: CAT_LABEL };
};
router.get('/consent/:patientId', wrap((req, res) => res.json(consentPayload(getCase(req.params.patientId)))));
router.post('/consent', wrap(async (req, res) => {
  const { patientId, data, purposes } = req.body, c = getCase(patientId);
  if (!data || !purposes) throw new ApiError(400, 'Consent settings are missing.');
  const clean = { patientId: c.id, data: {}, purposes: {} };
  Object.keys(DEFAULT_CONSENT.data).forEach((k) => (clean.data[k] = !!data[k]));
  Object.keys(DEFAULT_CONSENT.purposes).forEach((k) => (clean.purposes[k] = !!purposes[k]));
  await store.saveConsent(clean);
  res.json(consentPayload(c));
}));

router.use((req, res) => res.status(404).json({ error: 'Unknown API route.' }));
router.use((err, req, res, next) => { if (err.status) return res.status(err.status).json({ error: err.message }); console.error(err); res.status(500).json({ error: 'Something went wrong on the server. Please try again.' }); });
module.exports = router;
