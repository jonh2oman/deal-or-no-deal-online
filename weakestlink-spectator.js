/**
 * The Weakest Link Spectator View Receiver
 */

const WEAKEST_LINK_CHAIN_TV = [
  "$250", "$500", "$1,000", "$2,500", "$5,000", "$7,500", "$10,000", "$25,000"
];

class WeakestLinkSpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('weakestlink_stage_broadcast');
    
    this.chainLadderTv = document.getElementById('chain-ladder-tv');
    this.totalBankTv = document.getElementById('total-bank-tv');
    this.playersGridTv = document.getElementById('players-grid-tv');
    this.roundTimerTv = document.getElementById('round-timer-tv');

    this.init();
  }

  init() {
    this.broadcast.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'SYNC_WEAKESTLINK_STATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('weakestlink_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}
  }

  renderState(state) {
    if (!state) return;

    if (this.totalBankTv) this.totalBankTv.textContent = `$${state.totalBanked || 0}`;

    if (this.roundTimerTv && state.timerSeconds !== undefined) {
      const m = Math.floor(state.timerSeconds / 60);
      const s = (state.timerSeconds % 60).toString().padStart(2, '0');
      this.roundTimerTv.textContent = `${m}:${s}`;
    }

    // Chain TV
    if (this.chainLadderTv) {
      this.chainLadderTv.innerHTML = '';
      WEAKEST_LINK_CHAIN_TV.forEach((v, idx) => {
        const step = document.createElement('div');
        step.className = `chain-step-tv ${idx === state.currentChainIdx ? 'active' : ''}`;
        step.innerHTML = `<span>${idx + 1}</span><span>${v}</span>`;
        this.chainLadderTv.appendChild(step);
      });
    }

    // Players TV
    if (this.playersGridTv && Array.isArray(state.players)) {
      this.playersGridTv.innerHTML = '';
      state.players.forEach(p => {
        const card = document.createElement('div');
        card.className = `player-card-tv ${p.eliminated ? 'eliminated' : ''}`;
        card.innerHTML = `
          <div style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #ffffff;">${p.name}</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: ${p.eliminated ? '#ef4444' : '#34d399'}; margin-top: 6px;">
            ${p.eliminated ? '❌ ELIMINATED' : '✅ IN GAME'}
          </div>
        `;
        this.playersGridTv.appendChild(card);
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WeakestLinkSpectator();
});
