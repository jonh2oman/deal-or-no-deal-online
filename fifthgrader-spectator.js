/**
 * Are You Smarter Than a 5th Grader? Spectator View Receiver
 */

const FIFTH_SUBJECTS_TV = [
  { grade: "1st Grade", topic: "Animal Science", val: "$1,000" },
  { grade: "1st Grade", topic: "Reading", val: "$2,000" },
  { grade: "2nd Grade", topic: "US History", val: "$5,000" },
  { grade: "2nd Grade", topic: "Astronomy", val: "$10,000" },
  { grade: "3rd Grade", topic: "Earth Science", val: "$25,000" },
  { grade: "3rd Grade", topic: "Math", val: "$50,000" },
  { grade: "4th Grade", topic: "Geography", val: "$100,000" },
  { grade: "4th Grade", topic: "Grammar", val: "$175,000" },
  { grade: "5th Grade", topic: "World History", val: "$300,000" },
  { grade: "5th Grade", topic: "1 MILLION QUESTION", val: "$1,000,000" }
];

class FifthSpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('fifthgrader_stage_broadcast');
    
    this.subjectGridTv = document.getElementById('subject-grid-tv');
    this.activeSubjectTv = document.getElementById('active-subject-tv');
    this.questionTextTv = document.getElementById('question-text-tv');
    this.classmateTv = document.getElementById('classmate-tv');
    this.answerTextTv = document.getElementById('answer-text-tv');

    this.init();
  }

  init() {
    this.broadcast.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'SYNC_FIFTHGRADER_STATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('fifthgrader_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}
  }

  renderState(state) {
    if (!state) return;

    if (this.activeSubjectTv) {
      this.activeSubjectTv.textContent = `${(state.grade || '').toUpperCase()} ${state.topic || ''} (${state.val || ''})`;
    }

    if (this.questionTextTv) this.questionTextTv.textContent = state.text || "";
    if (this.classmateTv) this.classmateTv.textContent = state.classmate || "ALEX";

    if (this.answerTextTv) {
      this.answerTextTv.textContent = state.revealedAnswer ? state.answer : "";
    }

    // Grid TV
    if (this.subjectGridTv) {
      this.subjectGridTv.innerHTML = '';
      const cleared = new Set(state.clearedSubjects || []);

      FIFTH_SUBJECTS_TV.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = `grade-subject-tv ${idx === state.subjectIdx ? 'active' : ''} ${cleared.has(idx) ? 'cleared' : ''}`;
        card.innerHTML = `<span>${s.grade}: ${s.topic}</span><span>${s.val}</span>`;
        this.subjectGridTv.appendChild(card);
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new FifthSpectator();
});
