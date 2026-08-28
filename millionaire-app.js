/**
 * Who Wants to Be a Millionaire Controller Engine
 */

const MILLIONAIRE_QUESTIONS = [
  { val: "$100", text: "Which planet is known as the Red Planet?", options: ["A: Venus", "B: Mars", "C: Jupiter", "D: Saturn"], answer: "B" },
  { val: "$200", text: "What is the capital city of Canada?", options: ["A: Toronto", "B: Vancouver", "C: Ottawa", "D: Montreal"], answer: "C" },
  { val: "$300", text: "How many sides does a hexagon have?", options: ["A: 5", "B: 6", "C: 7", "D: 8"], answer: "B" },
  { val: "$500", text: "Which element does 'O' represent on the periodic table?", options: ["A: Gold", "B: Oxygen", "C: Osmium", "D: Silver"], answer: "B" },
  { val: "$1,000", text: "What famous structure is located in Newfoundland?", options: ["A: CN Tower", "B: Signal Hill", "C: Banff Springs", "D: Parliament"], answer: "B" },
  { val: "$2,000", text: "Which ocean is the largest in the world?", options: ["A: Atlantic", "B: Indian", "C: Pacific", "D: Arctic"], answer: "C" },
  { val: "$4,000", text: "Who painted the Mona Lisa?", options: ["A: Picasso", "B: Da Vinci", "C: Van Gogh", "D: Monet"], answer: "B" },
  { val: "$8,000", text: "What is the hardest natural substance on Earth?", options: ["A: Iron", "B: Diamond", "C: Quartz", "D: Platinum"], answer: "B" },
  { val: "$16,000", text: "In what year did the Titanic sink?", options: ["A: 1905", "B: 1912", "C: 1918", "D: 1925"], answer: "B" },
  { val: "$32,000", text: "What instrument measures atmospheric pressure?", options: ["A: Thermometer", "B: Barometer", "C: Altimeter", "D: Anemometer"], answer: "B" },
  { val: "$64,000", text: "Which chemical element has atomic number 1?", options: ["A: Helium", "B: Hydrogen", "C: Carbon", "D: Lithium"], answer: "B" },
  { val: "$125,000", text: "What is the capital of Australia?", options: ["A: Sydney", "B: Melbourne", "C: Canberra", "D: Brisbane"], answer: "C" },
  { val: "$250,000", text: "Which country gifted the Statue of Liberty to the USA?", options: ["A: Britain", "B: France", "C: Spain", "D: Germany"], answer: "B" },
  { val: "$500,000", text: "How many bones are in the adult human body?", options: ["A: 206", "B: 212", "C: 198", "D: 220"], answer: "A" },
  { val: "$1,000,000", text: "Which scientist proposed the Theory of Relativity?", options: ["A: Newton", "B: Albert Einstein", "C: Galileo", "D: Tesla"], answer: "B" }
];

