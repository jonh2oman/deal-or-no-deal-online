/**
 * Minute to Win It Controller Engine
 */

const MINUTE_CHALLENGES = [
  { name: "JUNK IN THE TRUNK", rules: "Shake 8 ping pong balls out of a tissue box strapped to your waist in under 60 seconds without using your hands!" },
  { name: "FACE THE COOKIE", rules: "Move a cookie from your forehead into your mouth using only your facial muscles in under 60 seconds!" },
  { name: "A BIT DICEY", rules: "Balance 6 dice on a popsicle stick held in your mouth for 3 consecutive seconds!" },
  { name: "NOODLING AROUND", rules: "Pick up 6 penne pasta pieces using a single strand of uncooked spaghetti held in your mouth!" },
  { name: "TILT-A-CUP", rules: "Create a 5-cup stack by catching bouncing ping pong balls in cups while holding the stack!" }
];

class MinuteToWinItController {
  constructor() {
    this.broadcast = new BroadcastChannel('minutetowinit_stage_broadcast');
    
    this.timeLeft = 60;
    this.timerInterval = null;
    this.isRunning = false;

    this.lives = 3;
    this.activeChallengeIdx = 0;

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.renderChallengeSelect();
    this.renderChallenge();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost((buzzData) => {}, (voteData) => {});
      mobilePeerManager.setGameInfo("MINUTE TO WIN IT", ["CONTESTANT 1"]);
    }
  }

  initDOM() {
    this.themeSelect = document.getElementById('theme-select');
    this.spectatorBtn = document.getElementById('spectator-btn');
    this.resetBtn = document.getElementById('reset-btn');
    
    this.clockDisplay = document.getElementById('clock-display');
    this.startTimerBtn = document.getElementById('start-timer-btn');
    this.pauseTimerBtn = document.getElementById('pause-timer-btn');
    this.resetTimerBtn = document.getElementById('reset-timer-btn');

    this.challengeSelect = document.getElementById('challenge-select');
    this.challengeNameText = document.getElementById('challenge-name-text');
    this.challengeRulesText = document.getElementById('challenge-rules-text');
    this.livesDisplay = document.getElementById('lives-display');

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
        window.open('minutetowinit-spectator.html', 'MinuteSpectatorWindow', 'width=1280,height=720');
      });
    }

    if (this.startTimerBtn) this.startTimerBtn.addEventListener('click', () => this.startTimer());
    if (this.pauseTimerBtn) this.pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
    if (this.resetTimerBtn) this.resetTimerBtn.addEventListener('click', () => this.resetTimer());

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

  renderChallengeSelect() {
    if (!this.challengeSelect) return;
    this.challengeSelect.innerHTML = MINUTE_CHALLENGES.map((c, idx) => `
      <option value="${idx}">Level ${idx + 1}: ${c.name}</option>
    `).join('');
  }

  selectChallenge(idx) {
    this.activeChallengeIdx = parseInt(idx, 10);
    this.resetTimer();
    this.renderChallenge();
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    sounds.playClock();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.renderClock();
      this.broadcastState();
      if (this.timeLeft === 0) {
        this.pauseTimer();
        sounds.playBuzzer();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.broadcastState();
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = 60;
    this.renderClock();
    this.broadcastState();
  }

  loseLife() {
    if (this.lives > 0) this.lives--;
    sounds.playBuzzer();
    this.renderChallenge();
    this.broadcastState();
  }

  passChallenge() {
    sounds.playFanfare();
    if (this.activeChallengeIdx < MINUTE_CHALLENGES.length - 1) {
      this.activeChallengeIdx++;
      if (this.challengeSelect) this.challengeSelect.value = this.activeChallengeIdx;
    }
    this.resetTimer();
    this.renderChallenge();
  }

  renderClock() {
    const secs = this.timeLeft.toString().padStart(2, '0');
    if (this.clockDisplay) this.clockDisplay.textContent = `00:${secs}`;
  }

  renderChallenge() {
    const c = MINUTE_CHALLENGES[this.activeChallengeIdx];
    if (this.challengeNameText) this.challengeNameText.textContent = c.name;
    if (this.challengeRulesText) this.challengeRulesText.textContent = c.rules;
    if (this.livesDisplay) this.livesDisplay.textContent = '❤️'.repeat(this.lives) + '🖤'.repeat(3 - this.lives);
    this.renderClock();
  }

  broadcastState() {
    if (!this.broadcast) return;
    const c = MINUTE_CHALLENGES[this.activeChallengeIdx];
    const payload = {
      timeLeft: this.timeLeft,
      isRunning: this.isRunning,
      lives: this.lives,
      challengeName: c.name,
      challengeRules: c.rules
    };
    try {
      localStorage.setItem('minutetowinit_last_state', JSON.stringify(payload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_MINUTETOWINIT_STATE', state: payload });
  }
}

let minuteApp = null;
window.addEventListener('DOMContentLoaded', () => {
  minuteApp = new MinuteToWinItController();
});
