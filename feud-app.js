/**
 * Family Feud Stage Engine - Host Control Machine
 */

const PRESET_FEUD_QUESTIONS = [
  {
    id: 1,
    question: "Name something people bring to the beach",
    answers: [
      { text: "TOWEL", pts: 38, revealed: false },
      { text: "SUNSCREEN", pts: 24, revealed: false },
      { text: "BEACH BALL", pts: 14, revealed: false },
      { text: "COOLER / SNACKS", pts: 10, revealed: false },
      { text: "SUNGLASSES", pts: 8, revealed: false },
      { text: "LOU NGE CHAIR", pts: 6, revealed: false }
    ]
  },
  {
    id: 2,
    question: "Name something you might hear at a noisy party",
    answers: [
      { text: "LOUD MUSIC", pts: 42, revealed: false },
      { text: "LAUGHTER", pts: 26, revealed: false },
      { text: "CHEERING / SHOUTING", pts: 16, revealed: false },
      { text: "POPPING CORKS / CLINKING GLASSES", pts: 10, revealed: false },
      { text: "DANCING FOOTSTEPS", pts: 6, revealed: false }
    ]
  },
  {
    id: 3,
    question: "Name something people complain about at work",
    answers: [
      { text: "THE BOSS", pts: 35, revealed: false },
      { text: "LOW PAY / SALARY", pts: 28, revealed: false },
      { text: "LONG HOURS", pts: 18, revealed: false },
      { text: "TOO MANY MEETINGS", pts: 12, revealed: false },
      { text: "COLD OFFICE AIR", pts: 7, revealed: false }
    ]
  },
  {
    id: 4,
    question: "Name a food people buy at a stadium",
    answers: [
      { text: "HOT DOG", pts: 48, revealed: false },
      { text: "POPCORN / NACHOS", pts: 22, revealed: false },
      { text: "BEER / SODA", pts: 16, revealed: false },
      { text: "PRETZELS", pts: 8, revealed: false },
      { text: "PEANUTS", pts: 6, revealed: false }
    ]
  },
  {
    id: 5,
    question: "Name a reason someone might wake up in the middle of the night",
    answers: [
      { text: "USE THE RESTROOM", pts: 45, revealed: false },
      { text: "BAD DREAM / NIGHTMARE", pts: 22, revealed: false },
      { text: "THIRSTY FOR WATER", pts: 15, revealed: false },
      { text: "HEARD A NOISE", pts: 12, revealed: false },
      { text: "TOO HOT OR COLD", pts: 6, revealed: false }
    ]
  }
];

const DEFAULT_BRANDING = {
  eventTitle: "FAMILY FEUD",
  eventSubtitle: "LIVE STAGE SHOWDOWN",
  eventTag: "FEUD-15",
  showEventTag: true,
  defaultTheme: "runway-blue"
};