class MillionaireController {
  constructor() {
    this.broadcast = new BroadcastChannel('millionaire_stage_broadcast');
    
    this.currentStep = 0;
    this.selectedOption = null;
    this.revealedCorrect = false;
    this.hiddenOptions = new Set();

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.renderLadder();
    this.renderQuestion();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost(() => {}, () => {});
      mobilePeerManager.setGameInfo('WHO WANTS TO BE A MILLIONAIRE', ['CONTESTANT 1']);
      mobilePeerManager.setMobileTarget('millionaire-mobile-spectator.html', false);
    }
  }

  initDOM() {
    this.themeSelect = document.getElementById('theme-select');
    this.spectatorBtn = document.getElementById('spectator-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.questionText = document.getElementById('question-text');
    this.moneyLadder = document.getElementById('money-ladder');

    this.optA = document.getElementById('opt-a');
    this.optB = document.getElementById('opt-b');
    this.optC = document.getElementById('opt-c');
    this.optD = document.getElementById('opt-d');

    this.lockAnswerBtn = document.getElementById('lock-answer-btn');
    this.revealCorrectBtn = document.getElementById('reveal-correct-btn');
    this.nextQuestionBtn = document.getElementById('next-question-btn');

    this.lifeline5050 = document.getElementById('lifeline-5050');
    this.lifelineAudience = document.getElementById('lifeline-audience');
    this.lifelinePhone = document.getElementById('lifeline-phone');
    this.askAudienceBtn = document.getElementById('ask-audience-btn') || this.lifelineAudience;
    this.phoneFriendBtn = document.getElementById('phone-friend-btn') || this.lifelinePhone;

    this.qrBtn = document.getElementById('qr-btn');
    this.qrModal = document.getElementById('qr-modal');
    this.closeQrBtn = document.getElementById('close-qr-btn');

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
        window.open('millionaire-spectator.html', 'MillionaireSpectatorWindow', 'width=1280,height=720');
      });
    }

    if (this.lockAnswerBtn) {
      this.lockAnswerBtn.addEventListener('click', () => {
        sounds.playDing();
        this.broadcastState();
      });
    }

    if (this.revealCorrectBtn) {
      this.revealCorrectBtn.addEventListener('click', () => {
        this.revealedCorrect = true;
        const q = MILLIONAIRE_QUESTIONS[this.currentStep];
        if (this.selectedOption === q.answer) sounds.playFanfare();
        else sounds.playBuzzer();
        this.renderQuestion();
        this.broadcastState();
      });
    }

    if (this.nextQuestionBtn) {
      this.nextQuestionBtn.addEventListener('click', () => {
        if (this.currentStep < MILLIONAIRE_QUESTIONS.length - 1) {
          this.currentStep++;
          this.selectedOption = null;
          this.revealedCorrect = false;
          this.hiddenOptions.clear();
          this.renderLadder();
          this.renderQuestion();
          this.broadcastState();
        }
      });
    }

    if (this.qrBtn) this.qrBtn.addEventListener('click', () => { if (this.qrModal) this.qrModal.classList.remove('hidden'); });
    if (this.closeQrBtn) this.closeQrBtn.addEventListener('click', () => { if (this.qrModal) this.qrModal.classList.add('hidden'); });

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.currentStep = 0;
        this.selectedOption = null;
        this.revealedCorrect = false;
        this.hiddenOptions.clear();
        if (this.lifeline5050) this.lifeline5050.disabled = false;
        if (this.askAudienceBtn) this.askAudienceBtn.disabled = false;
        if (this.phoneFriendBtn) this.phoneFriendBtn.disabled = false;
        this.renderLadder();
        this.renderQuestion();
        this.broadcastState();
      });
    }

    if (this.lifeline5050) {
      this.lifeline5050.addEventListener('click', () => {
        const q = MILLIONAIRE_QUESTIONS[this.currentStep];
        const wrongs = ['A', 'B', 'C', 'D'].filter(o => o !== q.answer);
        wrongs.sort(() => Math.random() - 0.5);
        this.hiddenOptions.add(wrongs[0]);
        this.hiddenOptions.add(wrongs[1]);
        this.lifeline5050.disabled = true;
        this.renderQuestion();
        this.broadcastState();
      });
    }

    if (this.askAudienceBtn) {
      this.askAudienceBtn.addEventListener('click', () => {
        if (this.askAudienceBtn.disabled) return;
        this.askAudienceBtn.disabled = true;
        alert('Ask the Audience lifeline used! Reveal audience poll results.');
        this.broadcastState();
      });
    }

    if (this.phoneFriendBtn) {
      this.phoneFriendBtn.addEventListener('click', () => {
        if (this.phoneFriendBtn.disabled) return;
        this.phoneFriendBtn.disabled = true;
        alert('Phone a Friend lifeline used! 30-second call begins now.');
        this.broadcastState();
      });
    }

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

  selectOption(optKey) {
    this.selectedOption = optKey;
    this.renderQuestion();
    this.broadcastState();
  }

  renderLadder() {
    if (!this.moneyLadder) return;
    this.moneyLadder.innerHTML = '';
    MILLIONAIRE_QUESTIONS.forEach((q, idx) => {
      const step = document.createElement('div');
      step.className = `ladder-step ${idx === 4 || idx === 9 || idx === 14 ? 'milestone' : ''} ${idx === this.currentStep ? 'active' : ''}`;
      step.innerHTML = `<span>${idx + 1}</span><span>${q.val}</span>`;
      this.moneyLadder.appendChild(step);
    });
  }

  renderQuestion() {
    const q = MILLIONAIRE_QUESTIONS[this.currentStep];
    if (this.questionText) {
      this.questionText.textContent = `Q${this.currentStep + 1} (${q.val}): ${q.text}`;
    }

    const opts = [
      { key: 'A', btn: this.optA, text: q.options[0] },
      { key: 'B', btn: this.optB, text: q.options[1] },
      { key: 'C', btn: this.optC, text: q.options[2] },
      { key: 'D', btn: this.optD, text: q.options[3] }
    ];

    opts.forEach(o => {
      if (!o.btn) return;
      o.btn.textContent = o.text;
      o.btn.className = 'opt-btn';

      if (this.hiddenOptions.has(o.key)) {
        o.btn.classList.add('hidden-opt');
      }

      if (this.selectedOption === o.key) {
        o.btn.classList.add('selected');
      }

      if (this.revealedCorrect && q.answer === o.key) {
        o.btn.classList.add('correct');
      }
    });
  }

  broadcastState() {
    if (!this.broadcast) return;
    const q = MILLIONAIRE_QUESTIONS[this.currentStep];
    const payload = {
      step: this.currentStep,
      val: q.val,
      text: q.text,
      options: q.options,
      answer: q.answer,
      selectedOption: this.selectedOption,
      revealedCorrect: this.revealedCorrect,
      hiddenOptions: Array.from(this.hiddenOptions)
    };
    try {
      localStorage.setItem('millionaire_last_state', JSON.stringify(payload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_MILLIONAIRE_STATE', state: payload });
  }
}

let millApp = null;
window.addEventListener('DOMContentLoaded', () => {
  millApp = new MillionaireController();
});
