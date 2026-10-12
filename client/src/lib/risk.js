// Live Risk Meter. NOT based on confidence alone: combines evidence, missing evidence, ambiguity,
// stated confidence and the severity of the AI's leading hypothesis.
export function riskMeter({ dx, conf, ai }) {
  if (dx === 'INSUFFICIENT') return { level: 'LOW', score: 0, factors: ['You are declining to commit, so an unsupported guess cannot cost you points.'], warning: null };
  const f = []; let s = 0;
  if (conf >= 80) { s += 2; f.push(`High stated confidence (${conf}%)`); } else if (conf >= 55) { s += 1; f.push(`Moderate stated confidence (${conf}%)`); }
  if (conf - ai.confidence > 25) { s += 2; f.push(`Confidence exceeds the evidence strength (AI evidence confidence ${ai.confidence}%)`); }
  const gap = ai.ranked.length > 1 ? ai.ranked[0].p - ai.ranked[1].p : 100;
  if (ai.insufficient) { s += 1; f.push('Current evidence is insufficient to separate the leading possibilities'); }
  else if (gap < 25) { s += 1; f.push('The top two possibilities are close'); }
  const missing = ai.missing.filter((m) => !m.includes('not shared'));
  if (missing.length && ai.confidence < 85) { s += 1; f.push(`Important evidence is still missing: ${missing[0]}`); }
  if (ai.risk === 'High') { s += 1; f.push('The leading hypothesis is a high-severity condition'); }
  const level = s >= 4 ? 'HIGH' : s >= 2 ? 'MODERATE' : 'LOW';
  const warning = conf >= 70 && missing.length && ai.confidence < 85 ? 'Your confidence is high, but important evidence is missing. Consider investigating further.' : level === 'HIGH' ? 'This is a high-risk decision. Additional evidence may reduce uncertainty.' : null;
  return { level, score: s, factors: f.length ? f : ['Evidence and confidence are consistent.'], warning };
}
