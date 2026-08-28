/**
 * Wheel of Fortune Stage Controller Engine
 */

const WHEEL_WEDGES = [
  { label: "$1000", value: 1000, color: "#eab308", textColor: "#0f172a" },
  { label: "$300", value: 300, color: "#06b6d4", textColor: "#ffffff" },
  { label: "$500", value: 500, color: "#3b82f6", textColor: "#ffffff" },
  { label: "BANKRUPT", value: "BANKRUPT", color: "#0f172a", textColor: "#ef4444" },
  { label: "$600", value: 600, color: "#10b981", textColor: "#ffffff" },
  { label: "$400", value: 400, color: "#f97316", textColor: "#ffffff" },
  { label: "$700", value: 700, color: "#a855f7", textColor: "#ffffff" },
  { label: "LOSE A TURN", value: "LOSE_TURN", color: "#64748b", textColor: "#ffffff" },
  { label: "$800", value: 800, color: "#ec4899", textColor: "#ffffff" },
  { label: "$250", value: 250, color: "#14b8a6", textColor: "#ffffff" },
  { label: "$900", value: 900, color: "#8b5cf6", textColor: "#ffffff" },
  { label: "$500", value: 500, color: "#eab308", textColor: "#0f172a" },
];

const DEFAULT_PUZZLES = [
  { category: "PHRASE", phrase: "A PIECE OF CAKE" },
  { category: "EVENT", phrase: "GRAND OPENING CELEBRATION" },
  { category: "FAMOUS PLACE", phrase: "SIGNAL HILL NEWFOUNDLAND" },
  { category: "THING", phrase: "GOLDEN OPPORTUNITY" }
];

