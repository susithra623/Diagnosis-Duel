# Diagnosis Duel (gamified upgrade)
**From AI Prediction to Trustworthy Decision-Making.**
A human-vs-AI medical decision game that rewards knowing *why*, knowing *how sure you are*, and knowing *when you need more evidence*.
Educational simulation only. Synthetic cases only. NOT a clinically validated diagnostic device.

## Run on Windows (VS Code)
1. Extract the ZIP, then in VS Code: File > Open Folder > the `diagnosis-duel` folder.
2. Terminal > New Terminal (PowerShell). First time only:  `npm run install:all`
3. Start everything:  `npm run dev`   -> open http://localhost:5173
4. Stop: click the terminal and press Ctrl+C.
- Verify backend: open http://localhost:5000/api/health (should show `"ok":true`).
- Port busy? Close old terminals, or run `Get-NetTCPConnection -LocalPort 5000 | Select OwningProcess` then `Stop-Process -Id <id>`.
- Tests (server must be running in another terminal): `npm run test:engine` and `npm run test:api`.
- MongoDB is optional: `server/.env` with `MONGO_URI=...` enables persistence. Without it, data is in memory and RESETS when the server restarts.

## Game loop
Mission start > read case > Evidence Hunt (3-request budget, predefined results) > diagnosis + confidence (Risk Meter) > AI revealed > Human-vs-AI battle > reference answer > score/XP/Trust > badges/level > leaderboard > next mission.

## Rules (all in `server/services/scoring.js`, configurable in `CONFIG`)
| Event | Points |
|---|---|
| Correct diagnosis | +80 |
| Calibration bonus (correct and confidence <= evidence strength + 25, and >= 40%) | +20 |
| Insufficient information when evidence is genuinely insufficient | +80 |
| Insufficient, but evidence was misleading | +40 |
| Insufficient, though evidence pointed to an answer | +10 |
| Useful evidence (key test, once per test per mission) | +20 |
| Correctly revising diagnosis after new evidence | +30 |
| Wrong: low / medium / high confidence | -20 / -50 / -100 |

"Genuinely insufficient" = the explainable engine (weights in `server/data/conditions.js`) cannot separate the leading diagnoses from the permitted evidence (top probability < 50%, margin < 20 points, or weak total evidence). Blocking data in the Consent Center changes this.
- **XP** = round(score/2, min 0) + 10 per completed case, plus mission and badge bonuses. Levels at 0 / 80 / 200 / 350 / 550 XP.
- **Trust Score** = mean of per-round trust over the last 20 rounds x 100. Round trust = 0.55 x calibration + 0.25 x good decision + 0.20 x evidence use, minus 0.2 if overconfident. Marked provisional below 3 rounds.
- **Replays** of an already completed case are practice only: no points, XP, streak or Trust change. Evidence points cannot be farmed (once per test, server-side). A mission can be submitted once.
- Hidden answers never leave the server until a round is submitted. Points/XP are never accepted from the browser.

## Honest limitations
- The "AI" is a transparent weighted-rule engine, not ML/LLM. Weights are teaching heuristics.
- In-memory storage resets on restart (unless MongoDB is configured). Sample leaderboard rows are static and labelled SAMPLE.
- The Risk Meter is computed in the browser (`client/src/lib/risk.js`) for live feedback; it does not affect scoring.
- Consent is a simulation, not a legal workflow. Only 12 cases; the pool is small, so replays become practice quickly.

## 5-minute demo script
1. (0:30) Dashboard: level, XP, missions, trust breakdown. State the tagline and the "synthetic / not clinical" disclaimer.
2. (1:00) Judge Mode > enter team name > scripted demo. Case 1 (easy): request a test, note +20 and the confidence change, submit, show battle + rewards.
3. (1:15) Case 2 (ambiguous): AI shows INSUFFICIENT INFORMATION. Choose it for +80, or request the CBC and watch confidence jump.
4. (1:00) Case 4 (heartburn trap): pick Gastroenteritis at High confidence to show -100 versus +80 for honest uncertainty. Point at the Risk Meter warning first.
5. (0:30) Consent Center: block Imaging on c9; the AI's potential confidence drops and it says why.
6. (0:45) Leaderboard, Achievements (badge unlocks), Archive (answers locked until completed). Close with the core message.
