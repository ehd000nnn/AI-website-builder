const evForm = document.getElementById('ev-form');
const evResult = document.getElementById('ev-result');
const coachForm = document.getElementById('coach-form');
const coachOutput = document.getElementById('coach-output');

evForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const winPct = Number(document.getElementById('winPct').value) / 100;
  const potSize = Number(document.getElementById('potSize').value);
  const callSize = Number(document.getElementById('callSize').value);

  const losePct = 1 - winPct;
  const ev = (winPct * potSize) - (losePct * callSize);
  const verdict = ev >= 0 ? 'Profitable call' : 'Unprofitable call';

  evResult.textContent = `EV: $${ev.toFixed(2)} — ${verdict}`;
});

coachForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const spot = document.getElementById('spot').value.trim();

  const heuristics = [
    'Prioritize range advantage by betting more frequently on high-card boards.',
    'At shallow SPR, favor value-heavy lines and deny equity aggressively.',
    'On dynamic boards, mix check-backs to protect your checking range.',
    'If villain over-folds to c-bets, increase your small flop continuation bets.',
    'Use blocker effects to choose bluff candidates on later streets.'
  ];

  const pick = heuristics[Math.floor(Math.random() * heuristics.length)];
  coachOutput.textContent = `Spot Summary: ${spot.slice(0, 120)}${spot.length > 120 ? '…' : ''} | AI Suggestion: ${pick}`;
});
