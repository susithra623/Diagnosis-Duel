// Explainable weighted-evidence engine. Deterministic, no external AI. Can say "INSUFFICIENT INFORMATION".
const { CONDITIONS } = require('../data/conditions');

const TEMP = 1.6; // softmax temperature: higher = less confident
const byId = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));

const DEFAULT_CONSENT = {
  data: { symptoms: true, vitals: true, history: true, labs: true, imaging: true, genetic: false },
  purposes: { diagnosis: true, training: false, research: false },
};
const CAT_LABEL = { symptoms: 'Symptoms', vitals: 'Vital Signs & Exam', history: 'Medical History', labs: 'Lab & Cardiac Tests', imaging: 'Imaging', genetic: 'Genetic Information' };

const strengthWord = (w) => (w >= 2.5 ? 'strongly supports' : w >= 1.2 ? 'supports' : 'weakly supports');
const allowed = (consent, cat) => consent.data[cat] !== false;

// Collect only the evidence the patient has consented to share
function gather(c, requested, consent) {
  const items = c.findings.filter((f) => allowed(consent, f.cat)).map((f) => ({ label: f.label, tags: f.tags }));
  for (const id of requested) {
    const t = c.tests.find((x) => x.id === id);
    if (t && allowed(consent, t.cat)) items.push({ label: t.label, tags: t.tags });
  }


  return items;
}

function analyze(c, requested = [], consent = DEFAULT_CONSENT) {
  const base = { caseId: c.id, requested };
  if (!consent.purposes.diagnosis) {
    return { ...base, diagnosis: null, name: null, confidence: 0, insufficient: true, uncertainty: 'High', risk: 'Unknown', ranked: [], evidenceFor: [], blocked: ['Diagnosis assistance purpose'],
      reason: 'The patient has withdrawn consent for AI diagnosis assistance, so the AI cannot analyse this case.', why: ['No data may be used for diagnosis assistance.'], missing: ['Patient consent for diagnosis assistance'], changeMind: ['Restoring consent would let the AI analyse the case.'], recommended: 'Respect the patient’s choice; decide without AI.' };
  }
  const items = gather(c, requested, consent);

  // 1) score each condition by summing tag weights
  const scored = CONDITIONS.map((cond) => {
    let score = 0;
    const contrib = [];
    for (const it of items) {
      const w = it.tags.reduce((s, tag) => s + (cond.weights[tag] || 0), 0);
      if (w !== 0) { score += w; contrib.push({ label: it.label, weight: w }); }
    }
    return { cond, score, contrib };
  });
  // 2) softmax -> probabilities
  const exps = scored.map((s) => Math.exp(s.score / TEMP));
  const total = exps.reduce((a, b) => a + b, 0);
  scored.forEach((s, i) => (s.p = exps[i] / total));
  scored.sort((a, b) => b.p - a.p);
  const [top, second] = scored;

  // 3) honesty gate: refuse to commit when evidence is weak or the top two are too close
  const margin = top.p - second.p;
  const insufficient = top.p < 0.5 || margin < 0.2 || top.score < 4;
  const confidence = Math.min(97, Math.round(top.p * 100));

  // 4) what is missing?
  const unrequested = c.tests.filter((t) => !requested.includes(t.id) && allowed(consent, t.cat));
  const useful = unrequested.filter((t) => t.probes.includes(top.cond.id) || t.probes.includes(second.cond.id));
  const missing = useful.map((t) => t.label);
  const blocked = Object.keys(consent.data).filter((k) => !consent.data[k] && (c.findings.some((f) => f.cat === k) || c.tests.some((t) => t.cat === k))).map((k) => CAT_LABEL[k]);
  blocked.forEach((b) => missing.push(`${b} (not shared by patient)`));
  if (!missing.length && insufficient) missing.push('Further history or examination findings');

  // 5) why?
  const sorted = [...top.contrib].sort((a, b) => b.weight - a.weight);
  const why = sorted.filter((x) => x.weight > 0).slice(0, 4).map((x) => `${x.label} ${strengthWord(x.weight)} ${top.cond.name}.`);
  sorted.filter((x) => x.weight < 0).slice(-2).forEach((x) => why.push(`${x.label} argues against ${top.cond.name}.`));
  if (insufficient) why.unshift(`Leading possibilities are too close: ${top.cond.name} (${Math.round(top.p * 100)}%) vs ${second.cond.name} (${Math.round(second.p * 100)}%).`);
  if (!why.length) why.push('No findings strongly favour any diagnosis.');

  // 6) what would change my mind? (never leaks the hidden result)
  const changeMind = [];
  useful.slice(0, 3).forEach((t) => {
    if (t.probes.includes(top.cond.id)) changeMind.push(`A normal ${t.label} would reduce confidence in ${top.cond.name}.`);
    if (t.probes.includes(second.cond.id) && changeMind.length < 4) changeMind.push(`A positive ${t.label} could raise the likelihood of ${second.cond.name}.`);
  });
  if (!changeMind.length) changeMind.push('New findings that do not fit the current pattern would change the ranking.');

  const uncertainty = insufficient ? 'High' : confidence >= 80 ? 'Low' : 'Moderate';
  const reason = insufficient
    ? 'Available information is insufficient to distinguish between the leading possibilities.'
    : `${why.slice(0, 3).map((w) => w.replace(/\.$/, '')).join('; ')}.${missing.length ? ` Confirmation (${missing[0]}) is not yet available.` : ''}`;
  const recommended = insufficient ? 'Request additional evidence.' : missing.length && confidence < 85 ? `Consider requesting ${missing[0]} to confirm.` : 'Evidence is sufficient to commit.';

  return {
    ...base, diagnosis: insufficient ? null : top.cond.id, name: insufficient ? null : top.cond.name, leadingId: top.cond.id, leadingName: top.cond.name,
    confidence, insufficient, uncertainty, risk: insufficient ? 'Moderate' : top.cond.severity,
    ranked: scored.slice(0, 3).map((s) => ({ id: s.cond.id, name: s.cond.name, p: Math.round(s.p * 100) })),
    evidenceFor: sorted.filter((x) => x.weight > 0).map((x) => x.label), why, missing, changeMind, reason, recommended, blocked,
  };
}

