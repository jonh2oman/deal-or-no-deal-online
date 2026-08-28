/**
 * Jeopardy Spectator Receiver & 6x5 Board Renderer
 */

class JeopardySpectatorController {
  constructor() {
    this.state = null;
    this.broadcast = new BroadcastChannel('jeopardy_stage_broadcast');
    this.broadcast.onmessage = (e) => this.handleMessage(e.data);

    window.addEventListener('storage', (e) => {
      if (e.key === 'jeopardy_last_state' && e.newValue) {
        try {
          this.renderState(JSON.parse(e.newValue));
        } catch (err) {}
      }
    });

    setInterval(() => this.fetchHeartbeat(), 300);

    this.initDOM();
    this.loadInitialState();
  }

  loadInitialState() {
    try {
      const saved = localStorage.getItem('jeopardy_last_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) this.renderState(parsed);
      }
    } catch (e) {}
    this.broadcast.postMessage({ type: 'REQUEST_STATE' });
  }

  fetchHeartbeat() {
    try {
      const saved = localStorage.getItem('jeopardy_last_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && JSON.stringify(parsed) !== JSON.stringify(this.state)) {
          this.renderState(parsed);
        }
      }
    } catch (e) {}
  }

  initDOM() {
    this.elements = {
      brandEventTitle: document.getElementById('brand-event-title'),
      brandEventSubtitle: document.getElementById('brand-event-subtitle'),
      brandTagCode: document.getElementById('brand-tag-code'),

      p1Name: document.getElementById('p1-name'),
      p2Name: document.getElementById('p2-name'),
      p3Name: document.getElementById('p3-name'),
      p1Score: document.getElementById('p1-score'),
      p2Score: document.getElementById('p2-score'),
      p3Score: document.getElementById('p3-score'),

      jeopStageBoard: document.getElementById('jeop-stage-board'),
      clueStageModal: document.getElementById('clue-stage-modal'),
      clueModalVal: document.getElementById('clue-modal-val'),
      clueModalText: document.getElementById('clue-modal-text')
    };

    if (this.elements.clueStageModal) {
      this.elements.clueStageModal.addEventListener('click', () => {
        this.elements.clueStageModal.classList.add('hidden');
        this.elements.clueStageModal.style.display = 'none';
      });
    }
  }

  handleMessage(data) {
    if (!data) return;
    if (data.type === 'SYNC_JEOPARDY_STATE' && data.state) {
      this.renderState(data.state);
    } else if (data.type === 'PLAY_SOUND' && data.sound) {
      this.playSound(data.sound);
    }
  }

  playSound(sound) {
    if (sound === 'chime') sounds.playChime();
    else if (sound === 'daily') sounds.playDailyDouble();
    else if (sound === 'buzzer') sounds.playBuzzer();
    else if (sound === 'win') { sounds.playFanfare(); startConfetti(); }
    else if (sound === 'theme') sounds.playTheme();
    else if (sound === 'stop') sounds.stopAll();
  }

  renderState(state) {
    this.state = state;
    if (!state) return;

    if (state.theme) {
      document.documentElement.setAttribute('data-theme', state.theme);
      document.body.setAttribute('data-theme', state.theme);
    }

    if (state.branding) {
      if (this.elements.brandEventTitle) this.elements.brandEventTitle.textContent = state.branding.eventTitle || "JEOPARDY!";
      if (this.elements.brandEventSubtitle) this.elements.brandEventSubtitle.textContent = state.branding.eventSubtitle || "LIVE STAGE SHOWDOWN";
      if (this.elements.brandTagCode) this.elements.brandTagCode.textContent = state.branding.eventTag || "JEOP-15";
      
      const badge = document.querySelector('.flight-badge');
      if (badge) {
        if (state.branding.showEventTag === false) badge.classList.add('hidden');
        else badge.classList.remove('hidden');
      }

      document.title = `${state.branding.eventTitle || "Jeopardy!"} - Stage Display`;
    }

    if (this.elements.p1Name) this.elements.p1Name.textContent = state.p1Name || "CONTESTANT 1";
    if (this.elements.p2Name) this.elements.p2Name.textContent = state.p2Name || "CONTESTANT 2";
    if (this.elements.p3Name) this.elements.p3Name.textContent = state.p3Name || "CONTESTANT 3";
    if (this.elements.p1Score) this.elements.p1Score.textContent = `$${state.p1Score || 0}`;
    if (this.elements.p2Score) this.elements.p2Score.textContent = `$${state.p2Score || 0}`;
    if (this.elements.p3Score) this.elements.p3Score.textContent = `$${state.p3Score || 0}`;

    // Render 6x5 Stage Board
    if (this.elements.jeopStageBoard && state.board) {
      let html = '';
      state.board.forEach(cat => {
        html += `<div class="stage-cat-cell">${cat.category}</div>`;
      });

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 6; c++) {
          const clue = state.board[c].clues[r];
          html += `
            <div class="stage-clue-cell ${clue.revealed ? 'revealed' : ''}">
              ${clue.revealed ? '' : '$' + clue.val}
            </div>
          `;
        }
      }
      this.elements.jeopStageBoard.innerHTML = html;
    }

    // Render Fullscreen Active Clue Modal
    if (this.elements.clueStageModal) {
      if (state.activeClue) {
        this.elements.clueModalVal.textContent = state.activeClue.dailyDouble ? "🎲 DAILY DOUBLE!" : `${state.activeClue.category} - $${state.activeClue.val}`;
        this.elements.clueModalText.textContent = state.activeClue.text;
        if (state.activeClue.dailyDouble) {
          this.elements.clueStageModal.classList.add('daily-double-bg');
        } else {
          this.elements.clueStageModal.classList.remove('daily-double-bg');
        }
        this.elements.clueStageModal.classList.remove('hidden');
        this.elements.clueStageModal.style.display = 'flex';
      } else {
        this.elements.clueStageModal.classList.add('hidden');
        this.elements.clueStageModal.style.display = 'none';
      }
    }
  }
}

// Confetti Engine
let confettiAnimationId = null;
function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#38bdf8', '#0284c7', '#f59e0b', '#fbbf24', '#ffffff', '#10b981'];
  const particles = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 10 + 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 5 + 3,
    speedX: Math.random() * 4 - 2,
    rotation: Math.random() * 360,
    rotSpeed: Math.random() * 6 - 3
  }));

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    confettiAnimationId = requestAnimationFrame(render);
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  render();
  setTimeout(() => {
    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 4000);
}

window.addEventListener('DOMContentLoaded', () => {
  new JeopardySpectatorController();
});
