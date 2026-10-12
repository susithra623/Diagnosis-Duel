// Prints AI output for every case: before evidence, then after each key test. Run: npm run test:engine
const { CASES } = require('./data/cases');
const { analyze } = require('./services/engine');
for (const c of CASES) {
  const show = (a, tag) => console.log(`  ${tag.padEnd(14)} ${a.insufficient ? 'INSUFFICIENT' : a.name} (top ${a.leadingName} ${a.confidence}%)`);
  console.log(`${c.id} [truth: ${c.diagnosis}]`);
  show(analyze(c, []), 'initial');
  const req = [];
  for (const t of c.tests.filter((t) => t.key)) { req.push(t.id); show(analyze(c, req), '+' + t.id); }
}
