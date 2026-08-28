/**
 * Who Wants to Be a Millionaire Spectator View Receiver
 */

const MILLIONAIRE_QUESTIONS_TV = [
  "$100", "$200", "$300", "$500", "$1,000",
  "$2,000", "$4,000", "$8,000", "$16,000", "$32,000",
  "$64,000", "$125,000", "$250,000", "$500,000", "$1,000,000"
];

class MillionaireSpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('millionaire_stage_broadcast');
    
    this.questionBoxTv = document.getElementById('question-text-tv');
    this.moneyLadderTv = document.getElementById('money-ladder-tv');

    this.optATv = document.getElementById('opt-a-tv');
    this.optBTv = document.getElementById('opt-b-tv');
    this.optCTv = document.getElementById('opt-c-tv');
    this.optDTv = document.getElementById('opt-d-tv');

    this.init();
  }

  init() {
    this.broadcast.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'SYNC_MILLIONAIRE_STATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('millionaire_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}
  }

  renderState(state) {
    if (!state) return;

    if (this.questionBoxTv) {
      this.questionBoxTv.textContent = `Q${(state.step || 0) + 1} (${state.val}): ${state.text}`;
    }

    // Money Ladder TV
    if (this.moneyLadderTv) {
      this.moneyLadderTv.innerHTML = '';
      MILLIONAIRE_QUESTIONS_TV.forEach((v, idx) => {
        const step = document.createElement('div');
        step.className = `ladder-step-tv ${idx === 4 || idx === 9 || idx === 14 ? 'milestone' : ''} ${idx === state.step ? 'active' : ''}`;
        step.innerHTML = `<span>${idx + 1}</span><span>${v}</span>`;
        this.moneyLadderTv.appendChild(step);
      });
    }

    const hidden = new Set(state.hiddenOptions || []);
    const opts = [
      { key: 'A', btn: this.optATv, text: state.options ? state.options[0] : 'A: Option A' },
      { key: 'B', btn: this.optBTv, text: state.options ? state.options[1] : 'B: Option B' },
      { key: 'C', btn: this.optCTv, text: state.options ? state.options[2] : 'C: Option C' },
      { key: 'D', btn: this.optDTv, text: state.options ? state.options[3] : 'D: Option D' }
    ];

    opts.forEach(o => {
      if (!o.btn) return;
      o.btn.textContent = o.text;
      o.btn.className = 'opt-btn-tv';

      if (hidden.has(o.key)) {
        o.btn.classList.add('hidden-opt');
      }

      if (state.selectedOption === o.key) {
        o.btn.classList.add('selected');
      }

      if (state.revealedCorrect && state.answer === o.key) {
        o.btn.classList.add('correct');
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MillionaireSpectator();
});