class FeudController {
  constructor() {
    this.questions = JSON.parse(JSON.stringify(PRESET_FEUD_QUESTIONS));
    this.activeQuestionIndex = 0;
    this.team1Name = "TEAM 1";
    this.team2Name = "TEAM 2";
    this.team1Score = 0;
    this.team2Score = 0;
    this.roundBank = 0;
    this.multiplier = 1;
    this.strikes = 0;
    this.theme = "runway-blue";
    this.branding = this.loadBranding();

    this.broadcast = new BroadcastChannel('feud_stage_broadcast');
    this.broadcast.onmessage = (e) => {
      if (e.data && e.data.type === 'REQUEST_STATE') {
        this.broadcastState();
      }
    };

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.applyBranding();
    this.renderQuestionList();
    this.loadQuestion(0);

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost(
        (buzzData) => this.handleMobileBuzz(buzzData),
        (voteData) => this.handleMobileVote(voteData)
      );
      mobilePeerManager.setGameInfo("FAMILY FEUD", [this.team1Name, this.team2Name]);
    }
  }

  loadBranding() {
    try {
      const saved = localStorage.getItem('gander_deal_branding');
      if (saved) return Object.assign({}, DEFAULT_BRANDING, JSON.parse(saved));
    } catch (e) {}
    return Object.assign({}, DEFAULT_BRANDING);
  }

  saveBranding(updated) {
    this.branding = updated;
    try {
      localStorage.setItem('gander_deal_branding', JSON.stringify(updated));
    } catch (e) {}
    this.applyBranding();
    this.broadcastState();
  }

  applyBranding() {
    if (!this.branding) return;
    const b = this.branding;
    if (this.elements.brandEventTitle) this.elements.brandEventTitle.textContent = b.eventTitle || "FAMILY FEUD";
    if (this.elements.brandEventSubtitle) this.elements.brandEventSubtitle.textContent = b.eventSubtitle || "LIVE STAGE SHOWDOWN";
    if (this.elements.brandTagCode) this.elements.brandTagCode.textContent = b.eventTag || "FEUD-15";
    
    const badge = document.querySelector('.flight-badge');
    if (badge) {
      if (b.showEventTag === false) badge.classList.add('hidden');
      else badge.classList.remove('hidden');
    }

    document.title = `${b.eventTitle || "Family Feud"} - Host Control`;
    if (b.defaultTheme && b.defaultTheme !== this.theme) {
      this.setTheme(b.defaultTheme);
    }
  }

  setTheme(themeName) {
    this.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);
    if (this.elements.themeSelect) this.elements.themeSelect.value = themeName;
    this.broadcastState();
  }

  initDOM() {
    this.elements = {
      brandEventTitle: document.getElementById('brand-event-title'),
      brandEventSubtitle: document.getElementById('brand-event-subtitle'),
      brandTagCode: document.getElementById('brand-tag-code'),
      themeSelect: document.getElementById('theme-select'),
      spectatorBtn: document.getElementById('spectator-btn'),
      soundBtn: document.getElementById('sound-btn'),
      soundIcon: document.getElementById('sound-icon'),
      soundText: document.getElementById('sound-text'),
      adminBtn: document.getElementById('admin-btn'),
      resetBtn: document.getElementById('reset-btn'),

      team1NameInput: document.getElementById('team1-name'),
      team2NameInput: document.getElementById('team2-name'),
      team1ScoreDisplay: document.getElementById('team1-score'),
      team2ScoreDisplay: document.getElementById('team2-score'),
      awardTeam1Btn: document.getElementById('award-team1-btn'),
      awardTeam2Btn: document.getElementById('award-team2-btn'),
      roundBankVal: document.getElementById('round-bank-val'),

      mult1xBtn: document.getElementById('mult-1x-btn'),
      mult2xBtn: document.getElementById('mult-2x-btn'),
      mult3xBtn: document.getElementById('mult-3x-btn'),

      questionSelect: document.getElementById('question-select'),
      activeQuestionText: document.getElementById('active-question-text'),
      feudAnswersGrid: document.getElementById('feud-answers-grid'),

      strike1Btn: document.getElementById('strike-1-btn'),
      strike2Btn: document.getElementById('strike-2-btn'),
      strike3Btn: document.getElementById('strike-3-btn'),
      clearStrikesBtn: document.getElementById('clear-strikes-btn'),
      revealAllBtn: document.getElementById('reveal-all-btn'),

      adminModal: document.getElementById('admin-modal'),
      closeAdminBtn: document.getElementById('close-admin-btn'),
      savePrizesBtn: document.getElementById('save-prizes-btn'),
      tabBrandingBtn: document.getElementById('tab-branding-btn'),
      tabQuestionsBtn: document.getElementById('tab-questions-btn'),
      sectionBranding: document.getElementById('section-branding'),
      sectionQuestions: document.getElementById('section-questions'),
      settingEventTitle: document.getElementById('setting-event-title'),
      settingEventSubtitle: document.getElementById('setting-event-subtitle'),
      settingEventTag: document.getElementById('setting-event-tag'),
      settingShowTag: document.getElementById('setting-show-tag'),
      settingTheme: document.getElementById('setting-theme')
    };

    this.soundFxBtns = document.querySelectorAll('.sound-fx-btn');
  }

  bindEvents() {
    this.elements.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));

    this.elements.spectatorBtn.addEventListener('click', () => {
      window.open('feud-spectator.html', 'FeudSpectatorWindow', 'width=1280,height=720');
    });

    this.elements.soundBtn.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      if (isMuted) {
        this.elements.soundIcon.textContent = '📺';
        this.elements.soundText.textContent = 'PA Audio Only (Host Muted)';
      } else {
        this.elements.soundIcon.textContent = '🔊';
        this.elements.soundText.textContent = 'Host Audio ON';
      }
    });

    this.elements.team1NameInput.addEventListener('input', (e) => {
      this.team1Name = e.target.value.toUpperCase() || "TEAM 1";
      this.broadcastState();
    });

    this.elements.team2NameInput.addEventListener('input', (e) => {
      this.team2Name = e.target.value.toUpperCase() || "TEAM 2";
      this.broadcastState();
    });

    this.elements.awardTeam1Btn.addEventListener('click', () => {
      sounds.playDeal();
      this.team1Score += this.roundBank;
      this.roundBank = 0;
      this.renderScoreboard();
      this.broadcastState();
    });

    this.elements.awardTeam2Btn.addEventListener('click', () => {
      sounds.playDeal();
      this.team2Score += this.roundBank;
      this.roundBank = 0;
      this.renderScoreboard();
      this.broadcastState();
    });

    // Multipliers
    this.elements.mult1xBtn.addEventListener('click', () => this.setMultiplier(1));
    this.elements.mult2xBtn.addEventListener('click', () => this.setMultiplier(2));
    this.elements.mult3xBtn.addEventListener('click', () => this.setMultiplier(3));

    // Question Selection
    this.elements.questionSelect.addEventListener('change', (e) => {
      this.loadQuestion(parseInt(e.target.value, 10));
    });

    // Strikes
    this.elements.strike1Btn.addEventListener('click', () => this.triggerStrike(1));
    this.elements.strike2Btn.addEventListener('click', () => this.triggerStrike(2));
    this.elements.strike3Btn.addEventListener('click', () => this.triggerStrike(3));
    this.elements.clearStrikesBtn.addEventListener('click', () => this.clearStrikes());

    this.elements.revealAllBtn.addEventListener('click', () => this.revealAllAnswers());

    // Sound FX Dropdown Toggle
    const soundFxMenuBtn = document.getElementById('sound-fx-menu-btn');
    const soundFxDropdown = document.getElementById('sound-fx-dropdown');
    if (soundFxMenuBtn && soundFxDropdown) {
      soundFxMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundFxDropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        soundFxDropdown.classList.add('hidden');
      });
    }

    // Soundboard
    if (this.soundFxBtns) {
      this.soundFxBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const snd = btn.getAttribute('data-sound');
          if (snd === 'ding') sounds.playDing();
          else if (snd === 'buzzer') sounds.playBuzzer();
          else if (snd === 'clock') sounds.playClock();
          else if (snd === 'win') sounds.playFanfare();
          else if (snd === 'theme') sounds.playTheme();
          else if (snd === 'stop') sounds.stopAll();
          this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: snd });
        });
      });
    }

    // Settings Nav Tabs (Branding vs Questions)
    if (this.elements.tabBrandingBtn && this.elements.tabQuestionsBtn) {
      this.elements.tabBrandingBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.elements.tabBrandingBtn.classList.add('active');
        this.elements.tabQuestionsBtn.classList.remove('active');
        this.elements.sectionBranding.classList.remove('hidden');
        this.elements.sectionQuestions.classList.add('hidden');
      });

      this.elements.tabQuestionsBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.elements.tabQuestionsBtn.classList.add('active');
        this.elements.tabBrandingBtn.classList.remove('active');
        this.elements.sectionQuestions.classList.remove('hidden');
        this.elements.sectionBranding.classList.add('hidden');
        this.renderQuestionsEditor();
      });
    }

    const resetQuestionsBtn = document.getElementById('reset-default-questions-btn');
    if (resetQuestionsBtn) {
      resetQuestionsBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.questions = JSON.parse(JSON.stringify(PRESET_FEUD_QUESTIONS));
        this.saveQuestions();
        this.renderQuestionList();
        this.loadQuestion(0);
        this.renderQuestionsEditor();
      });
    }

    // Modal
    this.elements.adminBtn.addEventListener('click', () => {
      this.elements.settingEventTitle.value = this.branding.eventTitle || "";
      this.elements.settingEventSubtitle.value = this.branding.eventSubtitle || "";
      this.elements.settingEventTag.value = this.branding.eventTag || "";
      this.elements.settingShowTag.checked = this.branding.showEventTag !== false;
      this.elements.settingTheme.value = this.branding.defaultTheme || this.theme;
      this.elements.adminModal.classList.remove('hidden');
    });

    this.elements.closeAdminBtn.addEventListener('click', () => this.elements.adminModal.classList.add('hidden'));

    this.elements.savePrizesBtn.addEventListener('click', () => {
      const b = this.branding;
      b.eventTitle = this.elements.settingEventTitle.value.trim() || "FAMILY FEUD";
      b.eventSubtitle = this.elements.settingEventSubtitle.value.trim() || "LIVE STAGE SHOWDOWN";
      b.eventTag = this.elements.settingEventTag.value.trim() || "FEUD-15";
      b.showEventTag = this.elements.settingShowTag.checked;
      b.defaultTheme = this.elements.settingTheme.value;
      this.saveBranding(b);
      this.setTheme(b.defaultTheme);
      this.saveQuestionsFromEditor();
      this.elements.adminModal.classList.add('hidden');
    });

    const qrBtn = document.getElementById('qr-btn');
    const qrModal = document.getElementById('qr-modal');
    const closeQrBtn = document.getElementById('close-qr-btn');
    const resetBuzzersBtn = document.getElementById('reset-buzzers-btn');

    if (qrBtn && qrModal) {
      qrBtn.addEventListener('click', () => {
        sounds.playSelect();
        qrModal.classList.remove('hidden');
      });
    }

    if (closeQrBtn && qrModal) {
      closeQrBtn.addEventListener('click', () => qrModal.classList.add('hidden'));
    }

    if (resetBuzzersBtn) {
      resetBuzzersBtn.addEventListener('click', () => {
        sounds.playSelect();
        if (typeof mobilePeerManager !== 'undefined') {
          mobilePeerManager.resetBuzzers();
        }
      });
    }

    this.elements.resetBtn.addEventListener('click', () => {
      this.roundBank = 0;
      this.strikes = 0;
      if (typeof mobilePeerManager !== 'undefined') {
        mobilePeerManager.resetBuzzers();
      }
      this.loadQuestion(this.activeQuestionIndex);
    });
  }

  handleMobileBuzz(buzzData) {
    sounds.playBuzzer();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'buzzer' });
    this.triggerStrike(1);
    if (this.elements.activeQuestionText) {
      this.elements.activeQuestionText.textContent = `⚡ ${buzzData.teamName} BUZZED IN! (${buzzData.reactionTime}s)`;
    }
  }

  handleMobileVote(voteData) {
    // Vote aggregation handler
  }

  loadQuestions() {
    try {
      const saved = localStorage.getItem('feud_questions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return JSON.parse(JSON.stringify(PRESET_FEUD_QUESTIONS));
  }

  saveQuestions() {
    try {
      localStorage.setItem('feud_questions_v1', JSON.stringify(this.questions));
    } catch (e) {}
  }

  renderQuestionsEditor() {
    const container = document.getElementById('questions-editor-container');
    if (!container) return;

    container.innerHTML = this.questions.map((q, qIdx) => `
      <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 12px; padding: 14px; margin-bottom: 14px;">
        <div style="font-weight: 800; color: var(--sky-blue); margin-bottom: 8px;">QUESTION #${qIdx + 1}:</div>
        <input type="text" class="input-field editor-q-text" data-qidx="${qIdx}" value="${q.question}" style="margin-bottom: 10px; width: 100%;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${q.answers.map((a, aIdx) => `
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="font-size: 0.8rem; color: var(--text-muted); width: 20px;">#${aIdx + 1}</span>
              <input type="text" class="input-field editor-ans-text" data-qidx="${qIdx}" data-aidx="${aIdx}" value="${a.text}" placeholder="Answer" style="flex: 1;">
              <input type="number" class="input-field editor-ans-pts" data-qidx="${qIdx}" data-aidx="${aIdx}" value="${a.pts}" placeholder="Pts" style="width: 65px;">
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  saveQuestionsFromEditor() {
    const container = document.getElementById('questions-editor-container');
    if (!container) return;

    const qInputs = container.querySelectorAll('.editor-q-text');
    qInputs.forEach(qInput => {
      const qIdx = parseInt(qInput.getAttribute('data-qidx'), 10);
      if (this.questions[qIdx]) {
        this.questions[qIdx].question = qInput.value.trim() || `Question #${qIdx + 1}`;
      }
    });

    const ansTexts = container.querySelectorAll('.editor-ans-text');
    ansTexts.forEach(ansInput => {
      const qIdx = parseInt(ansInput.getAttribute('data-qidx'), 10);
      const aIdx = parseInt(ansInput.getAttribute('data-aidx'), 10);
      if (this.questions[qIdx] && this.questions[qIdx].answers[aIdx]) {
        this.questions[qIdx].answers[aIdx].text = ansInput.value.trim().toUpperCase() || `ANSWER #${aIdx + 1}`;
      }
    });

    const ansPts = container.querySelectorAll('.editor-ans-pts');
    ansPts.forEach(ptsInput => {
      const qIdx = parseInt(ptsInput.getAttribute('data-qidx'), 10);
      const aIdx = parseInt(ptsInput.getAttribute('data-aidx'), 10);
      if (this.questions[qIdx] && this.questions[qIdx].answers[aIdx]) {
        this.questions[qIdx].answers[aIdx].pts = parseInt(ptsInput.value, 10) || 10;
      }
    });

    this.saveQuestions();
    this.renderQuestionList();
    this.loadQuestion(this.activeQuestionIndex);
  }

  setMultiplier(mult) {
    this.multiplier = mult;
    [this.elements.mult1xBtn, this.elements.mult2xBtn, this.elements.mult3xBtn].forEach((btn, idx) => {
      if (idx + 1 === mult) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  renderQuestionList() {
    this.elements.questionSelect.innerHTML = this.questions.map((q, idx) => `
      <option value="${idx}">Q${idx + 1}: ${q.question}</option>
    `).join('');
  }

  loadQuestion(idx) {
    this.activeQuestionIndex = idx;
    this.elements.questionSelect.value = idx;
    const q = this.questions[idx];
    this.elements.activeQuestionText.textContent = q.question;
    this.strikes = 0;
    this.renderAnswersGrid();
    this.renderScoreboard();
    this.broadcastState();
  }

  renderAnswersGrid() {
    const q = this.questions[this.activeQuestionIndex];
    this.elements.feudAnswersGrid.innerHTML = q.answers.map((ans, aIdx) => `
      <div class="feud-answer-slot-card ${ans.revealed ? 'revealed' : ''}">
        <span class="slot-idx">#${aIdx + 1}</span>
        <span class="slot-text">${ans.revealed ? ans.text : '••••••••••••••••••••'}</span>
        <span class="slot-pts">${ans.revealed ? ans.pts * this.multiplier : '??'}</span>
        <button class="btn btn-primary" onclick="feudApp.toggleAnswer(${aIdx})">
          ${ans.revealed ? '🙈 Hide' : '🔔 Reveal'}
        </button>
      </div>
    `).join('');
  }

  toggleAnswer(aIdx) {
    const q = this.questions[this.activeQuestionIndex];
    const ans = q.answers[aIdx];
    ans.revealed = !ans.revealed;

    if (ans.revealed) {
      sounds.playDing();
      this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'ding' });
      this.roundBank += (ans.pts * this.multiplier);
    } else {
      this.roundBank = Math.max(0, this.roundBank - (ans.pts * this.multiplier));
    }

    this.renderAnswersGrid();
    this.renderScoreboard();
    this.broadcastState();
  }

  triggerStrike(count) {
    this.strikes = count;
    sounds.playBuzzer();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'buzzer' });
    this.broadcastState();

    // Auto-dismiss giant strike overlay after 2.5 seconds (classic TV behavior)
    if (this.strikeTimer) clearTimeout(this.strikeTimer);
    this.strikeTimer = setTimeout(() => {
      this.strikes = 0;
      this.broadcastState();
    }, 2500);
  }

  clearStrikes() {
    if (this.strikeTimer) clearTimeout(this.strikeTimer);
    this.strikes = 0;
    this.broadcastState();
  }

  revealAllAnswers() {
    const q = this.questions[this.activeQuestionIndex];
    q.answers.forEach(a => {
      if (!a.revealed) {
        a.revealed = true;
        this.roundBank += (a.pts * this.multiplier);
      }
    });
    sounds.playDing();
    this.renderAnswersGrid();
    this.renderScoreboard();
    this.broadcastState();
  }

  renderScoreboard() {
    this.elements.team1ScoreDisplay.textContent = this.team1Score;
    this.elements.team2ScoreDisplay.textContent = this.team2Score;
    this.elements.roundBankVal.textContent = this.roundBank;
  }

  broadcastState() {
    if (!this.broadcast) return;
    const q = this.questions[this.activeQuestionIndex];
    const statePayload = {
      branding: this.branding,
      theme: this.theme,
      team1Name: this.team1Name,
      team2Name: this.team2Name,
      team1Score: this.team1Score,
      team2Score: this.team2Score,
      roundBank: this.roundBank,
      multiplier: this.multiplier,
      strikes: this.strikes,
      activeQuestion: q ? q.question : "",
      answers: q ? q.answers : []
    };
    try {
      localStorage.setItem('feud_last_state', JSON.stringify(statePayload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_FEUD_STATE', state: statePayload });
  }
}

let feudApp = null;
window.addEventListener('DOMContentLoaded', () => {
  feudApp = new FeudController();
});
