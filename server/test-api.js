// Integration test against a running server: node test-api.js   (start the server first)
const B = 'http://localhost:5000/api';
const post = (p, b) => fetch(B + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(async (r) => ({ s: r.status, d: await r.json() }));
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const name = 'T' + Date.now(); const { d: pl } = await post('/players', { name }); const pid = pl.id;
  let g = (await post('/game/start', { playerId: pid, forceCaseId: 'c6', judge: true })).d;
  ok(!JSON.stringify(g).includes('"diagnosis":"anemia"') && !g.case.explanation, 'no hidden answer in mission payload');
  ok(g.budgetLeft === 3 && g.ai.insufficient, 'c6 starts insufficient, budget 3');
  let e = (await post('/evidence/request', { playerId: pid, missionId: g.missionId, testId: 'cbc', draftDx: 'dehydration' })).d;
  ok(e.entry.points === 20 && e.ai.confidence > g.ai.confidence, 'useful evidence +20 and confidence rises');
  const dup = await post('/evidence/request', { playerId: pid, missionId: g.missionId, testId: 'cbc' });
  ok(dup.s === 409, 'duplicate evidence rejected (no farming)');
  const sub = await post('/diagnosis/submit', { playerId: pid, missionId: g.missionId, diagnosis: 'anemia', confidence: 75 });
  ok(sub.d.truth.id === 'anemia' && sub.d.score.total >= 130, 'correct + calibration + evidence + revision: total ' + sub.d.score.total);
  ok(sub.d.score.items.some((i) => i.kind === 'revision'), 'revision bonus awarded');
  ok(sub.d.rewards.xpGain > 0, 'xp awarded: ' + sub.d.rewards.xpGain);
  const again = await post('/diagnosis/submit', { playerId: pid, missionId: g.missionId, diagnosis: 'anemia', confidence: 75 });
  ok(again.s === 409, 'duplicate submission rejected');
  // overconfident wrong
  g = (await post('/game/start', { playerId: pid, forceCaseId: 'c8' })).d;
  const w = (await post('/diagnosis/submit', { playerId: pid, missionId: g.missionId, diagnosis: 'gastro', confidence: 95 })).d;
  ok(w.score.total === -100 && w.player.streak === 0, 'confident wrong = -100, streak reset');
  // honest unsure on insufficient case
  g = (await post('/game/start', { playerId: pid, forceCaseId: 'c11' })).d;
  const u = (await post('/diagnosis/submit', { playerId: pid, missionId: g.missionId, diagnosis: 'INSUFFICIENT', confidence: 30 })).d;
  ok(u.score.total === 80 && u.player.badges.find((b) => b.id === 'uncertainty').earned, 'honest unsure +80 and Uncertainty Master unlocked');
  // replay gives no rewards
  g = (await post('/game/start', { playerId: pid, forceCaseId: 'c11' })).d;
  const rp = (await post('/diagnosis/submit', { playerId: pid, missionId: g.missionId, diagnosis: 'acs', confidence: 80 })).d;
  ok(rp.replay && rp.rewards === null && rp.player.score === u.player.score, 'replay is practice: no score change');
  // budget
  g = (await post('/game/start', { playerId: pid, forceCaseId: 'c1', continue: false })).d; // c1 only 3 tests
  const bad = await post('/diagnosis/submit', { playerId: pid, missionId: g.missionId, diagnosis: 'acs', confidence: 500 });
  ok(bad.s === 400, 'invalid confidence rejected');
  const lb = await fetch(B + '/leaderboard?samples=0').then((r) => r.json());
  ok(lb.every((r) => !r.sample) && lb.some((r) => r.id === pid), 'leaderboard (samples off) shows real players only');
  console.log('final player: xp', u.player.xp, 'level', u.player.level, 'trust', u.player.trust);
})();
