// Thin wrapper around fetch. Always throws an Error with a friendly message.
async function call(path, body) {
  try {
    const res = await fetch('/api' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed. Please try again.');
    return data;
  } catch (e) {
    if (e instanceof TypeError) throw new Error('Cannot reach the server. Is the backend running on port 5000?');
    throw e;
  }
}
export const api = {
  health: () => call('/health'), meta: () => call('/meta'),
  createPlayer: (name) => call('/players', { name }), getPlayer: (id) => call('/players/' + id),
  startGame: (b) => call('/game/start', b), requestEvidence: (b) => call('/evidence/request', b), submit: (b) => call('/diagnosis/submit', b),
  leaderboard: (samples = true) => call('/leaderboard?samples=' + (samples ? 1 : 0)), archive: (id) => call('/archive/' + id),
  getConsent: (id) => call('/consent/' + id), saveConsent: (b) => call('/consent', b),
};
