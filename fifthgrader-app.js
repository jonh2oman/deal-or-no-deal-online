/**
 * Are You Smarter Than a 5th Grader? Controller Engine
 */

const FIFTH_SUBJECTS = [
  { grade: "1st Grade", topic: "Animal Science", val: "$1,000", text: "What is the only mammal capable of true flight?", answer: "What is a Bat?" },
  { grade: "1st Grade", topic: "Reading", val: "$2,000", text: "What type of word describes a person, place, or thing?", answer: "What is a Noun?" },
  { grade: "2nd Grade", topic: "US History", val: "$5,000", text: "Who was the first President of the United States?", answer: "Who is George Washington?" },
  { grade: "2nd Grade", topic: "Astronomy", val: "$10,000", text: "Which planet is closest to the Sun?", answer: "What is Mercury?" },
  { grade: "3rd Grade", topic: "Earth Science", val: "$25,000", text: "What molten rock flows out of an erupting volcano?", answer: "What is Lava?" },
  { grade: "3rd Grade", topic: "Math", val: "$50,000", text: "What is the perimeter of a square with 7cm sides?", answer: "What is 28cm?" },
  { grade: "4th Grade", topic: "Geography", val: "$100,000", text: "What is the longest river in South America?", answer: "What is the Amazon River?" },
  { grade: "4th Grade", topic: "Grammar", val: "$175,000", text: "What is the past tense of the verb 'run'?", answer: "What is Ran?" },
  { grade: "5th Grade", topic: "World History", val: "$300,000", text: "Which ancient civilization built the pyramids of Giza?", answer: "Who are the Egyptians?" },
  { grade: "5th Grade", topic: "1 MILLION QUESTION", val: "$1,000,000", text: "How many elements are listed on the standard periodic table?", answer: "What is 118?" }
];

class FifthGraderController {
  constructor() {
    this.broadcast = new BroadcastChannel('fifthgrader_stage_broadcast');
    
    this.currentSubjectIdx = 0;
    this.classmate = "ALEX";
    this.revealedAnswer = false;
    this.clearedSubjects = new Set();
    this.droppedOut = false;

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.renderGrid();
    this.renderQuestion();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost((buzzData) => {}, (voteData) => {});
      mobilePeerManager.setGameInfo("5TH GRADER", ["CONTESTANT 1"]);
      mobilePeerManager.setMobileTarget('fifthgrader-mobile-spectator.html', false);
    }
  }

  initDOM() {
    this.themeSelect = document.getElementById('theme-select');
    this.spectatorBtn = document.getElementById('spectator-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.subjectGrid = document.getElementById('subject-grid');

    this.activeSubjectTag = document.getElementById('active-subject-tag');
    this.questionText = document.getElementById('question-text');
    this.answerText = document.getElementById('answer-text');

    this.classmateSelect = document.getElementById('classmate-select');
    this.revealAnsBtn = document.getElementById('reveal-ans-btn');
    this.passSubjectBtn = document.getElementById('pass-subject-btn');
    this.dropOutBtn = document.getElementById('drop-out-btn');

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
        window.open('fifthgrader-spectator.html', 'FifthSpectatorWindow', 'width=1280,height=720');
      });
    }

    if (this.classmateSelect) {
      this.classmateSelect.addEventListener('change', (e) => {
        this.classmate = e.target.value;
        this.broadcastState();
      });
    }

    if (this.revealAnsBtn) {
      this.revealAnsBtn.addEventListener('click', () => {
        this.revealedAnswer = true;
        sounds.playDing();
        this.renderQuestion();
        this.broadcastState();
      });
    }

    if (this.passSubjectBtn) {
      this.passSubjectBtn.addEventListener('click', () => {
        sounds.playFanfare();
        this.clearedSubjects.add(this.currentSubjectIdx);
        if (this.currentSubjectIdx < FIFTH_SUBJECTS.length - 1) {
          this.currentSubjectIdx++;
        }
        this.revealedAnswer = false;
        this.renderGrid();
        this.renderQuestion();
        this.broadcastState();
      });
    }

    if (this.dropOutBtn) {
      this.dropOutBtn.addEventListener('click', () => {
        this.droppedOut = true;
        sounds.playBuzzer();
        this.broadcastState();
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.currentSubjectIdx = 0;
        this.clearedSubjects.clear();
        this.revealedAnswer = false;
        this.droppedOut = false;
        this.renderGrid();
        this.renderQuestion();
        this.broadcastState();
      });
    }

    if (this.soundFxBtns) {
      this.soundFxBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const snd = btn.getAttribute('data-sound');
          if (snd === 'chime') sounds.playDing();
          else if (snd === 'daily') sounds.playDeal();
          else if (snd === 'buzzer') sounds.playBuzzer();
          else if (snd === 'win') sounds.playFanfare();
          else if (snd === 'theme') sounds.playTheme();
          else if (snd === 'stop') sounds.stopAll();
          this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: snd });
        });
      });
    }
  }

  selectSubject(idx) {
    this.currentSubjectIdx = idx;
    this.revealedAnswer = false;
    this.renderGrid();
    this.renderQuestion();
    this.broadcastState();
  }

  renderGrid() {
    if (!this.subjectGrid) return;
    this.subjectGrid.innerHTML = '';
    FIFTH_SUBJECTS.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = `grade-subject-card ${idx === this.currentSubjectIdx ? 'active' : ''} ${this.clearedSubjects.has(idx) ? 'cleared' : ''}`;
      card.innerHTML = `<span>${s.grade}: ${s.topic}</span><span>${s.val}</span>`;
      card.addEventListener('click', () => this.selectSubject(idx));
      this.subjectGrid.appendChild(card);
    });
  }

  renderQuestion() {
    const s = FIFTH_SUBJECTS[this.currentSubjectIdx];
    if (this.activeSubjectTag) this.activeSubjectTag.textContent = `${s.grade.toUpperCase()} ${s.topic.toUpperCase()} (${s.val})`;
    if (this.questionText) this.questionText.textContent = s.text;
    if (this.answerText) {
      this.answerText.textContent = this.revealedAnswer ? `Secret Answer: ${s.answer}` : `Secret Answer: [ Hidden ]`;
    }
  }

  broadcastState() {
    if (!this.broadcast) return;
    const s = FIFTH_SUBJECTS[this.currentSubjectIdx];
    const payload = {
      subjectIdx: this.currentSubjectIdx,
      grade: s.grade,
      topic: s.topic,
      val: s.val,
      text: s.text,
      answer: s.answer,
      revealedAnswer: this.revealedAnswer,
      classmate: this.classmate,
      clearedSubjects: Array.from(this.clearedSubjects),
      droppedOut: this.droppedOut
    };
    try {
      localStorage.setItem('fifthgrader_last_state', JSON.stringify(payload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_FIFTHGRADER_STATE', state: payload });
  }
}

let fifthApp = null;
window.addEventListener('DOMContentLoaded', () => {
  fifthApp = new FifthGraderController();
});
