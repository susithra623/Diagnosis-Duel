// Data store. Uses MongoDB when MONGO_URI is set and reachable; otherwise in-memory (app never fails because of the DB).
const players = new Map();
const consents = new Map();
let connected = false;
let PlayerM, ConsentM;

async function init() {
  if (!process.env.MONGO_URI) return console.log('[store] No MONGO_URI set -> using in-memory storage.');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    PlayerM = mongoose.model('Player', new mongoose.Schema({ id: { type: String, index: true } }, { strict: false }));
    ConsentM = mongoose.model('Consent', new mongoose.Schema({ patientId: { type: String, index: true } }, { strict: false }));
    (await PlayerM.find().lean()).forEach((p) => players.set(p.id, p));
    (await ConsentM.find().lean()).forEach((c) => consents.set(c.patientId, c));
    connected = true;
    console.log('[store] MongoDB connected.');
  } catch (e) {
    console.log('[store] MongoDB unavailable (' + e.message + ') -> using in-memory storage.');
  }
}
const mode = () => (connected ? 'mongodb' : 'memory');
async function savePlayer(p) { players.set(p.id, p); if (connected) await PlayerM.updateOne({ id: p.id }, p, { upsert: true }).catch(() => {}); }
async function saveConsent(c) { consents.set(c.patientId, c); if (connected) await ConsentM.updateOne({ patientId: c.patientId }, c, { upsert: true }).catch(() => {}); }

module.exports = { init, mode, players, consents, savePlayer, saveConsent };