// Why did confidence change after a new test?
function explainChange(c, before, after, testId) {
  const t = c.tests.find((x) => x.id === testId);
  const d = after.confidence - before.confidence;
  if (before.leadingId !== after.leadingId) return `${t.label} changed the leading hypothesis from ${before.leadingName} to ${after.leadingName}.`;
  if (before.insufficient && !after.insufficient) return `${t.label} resolved the uncertainty: ${after.leadingName} is now clearly ahead.`;
  if (d >= 5) return `Confidence increased because the ${t.label} finding (${t.result}) supports ${after.leadingName}.`;
  if (d <= -5) return `Confidence decreased because the ${t.label} finding (${t.result}) argues against ${after.leadingName}.`;
  return `${t.label} (${t.result}) did not materially change the picture.`;
}

// Blind mode: hide the AI's diagnosis name so the duel stays fair until the doctor submits
const maskText = (s) => CONDITIONS.reduce((acc, x) => acc.split(x.name).join('the leading hypothesis'), s);
function maskAi(ai) {
  if (!ai) return ai;
  const mask = maskText;
  const m = (arr) => arr.map(mask);
  return { ...ai, masked: true, diagnosis: null, name: null, leadingId: null, leadingName: null, reason: mask(ai.reason), why: m(ai.why), changeMind: m(ai.changeMind),
    ranked: ai.ranked.map((r, i) => ({ id: `h${i}`, name: `Hypothesis ${i + 1}`, p: r.p })), evidenceFor: ai.evidenceFor };
}

module.exports = { analyze, explainChange, maskAi, maskText, DEFAULT_CONSENT, CAT_LABEL, byId, CONDITIONS };
