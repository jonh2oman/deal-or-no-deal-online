/**
 * Minute to Win It Spectator View Receiver
 */

class MinuteSpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('minutetowinit_stage_broadcast');
    
    this.clockDisplayTv = document.getElementById('clock-display-tv');
    this.livesDisplayTv = document.getElementById('lives-display-tv');
    this.challengeNameTv = document.getElementById('challenge-name-tv');
    this.challengeRulesTv = document.getElementById('challenge-rules-tv');

    this.init();
  }

  init() {
    this.broadcast.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'SYNC_MINUTETOWINIT_STATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('minutetowinit_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}
  }

  renderState(state) {
    if (!state) return;

    if (this.clockDisplayTv) {
      const secs = (state.timeLeft !== undefined ? state.timeLeft : 60).toString().padStart(2, '0');
      this.clockDisplayTv.textContent = `00:${secs}`;
    }

    if (this.livesDisplayTv) {
      const livesCount = state.lives !== undefined ? state.lives : 3;
      this.livesDisplayTv.textContent = '❤️'.repeat(livesCount) + '🖤'.repeat(3 - livesCount);
    }

    if (this.challengeNameTv) this.challengeNameTv.textContent = state.challengeName || "JUNK IN THE TRUNK";
    if (this.challengeRulesTv) this.challengeRulesTv.textContent = state.challengeRules || "";
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MinuteSpectator();
});
