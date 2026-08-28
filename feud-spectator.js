/**
 * Family Feud Spectator Receiver & Mechanical Board Renderer
 */

class FeudSpectatorController {
  constructor() {
    this.state = null;
    this.broadcast = new BroadcastChannel('feud_stage_broadcast');
    this.broadcast.onmessage = (e) => this.handleMessage(e.data);

    window.addEventListener('storage', (e) => {
      if (e.key === 'feud_last_state' && e.newValue) {
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
      const saved = localStorage.getItem('feud_last_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) this.renderState(parsed);
      }
    } catch (e) {}
    this.broadcast.postMessage({ type: 'REQUEST_STATE' });
  }

  fetchHeartbeat() {
    try {
      const saved = localStorage.getItem('feud_last_state');
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
      roundIndicator: document.getElementById('round-indicator'),

      team1Name: document.getElementById('team1-name'),
      team2Name: document.getElementById('team2-name'),
      team1Score: document.getElementById('team1-score'),
      team2Score: document.getElementById('team2-score'),
      roundBankVal: document.getElementById('round-bank-val'),

      feudStageBoard: document.getElementById('feud-stage-board'),
      strikeOverlay: document.getElementById('strike-overlay'),
      statusHeading: document.getElementById('status-heading'),
      statusSubtext: document.getElementById('status-subtext')
    };

    if (this.elements.strikeOverlay) {
      this.elements.strikeOverlay.addEventListener('click', () => {
        this.elements.strikeOverlay.classList.add('hidden');
      });
    }
  }

  handleMessage(data) {
    if (!data) return;
    if (data.type === 'SYNC_FEUD_STATE' && data.state) {
      this.renderState(data.state);
    } else if (data.type === 'PLAY_SOUND' && data.sound) {
      this.playSound(data.sound);
    }
  }

  playSound(sound) {
    if (sound === 'ding') sounds.playDing();
    else if (sound === 'buzzer') sounds.playBuzzer();
    else if (sound === 'clock') sounds.playClock();
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
      if (this.elements.brandEventTitle) this.elements.brandEventTitle.textContent = state.branding.eventTitle || "FAMILY FEUD";
      if (this.elements.brandEventSubtitle) this.elements.brandEventSubtitle.textContent = state.branding.eventSubtitle || "LIVE STAGE SHOWDOWN";
      if (this.elements.brandTagCode) this.elements.brandTagCode.textContent = state.branding.eventTag || "FEUD-15";
      
      const badge = document.querySelector('.flight-badge');
      if (badge) {
        if (state.branding.showEventTag === false) badge.classList.add('hidden');
        else badge.classList.remove('hidden');
      }

      document.title = `${state.branding.eventTitle || "Family Feud"} - Stage Display`;
    }

    if (this.elements.team1Name) this.elements.team1Name.textContent = state.team1Name || "TEAM 1";
    if (this.elements.team2Name) this.elements.team2Name.textContent = state.team2Name || "TEAM 2";
    if (this.elements.team1Score) this.elements.team1Score.textContent = state.team1Score || 0;
    if (this.elements.team2Score) this.elements.team2Score.textContent = state.team2Score || 0;
    if (this.elements.roundBankVal) this.elements.roundBankVal.textContent = state.roundBank || 0;

    // Render Answers Mechanical Flip Board Grid
    if (this.elements.feudStageBoard && state.answers) {
      this.elements.feudStageBoard.innerHTML = state.answers.map((ans, idx) => {
        if (ans.revealed) {
          return `
            <div class="stage-flip-card">
              <span class="stage-answer-text">${ans.text}</span>
              <span class="stage-answer-pts">${ans.pts * (state.multiplier || 1)}</span>
            </div>
          `;
        } else {
          return `
            <div class="stage-flip-card hidden-slot">
              <span class="slot-number-badge">${idx + 1}</span>
            </div>
          `;
        }
      }).join('');
    }

    // Render Strike Overlay (❌)
    if (this.elements.strikeOverlay) {
      if (state.strikes && state.strikes > 0) {
        const strikeXs = Array.from({ length: state.strikes }, () => `<span class="strike-x">❌</span>`).join('');
        this.elements.strikeOverlay.innerHTML = strikeXs;
        this.elements.strikeOverlay.classList.remove('hidden');
      } else {
        this.elements.strikeOverlay.classList.add('hidden');
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
  new FeudSpectatorController();
});
