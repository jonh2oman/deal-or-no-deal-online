/**
 * Wheel of Fortune Spectator View Receiver
 */

class WheelSpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('wheel_stage_broadcast');
    
    this.categoryDisplay = document.getElementById('category-display-tv');
    this.puzzleGridTv = document.getElementById('puzzle-grid-tv');

    this.p1NameTv = document.getElementById('p1-name-tv');
    this.p2NameTv = document.getElementById('p2-name-tv');
    this.p3NameTv = document.getElementById('p3-name-tv');

    this.p1ScoreTv = document.getElementById('p1-score-tv');
    this.p2ScoreTv = document.getElementById('p2-score-tv');
    this.p3ScoreTv = document.getElementById('p3-score-tv');

    this.podiums = [
      document.getElementById('podium-tv-0'),
      document.getElementById('podium-tv-1'),
      document.getElementById('podium-tv-2')
    ];

    this.init();
  }

  init() {
    this.broadcast.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'SYNC_WHEEL_STATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('wheel_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}
  }

  renderState(state) {
    if (!state) return;

    if (this.categoryDisplay) {
      this.categoryDisplay.textContent = `CATEGORY: ${state.category || 'PHRASE'}`;
    }

    if (this.p1NameTv) this.p1NameTv.textContent = state.p1Name || "CONTESTANT 1";
    if (this.p2NameTv) this.p2NameTv.textContent = state.p2Name || "CONTESTANT 2";
    if (this.p3NameTv) this.p3NameTv.textContent = state.p3Name || "CONTESTANT 3";

    if (this.p1ScoreTv) this.p1ScoreTv.textContent = `$${state.p1RoundScore || 0}`;
    if (this.p2ScoreTv) this.p2ScoreTv.textContent = `$${state.p2RoundScore || 0}`;
    if (this.p3ScoreTv) this.p3ScoreTv.textContent = `$${state.p3RoundScore || 0}`;

    this.podiums.forEach((pod, idx) => {
      if (pod) {
        if (idx === state.activeTurn) pod.classList.add('active-turn');
        else pod.classList.remove('active-turn');
      }
    });

    // Render Grid
    if (this.puzzleGridTv && state.phrase) {
      this.puzzleGridTv.innerHTML = '';
      const revealed = new Set(state.revealedLetters || []);

      const words = state.phrase.split(' ');
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
        rowDiv.className = 'puzzle-row-tv';
        const padded = rText.padStart(Math.floor((12 + rText.length) / 2)).padEnd(12);

        for (let char of padded) {
          const tile = document.createElement('div');
          tile.className = 'puzzle-tile-tv';
          if (char === ' ') {
            tile.classList.add('space-tile-tv');
          } else {
            tile.classList.add('letter-space');
            if (revealed.has(char)) {
              tile.classList.add('revealed');
              tile.textContent = char;
            } else {
              tile.classList.add('hidden-letter');
            }
          }
          rowDiv.appendChild(tile);
        }
        this.puzzleGridTv.appendChild(rowDiv);
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WheelSpectator();
});
