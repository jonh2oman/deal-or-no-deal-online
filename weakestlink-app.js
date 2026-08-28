/**
 * The Weakest Link Controller Engine
 */

const WEAKEST_LINK_CHAIN = [
  { step: 1, val: 250, label: "$250" },
  { step: 2, val: 500, label: "$500" },
  { step: 3, val: 1000, label: "$1,000" },
  { step: 4, val: 2500, label: "$2,500" },
  { step: 5, val: 5000, label: "$5,000" },
  { step: 6, val: 7500, label: "$7,500" },
  { step: 7, val: 10000, label: "$10,000" },
  { step: 8, val: 25000, label: "$25,000" }
];

class WeakestLinkController {
  constructor() {
    this.broadcast = new BroadcastChannel('weakestlink_stage_broadcast');
    
    this.currentChainIdx = -1;
    this.totalBanked = 0;

    this.timerSeconds = 150;
    this.timerRunning = false;
    this.timerInterval = null;

    this.players = [
      { id: 1, name: "PLAYER 1", eliminated: false },
      { id: 2, name: "PLAYER 2", eliminated: false },
      { id: 3, name: "PLAYER 3", eliminated: false },
      { id: 4, name: "PLAYER 4", eliminated: false },
      { id: 5, name: "PLAYER 5", eliminated: false },
      { id: 6, name: "PLAYER 6", eliminated: false }
    ];

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.renderChain();
    this.renderPlayers();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost((buzzData) => {}, (voteData) => {});
      mobilePeerManager.setGameInfo("THE WEAKEST LINK", this.players.map(p => p.name));
      mobilePeerManager.setMobileTarget('vote.html', true);
    }
  }

  initDOM() {
    this.themeSelect = document.getElementById('theme-select');
    this.spectatorBtn = document.getElementById('spectator-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.chainLadder = document.getElementById('chain-ladder');
    this.playersGrid = document.getElementById('players-grid');
    this.totalBankVal = document.getElementById('total-bank-val');
    this.bankBtn = document.getElementById('bank-btn');
    this.correctBtn = document.getElementById('correct-btn');
    this.wrongBtn = document.getElementById('wrong-btn');

    this.roundTimerDisplay = document.getElementById('round-timer-display');
    this.timerStartBtn = document.getElementById('timer-start-btn');
    this.timerPauseBtn = document.getElementById('timer-pause-btn');
    this.timerResetBtn = document.getElementById('timer-reset-btn');

    this.soundFxBtns = document.querySelectorAll('.sound-fx-btn');

    this.qrBtn = document.getElementById('qr-btn');
    this.qrModal = document.getElementById('qr-modal');
    this.closeQrBtn = document.getElementById('close-qr-btn');
    this.resetBuzzersBtn = document.getElementById('reset-buzzers-btn');
  }

  bindEvents() {
    if (this.qrBtn) this.qrBtn.addEventListener('click', () => { if (this.qrModal) this.qrModal.classList.remove('hidden'); });
    if (this.closeQrBtn) this.closeQrBtn.addEventListener('click', () => { if (this.qrModal) this.qrModal.classList.add('hidden'); });
    if (this.resetBuzzersBtn) this.resetBuzzersBtn.addEventListener('click', () => { if (typeof mobilePeerManager !== 'undefined' && mobilePeerManager.resetBuzzers) mobilePeerManager.resetBuzzers(); });

    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
        this.broadcastState();
      });
    }

    if (this.spectatorBtn) {
      this.spectatorBtn.addEventListener('click', () => {
        window.open('weakestlink-spectator.html', 'WeakestLinkSpectatorWindow', 'width=1280,height=720');
      });
    }

    if (this.bankBtn) {
      this.bankBtn.addEventListener('click', () => this.bankMoney());
    }

    if (this.timerStartBtn) this.timerStartBtn.addEventListener('click', () => this.startTimer());
    if (this.timerPauseBtn) this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
    if (this.timerResetBtn) this.timerResetBtn.addEventListener('click', () => this.resetRoundTimer());

    if (this.correctBtn) {
      this.correctBtn.addEventListener('click', () => {
        sounds.playDing();
        if (this.currentChainIdx < WEAKEST_LINK_CHAIN.length - 1) {
          this.currentChainIdx++;
        }
        this.renderChain();
        this.broadcastState();
      });
    }

    if (this.wrongBtn) {
      this.wrongBtn.addEventListener('click', () => {
        sounds.playBuzzer();
        this.currentChainIdx = -1;
        this.renderChain();
        this.broadcastState();
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.currentChainIdx = -1;
        this.totalBanked = 0;
        this.players.forEach(p => p.eliminated = false);
        this.renderChain();
        this.renderPlayers();
        this.renderScores();
        this.broadcastState();
      });
    }

    if (this.soundFxBtns) {
      this.soundFxBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const snd = btn.getAttribute('data-sound');
          if (snd === 'chime') sounds.playDing();
          else if (snd === 'daily') sounds.playFanfare();
          else if (snd === 'buzzer') sounds.playBuzzer();
          else if (snd === 'win') sounds.playFanfare();
          else if (snd === 'theme') sounds.playTheme();
          else if (snd === 'stop') sounds.stopAll();
          this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: snd });
        });
      });
    }
  }

  startTimer() {
    if (this.timerRunning) return;
    this.timerRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
        this.renderTimer();
        this.broadcastState();
      } else {
        this.pauseTimer();
      }
    }, 1000);
  }

  pauseTimer() {
    this.timerRunning = false;
    clearInterval(this.timerInterval);
  }

  resetRoundTimer() {
    this.pauseTimer();
    this.timerSeconds = 150;
    this.renderTimer();
    this.broadcastState();
  }

  renderTimer() {
    if (!this.roundTimerDisplay) return;
    const m = Math.floor(this.timerSeconds / 60);
    const s = (this.timerSeconds % 60).toString().padStart(2, '0');
    this.roundTimerDisplay.textContent = `${m}:${s}`;
  }

  bankMoney() {
    if (this.currentChainIdx >= 0) {
      sounds.playFanfare();
      this.totalBanked += WEAKEST_LINK_CHAIN[this.currentChainIdx].val;
      this.currentChainIdx = -1;
      this.renderChain();
      this.renderScores();
      this.broadcastState();
    }
  }

  toggleElimination(pIdx) {
    sounds.playBuzzer();
    this.players[pIdx].eliminated = !this.players[pIdx].eliminated;
    this.renderPlayers();
    this.broadcastState();
  }

  renderChain() {
    if (!this.chainLadder) return;
    this.chainLadder.innerHTML = '';
    WEAKEST_LINK_CHAIN.forEach((c, idx) => {
      const step = document.createElement('div');
      step.className = `chain-step ${idx === this.currentChainIdx ? 'active' : ''}`;
      step.innerHTML = `<span>${c.step}</span><span>${c.label}</span>`;
      this.chainLadder.appendChild(step);
    });
  }

  renderPlayers() {
    if (!this.playersGrid) return;
    this.playersGrid.innerHTML = '';
    this.players.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = `player-card ${p.eliminated ? 'eliminated' : ''}`;
      card.innerHTML = `
        <input type="text" class="team-name-input" value="${p.name}" onchange="weakestLinkApp.updatePlayerName(${idx}, this.value)">
        <div style="font-size: 1.1rem; font-weight: 800; color: ${p.eliminated ? '#ef4444' : '#34d399'}; text-align: center;">
          ${p.eliminated ? '❌ ELIMINATED' : '✅ IN GAME'}
        </div>
        <button onclick="weakestLinkApp.toggleElimination(${idx})" class="btn ${p.eliminated ? 'btn-primary' : 'danger-light'}" style="margin-top: 4px;">
          ${p.eliminated ? '🔄 Reinstate' : '❌ Goodbye!'}
        </button>
      `;
      this.playersGrid.appendChild(card);
    });
  }

  updatePlayerName(pIdx, name) {
    this.players[pIdx].name = name;
    this.broadcastState();
  }

  renderScores() {
    if (this.totalBankVal) this.totalBankVal.textContent = `$${this.totalBanked}`;
  }

  broadcastState() {
    if (!this.broadcast) return;
    const payload = {
      currentChainIdx: this.currentChainIdx,
      totalBanked: this.totalBanked,
      players: this.players,
      timerSeconds: this.timerSeconds
    };
    try {
      localStorage.setItem('weakestlink_last_state', JSON.stringify(payload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_WEAKESTLINK_STATE', state: payload });
  }
}

let weakestLinkApp = null;
window.addEventListener('DOMContentLoaded', () => {
  weakestLinkApp = new WeakestLinkController();
});