class WheelController {
  constructor() {
    this.broadcast = new BroadcastChannel('wheel_stage_broadcast');
    
    this.p1Name = "CONTESTANT 1";
    this.p2Name = "CONTESTANT 2";
    this.p3Name = "CONTESTANT 3";

    this.p1RoundScore = 0;
    this.p2RoundScore = 0;
    this.p3RoundScore = 0;

    this.p1TotalScore = 0;
    this.p2TotalScore = 0;
    this.p3TotalScore = 0;

    this.activeTurn = 0;
    this.currentPuzzleIdx = 0;
    this.currentCategory = DEFAULT_PUZZLES[0].category;
    this.currentPhrase = DEFAULT_PUZZLES[0].phrase;

    this.revealedLetters = new Set();
    this.activeSpinValue = 0;

    this.currentAngle = 0;
    this.isSpinning = false;

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.initWheelCanvas();
    this.renderKeyboard();
    this.renderPuzzleGrid();
    this.renderScores();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost((buzzData) => {}, (voteData) => {});
      mobilePeerManager.setGameInfo("WHEEL OF FORTUNE", [this.p1Name, this.p2Name, this.p3Name]);
    }
  }

  initDOM() {
    this.themeSelect = document.getElementById('theme-select');
    this.spectatorBtn = document.getElementById('spectator-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.qrBtn = document.getElementById('qr-btn');
    this.spinWheelBtn = document.getElementById('spin-wheel-btn');
    this.spinValueTag = document.getElementById('spin-value-tag');
    this.categoryDisplay = document.getElementById('category-display');
    this.puzzleGridContainer = document.getElementById('puzzle-grid-container');
    this.keyboardBank = document.getElementById('keyboard-bank');

    this.p1NameInput = document.getElementById('p1-name');
    this.p2NameInput = document.getElementById('p2-name');
    this.p3NameInput = document.getElementById('p3-name');

    this.p1RoundScoreDisplay = document.getElementById('p1-round-score');
    this.p2RoundScoreDisplay = document.getElementById('p2-round-score');
    this.p3RoundScoreDisplay = document.getElementById('p3-round-score');

    this.p1TotalScoreDisplay = document.getElementById('p1-total-score');
    this.p2TotalScoreDisplay = document.getElementById('p2-total-score');
    this.p3TotalScoreDisplay = document.getElementById('p3-total-score');

    this.cardP1 = document.getElementById('card-p1');
    this.cardP2 = document.getElementById('card-p2');
    this.cardP3 = document.getElementById('card-p3');

    this.solvePuzzleBtn = document.getElementById('solve-puzzle-btn');
    this.bankruptBtn = document.getElementById('bankrupt-btn');

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
        window.open('wheel-spectator.html', 'WheelSpectatorWindow', 'width=1280,height=720');
      });
    }

    if (this.spinWheelBtn) {
      this.spinWheelBtn.addEventListener('click', () => this.spinWheel());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.nextPuzzle());
    }

    if (this.solvePuzzleBtn) {
      this.solvePuzzleBtn.addEventListener('click', () => {
        for (let char of this.currentPhrase) {
          if (char !== ' ') {
            this.revealedLetters.add(char.toUpperCase());
          }
        }
        sounds.playFanfare();
        this.renderKeyboard();
        this.renderPuzzleGrid();
        this.broadcastState();
      });
    }

    if (this.bankruptBtn) {
      this.bankruptBtn.addEventListener('click', () => {
        if (this.activeTurn === 0) this.p1RoundScore = 0;
        else if (this.activeTurn === 1) this.p2RoundScore = 0;
        else if (this.activeTurn === 2) this.p3RoundScore = 0;
        sounds.playBuzzer();
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
          else if (snd === 'daily') sounds.playDailyDouble();
          else if (snd === 'buzzer') sounds.playBuzzer();
          else if (snd === 'win') sounds.playFanfare();
          else if (snd === 'theme') sounds.playTheme();
          else if (snd === 'stop') sounds.stopAll();
          this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: snd });
        });
      });
    }
  }

  initWheelCanvas() {
    this.canvas = document.getElementById('wheel-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.drawWheel();
  }

  drawWheel() {
    if (!this.ctx) return;
    const numWedges = WHEEL_WEDGES.length;
    const arc = (2 * Math.PI) / numWedges;
    const radius = 140;

    this.ctx.clearRect(0, 0, 280, 280);
    this.ctx.save();
    this.ctx.translate(140, 140);
    this.ctx.rotate(this.currentAngle);

    for (let i = 0; i < numWedges; i++) {
      const angle = i * arc;
      this.ctx.beginPath();
      this.ctx.fillStyle = WHEEL_WEDGES[i].color;
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, angle, angle + arc);
      this.ctx.lineTo(0, 0);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Text
      this.ctx.save();
      this.ctx.rotate(angle + arc / 2);
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = WHEEL_WEDGES[i].textColor;
      this.ctx.font = 'bold 14px Montserrat, sans-serif';
      this.ctx.fillText(WHEEL_WEDGES[i].label, radius - 14, 5);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  spinWheel() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    sounds.playDailyDouble();

    const spins = 5 + Math.random() * 5;
    const targetAngle = this.currentAngle + spins * 2 * Math.PI;
    const startTime = performance.now();
    const duration = 4000;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = targetAngle * easeOut;
      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.currentAngle = this.currentAngle % (2 * Math.PI);
        this.calculateSpinResult();
      }
    };

    requestAnimationFrame(animate);
  }

  calculateSpinResult() {
    const numWedges = WHEEL_WEDGES.length;
    const arc = (2 * Math.PI) / numWedges;
    // Pointer is at top (- Math.PI / 2)
    const normalized = ( (3 * Math.PI / 2) - (this.currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const wedgeIdx = Math.floor(normalized / arc) % numWedges;
    const wedge = WHEEL_WEDGES[wedgeIdx];

    if (typeof wedge.value === 'number') {
      this.activeSpinValue = wedge.value;
      this.spinValueTag.textContent = `$${wedge.value}`;
    } else if (wedge.value === 'BANKRUPT') {
      this.activeSpinValue = 0;
      this.spinValueTag.textContent = "💥 BANKRUPT";
      sounds.playBuzzer();
      this.bankruptActivePlayer();
    } else if (wedge.value === 'LOSE_TURN') {
      this.activeSpinValue = 0;
      this.spinValueTag.textContent = "🛑 LOSE A TURN";
      sounds.playBuzzer();
      this.nextTurn();
    }

    this.broadcastState();
  }

  bankruptActivePlayer() {
    if (this.activeTurn === 0) this.p1RoundScore = 0;
    else if (this.activeTurn === 1) this.p2RoundScore = 0;
    else if (this.activeTurn === 2) this.p3RoundScore = 0;
    this.renderScores();
    this.nextTurn();
  }

  nextTurn() {
    this.activeTurn = (this.activeTurn + 1) % 3;
    this.renderScores();
    this.broadcastState();
  }

  setActiveTurn(pIdx) {
    this.activeTurn = pIdx;
    this.renderScores();
    this.broadcastState();
  }

  guessLetter(letter) {
    if (this.revealedLetters.has(letter)) return;
    this.revealedLetters.add(letter);

    const count = (this.currentPhrase.match(new RegExp(letter, 'g')) || []).length;

    const vowels = ['A', 'E', 'I', 'O', 'U'];
    if (vowels.includes(letter.toUpperCase())) {
      // Deduct buy-a-vowel cost
      if (this.activeTurn === 0) this.p1RoundScore = Math.max(0, (this.p1RoundScore || 0) - 250);
      else if (this.activeTurn === 1) this.p2RoundScore = Math.max(0, (this.p2RoundScore || 0) - 250);
      else if (this.activeTurn === 2) this.p3RoundScore = Math.max(0, (this.p3RoundScore || 0) - 250);
    } else {
      // Award spin value × occurrences of the letter
      const points = (this.activeSpinValue || 0) * count;
      if (this.activeTurn === 0) this.p1RoundScore = (this.p1RoundScore || 0) + points;
      else if (this.activeTurn === 1) this.p2RoundScore = (this.p2RoundScore || 0) + points;
      else if (this.activeTurn === 2) this.p3RoundScore = (this.p3RoundScore || 0) + points;
    }

    if (count > 0) {
      sounds.playDing();
    } else {
      sounds.playBuzzer();
      this.nextTurn();
    }

    this.renderKeyboard();
    this.renderPuzzleGrid();
    this.renderScores();
    this.broadcastState();

    this.activeSpinValue = 0;
    if (this.spinValueTag) this.spinValueTag.textContent = '$0';
  }

  renderKeyboard() {
    if (!this.keyboardBank) return;
    this.keyboardBank.innerHTML = '';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    alphabet.forEach(char => {
      const btn = document.createElement('button');
      btn.className = `key-btn ${'AEIOU'.includes(char) ? 'vowel' : ''}`;
      btn.textContent = char;
      if (this.revealedLetters.has(char)) btn.disabled = true;

      btn.addEventListener('click', () => this.guessLetter(char));
      this.keyboardBank.appendChild(btn);
    });
  }

  renderPuzzleGrid() {
    if (!this.puzzleGridContainer) return;
    this.puzzleGridContainer.innerHTML = '';
    this.categoryDisplay.textContent = `CATEGORY: ${this.currentCategory}`;

    // Format into rows max 12 chars per row
    const words = this.currentPhrase.split(' ');
    let rows = [''];
    words.forEach(w => {
      if ((rows[rows.length - 1] + ' ' + w).trim().length <= 12) {
        rows[rows.length - 1] = (rows[rows.length - 1] + ' ' + w).trim();
      } else {
        rows.push(w);
      }
    });

    while (rows.length < 3) rows.push('');

    rows.forEach(rText => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'puzzle-row';
      const padded = rText.padStart(Math.floor((12 + rText.length) / 2)).padEnd(12);

      for (let char of padded) {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        if (char === ' ') {
          tile.classList.add('space-tile');
        } else {
          tile.classList.add('letter-space');
          if (this.revealedLetters.has(char)) {
            tile.classList.add('revealed');
            tile.textContent = char;
          } else {
            tile.classList.add('hidden-letter');
          }
        }
        rowDiv.appendChild(tile);
      }
      this.puzzleGridContainer.appendChild(rowDiv);
    });
  }

  renderScores() {
    this.p1RoundScoreDisplay.textContent = `$${this.p1RoundScore}`;
    this.p2RoundScoreDisplay.textContent = `$${this.p2RoundScore}`;
    this.p3RoundScoreDisplay.textContent = `$${this.p3RoundScore}`;

    this.p1TotalScoreDisplay.textContent = `$${this.p1TotalScore}`;
    this.p2TotalScoreDisplay.textContent = `$${this.p2TotalScore}`;
    this.p3TotalScoreDisplay.textContent = `$${this.p3TotalScore}`;

    [this.cardP1, this.cardP2, this.cardP3].forEach((c, idx) => {
      if (c) {
        if (idx === this.activeTurn) c.style.borderColor = '#facc15';
        else c.style.borderColor = 'var(--glass-border)';
      }
    });
  }

  nextPuzzle() {
    this.currentPuzzleIdx = (this.currentPuzzleIdx + 1) % DEFAULT_PUZZLES.length;
    this.currentCategory = DEFAULT_PUZZLES[this.currentPuzzleIdx].category;
    this.currentPhrase = DEFAULT_PUZZLES[this.currentPuzzleIdx].phrase;
    this.revealedLetters.clear();
    this.activeSpinValue = 0;
    this.spinValueTag.textContent = '$0';

    this.renderKeyboard();
    this.renderPuzzleGrid();
    this.broadcastState();
  }

  broadcastState() {
    if (!this.broadcast) return;
    const payload = {
      category: this.currentCategory,
      phrase: this.currentPhrase,
      revealedLetters: Array.from(this.revealedLetters),
      p1Name: this.p1Name,
      p2Name: this.p2Name,
      p3Name: this.p3Name,
      p1RoundScore: this.p1RoundScore,
      p2RoundScore: this.p2RoundScore,
      p3RoundScore: this.p3RoundScore,
      activeTurn: this.activeTurn,
      angle: this.currentAngle
    };
    try {
      localStorage.setItem('wheel_last_state', JSON.stringify(payload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_WHEEL_STATE', state: payload });
  }
}

let wheelApp = null;
window.addEventListener('DOMContentLoaded', () => {
  wheelApp = new WheelController();
});
