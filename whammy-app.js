/**
 * Press Your Luck (No Whammy!) Controller Engine
 */

const WHAMMY_BOARD_TILES = [
  { val: 1000, label: "$1,000", spins: 0, type: "cash" },
  { val: 500, label: "$500 + SPIN", spins: 1, type: "cash" },
  { val: 2000, label: "$2,000", spins: 0, type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", spins: 0, type: "whammy" },
  { val: 1500, label: "$1,500", spins: 0, type: "cash" },
  { val: 750, label: "$750 + SPIN", spins: 1, type: "cash" },
  { val: 3000, label: "$3,000", spins: 0, type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", spins: 0, type: "whammy" },
  { val: 2500, label: "$2,500", spins: 0, type: "cash" },
  { val: 1200, label: "$1,200", spins: 0, type: "cash" },
  { val: 5000, label: "$5,000 + SPIN", spins: 1, type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", spins: 0, type: "whammy" },
  { val: 4000, label: "$4,000", spins: 0, type: "cash" },
  { val: 800, label: "$800 + SPIN", spins: 1, type: "cash" },
  { val: 1750, label: "$1,750", spins: 0, type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", spins: 0, type: "whammy" },
  { val: 3500, label: "$3,500", spins: 0, type: "cash" },
  { val: 1000, label: "$1,000 + SPIN", spins: 1, type: "cash" }
];

const PERIMETER_PATH = [0, 1, 2, 3, 4, 5, 7, 9, 11, 17, 16, 15, 14, 13, 12, 10, 8, 6];

class WhammyController {
  constructor() {
    this.broadcast = new BroadcastChannel('whammy_stage_broadcast');
    
    this.p1Name = "CONTESTANT 1";
    this.p2Name = "CONTESTANT 2";
    this.p3Name = "CONTESTANT 3";

    this.p1Cash = 0;
    this.p2Cash = 0;
    this.p3Cash = 0;

    this.p1Spins = 3;
    this.p2Spins = 3;
    this.p3Spins = 3;

    this.p1Whammies = 0;
    this.p2Whammies = 0;
    this.p3Whammies = 0;

    this.activeTurn = 0;
    this.activeTileIdx = 0;
    this.perimeterStep = 0;
    this.playerEliminated = false;
    this.isCycling = false;
    this.cycleTimer = null;

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.renderBoard();
    this.renderScores();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost((buzzData) => {
        if (this.isCycling) this.stopBoard();
      }, (voteData) => {});
      mobilePeerManager.setGameInfo("PRESS YOUR LUCK", [this.p1Name, this.p2Name, this.p3Name]);
    }
  }

  initDOM() {
    this.themeSelect = document.getElementById('theme-select');
    this.spectatorBtn = document.getElementById('spectator-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.whammyGrid = document.getElementById('whammy-grid');

    this.p1NameInput = document.getElementById('p1-name');
    this.p2NameInput = document.getElementById('p2-name');
    this.p3NameInput = document.getElementById('p3-name');

    this.p1CashDisplay = document.getElementById('p1-cash');
    this.p2CashDisplay = document.getElementById('p2-cash');
    this.p3CashDisplay = document.getElementById('p3-cash');

    this.p1SpinsDisplay = document.getElementById('p1-spins');
    this.p2SpinsDisplay = document.getElementById('p2-spins');
    this.p3SpinsDisplay = document.getElementById('p3-spins');

    this.p1WhammiesDisplay = document.getElementById('p1-whammies');
    this.p2WhammiesDisplay = document.getElementById('p2-whammies');
    this.p3WhammiesDisplay = document.getElementById('p3-whammies');

    this.cardP1 = document.getElementById('card-p1');
    this.cardP2 = document.getElementById('card-p2');
    this.cardP3 = document.getElementById('card-p3');

    this.soundFxBtns = document.querySelectorAll('.sound-fx-btn');
  }

  bindEvents() {
    if (this.themeSelect) {
      this.themeSelect.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
        this.broadcastState();
      });
    }

    if (this.spectatorBtn) {
      this.spectatorBtn.addEventListener('click', () => {
        window.open('whammy-spectator.html', 'WhammySpectatorWindow', 'width=1280,height=720');
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.p1Cash = 0; this.p2Cash = 0; this.p3Cash = 0;
        this.p1Spins = 3; this.p2Spins = 3; this.p3Spins = 3;
        this.p1Whammies = 0; this.p2Whammies = 0; this.p3Whammies = 0;
        this.playerEliminated = false;
        const stopBtn = document.getElementById('stop-btn');
        const spinBtn = document.getElementById('spin-btn');
        if (stopBtn) stopBtn.disabled = false;
        if (spinBtn) spinBtn.disabled = false;
        this.renderScores();
        this.broadcastState();
      });
    }

    [this.p1NameInput, this.p2NameInput, this.p3NameInput].forEach((inp, idx) => {
      if (inp) {
        inp.addEventListener('input', () => {
          if (idx === 0) this.p1Name = inp.value;
          else if (idx === 1) this.p2Name = inp.value;
          else if (idx === 2) this.p3Name = inp.value;
          this.broadcastState();
        });
      }
    });

    if (this.soundFxBtns) {
      this.soundFxBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const snd = btn.getAttribute('data-sound');
          if (snd === 'chime') sounds.playDing();
          else if (snd === 'daily') sounds.playClock();
          else if (snd === 'buzzer') sounds.playBuzzer();
          else if (snd === 'win') sounds.playFanfare();
          else if (snd === 'theme') sounds.playTheme();
          else if (snd === 'stop') sounds.stopAll();
          this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: snd });
        });
      });
    }
  }

  toggleSpin() {
    if (this.isCycling) {
      this.stopBoard();
    } else {
      this.startBoard();
    }
  }

  startBoard() {
    let currentSpins = this.activeTurn === 0 ? this.p1Spins : (this.activeTurn === 1 ? this.p2Spins : this.p3Spins);
    if (currentSpins <= 0) {
      alert("No spins remaining for active contestant!");
      return;
    }

    this.isCycling = true;
    sounds.playClock();
    this.cycleTimer = setInterval(() => {
      this.perimeterStep = ((this.perimeterStep || 0) + 1) % PERIMETER_PATH.length;
      this.activeTileIdx = PERIMETER_PATH[this.perimeterStep];
      this.renderBoard();
    }, 90);
  }

  stopBoard() {
    if (!this.isCycling) return;
    clearInterval(this.cycleTimer);
    this.isCycling = false;

    // Deduct spin
    if (this.activeTurn === 0) this.p1Spins--;
    else if (this.activeTurn === 1) this.p2Spins--;
    else if (this.activeTurn === 2) this.p3Spins--;

    const landed = WHAMMY_BOARD_TILES[this.activeTileIdx];
    if (landed.type === 'whammy') {
      sounds.playBuzzer();
      if (this.activeTurn === 0) { this.p1Cash = 0; this.p1Whammies++; }
      else if (this.activeTurn === 1) { this.p2Cash = 0; this.p2Whammies++; }
      else if (this.activeTurn === 2) { this.p3Cash = 0; this.p3Whammies++; }

      if (this.p1Whammies >= 4) {
        // Eliminate the player
        this.playerEliminated = true;
        if (typeof sounds !== 'undefined' && sounds.playBuzzer) sounds.playBuzzer();
        alert('4 WHAMMIES! Player eliminated!');
        // Disable the STOP and SPIN buttons
        const stopBtn = document.getElementById('stop-btn');
        const spinBtn = document.getElementById('spin-btn');
        if (stopBtn) stopBtn.disabled = true;
        if (spinBtn) spinBtn.disabled = true;
      }
    } else {
      sounds.playDing();
      if (this.activeTurn === 0) { this.p1Cash += landed.val; this.p1Spins += landed.spins; }
      else if (this.activeTurn === 1) { this.p2Cash += landed.val; this.p2Spins += landed.spins; }
      else if (this.activeTurn === 2) { this.p3Cash += landed.val; this.p3Spins += landed.spins; }
    }

    this.renderScores();
    this.renderBoard();
    this.broadcastState();
  }

  setActiveTurn(idx) {
    this.activeTurn = idx;
    this.renderScores();
    this.broadcastState();
  }

  renderScores() {
    this.p1CashDisplay.textContent = `$${this.p1Cash}`;
    this.p2CashDisplay.textContent = `$${this.p2Cash}`;
    this.p3CashDisplay.textContent = `$${this.p3Cash}`;

    this.p1SpinsDisplay.textContent = this.p1Spins;
    this.p2SpinsDisplay.textContent = this.p2Spins;
    this.p3SpinsDisplay.textContent = this.p3Spins;

    this.p1WhammiesDisplay.textContent = this.p1Whammies;
    this.p2WhammiesDisplay.textContent = this.p2Whammies;
    this.p3WhammiesDisplay.textContent = this.p3Whammies;

    [this.cardP1, this.cardP2, this.cardP3].forEach((c, idx) => {
      if (c) {
        if (idx === this.activeTurn) c.style.borderColor = '#facc15';
        else c.style.borderColor = 'var(--glass-border)';
      }
    });
  }

  renderBoard() {
    if (!this.whammyGrid) return;
    this.whammyGrid.innerHTML = '';

    // Layout 18 tiles in perimeter ring (6 cols x 5 rows)
    const perimeterIndices = [
      0, 1, 2, 3, 4, 5,
      6, 7,
      8, 9,
      10, 11,
      12, 13, 14, 15, 16, 17
    ];

    WHAMMY_BOARD_TILES.forEach((tileData, idx) => {
      const tile = document.createElement('div');
      tile.className = `whammy-tile ${tileData.type === 'whammy' ? 'whammy-square' : ''} ${idx === this.activeTileIdx ? 'active-light' : ''}`;
      tile.textContent = tileData.label;
      this.whammyGrid.appendChild(tile);
    });

    // Center Control Box
    const center = document.createElement('div');
    center.className = 'whammy-tile inner-center';
    center.innerHTML = `
      <div style="font-size: 1.6rem; color: #fef08a; font-family: var(--font-display);">
        ${this.isCycling ? '⚡ BOARD SPINNING...' : '🎯 LANDED: ' + WHAMMY_BOARD_TILES[this.activeTileIdx].label}
      </div>
      <button onclick="whammyApp.toggleSpin()" class="btn btn-primary" style="font-size: 1.3rem; padding: 14px 28px;">
        ${this.isCycling ? '🛑 STOP BOARD!' : '🎯 SPIN BOARD'}
      </button>
    `;
    this.whammyGrid.appendChild(center);
  }

  broadcastState() {
    if (!this.broadcast) return;
    const payload = {
      p1Name: this.p1Name, p2Name: this.p2Name, p3Name: this.p3Name,
      p1Cash: this.p1Cash, p2Cash: this.p2Cash, p3Cash: this.p3Cash,
      p1Spins: this.p1Spins, p2Spins: this.p2Spins, p3Spins: this.p3Spins,
      p1Whammies: this.p1Whammies, p2Whammies: this.p2Whammies, p3Whammies: this.p3Whammies,
      activeTurn: this.activeTurn,
      activeTileIdx: this.activeTileIdx,
      isCycling: this.isCycling
    };
    try {
      localStorage.setItem('whammy_last_state', JSON.stringify(payload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_WHAMMY_STATE', state: payload });
  }
}

let whammyApp = null;
window.addEventListener('DOMContentLoaded', () => {
  whammyApp = new WhammyController();
});
