/**
 * Jeopardy Stage Engine - Host Control Machine
 */

const PRESET_JEOPARDY_BOARD = [
  {
    category: "POP CULTURE",
    clues: [
      { val: 200, text: "This streaming platform produced 'Stranger Things' and 'Squid Game'", answer: "What is Netflix?", revealed: false },
      { val: 400, text: "This pop star released the record-breaking 'Eras Tour'", answer: "Who is Taylor Swift?", revealed: false },
      { val: 600, text: "This superhero film became the highest-grossing movie of 2019", answer: "What is Avengers: Endgame?", revealed: false },
      { val: 800, text: "This artist painted the famous artwork 'Starry Night'", answer: "Who is Vincent van Gogh?", revealed: false },
      { val: 1000, text: "This sci-fi franchise features the phrase 'May the Force be with you'", answer: "What is Star Wars?", revealed: false }
    ]
  },
  {
    category: "GEOGRAPHY",
    clues: [
      { val: 200, text: "This is the capital city of France", answer: "What is Paris?", revealed: false },
      { val: 400, text: "This island province is Canada's easternmost province", answer: "What is Newfoundland and Labrador?", revealed: false },
      { val: 600, text: "This river is the longest in South America", answer: "What is the Amazon River?", revealed: false },
      { val: 800, text: "This African country has Cairo as its capital city", answer: "What is Egypt?", revealed: false },
      { val: 1000, text: "This mountain peak is the highest point above sea level on Earth", answer: "What is Mount Everest?", revealed: false }
    ]
  },
  {
    category: "SCIENCE & TECH",
    clues: [
      { val: 200, text: "This chemical element has the symbol 'O'", answer: "What is Oxygen?", revealed: false },
      { val: 400, text: "This planet is known as the 'Red Planet'", answer: "What is Mars?", revealed: false },
      { val: 600, text: "This device converts light into electric current using solar energy", answer: "What is a solar panel?", revealed: false },
      { val: 800, text: "This force keeps planets orbiting around the Sun", answer: "What is gravity?", revealed: false },
      { val: 1000, text: "This component is often referred to as the 'brain' of a computer", answer: "What is the CPU?", revealed: false }
    ]
  },
  {
    category: "MOVIES & TV",
    clues: [
      { val: 200, text: "This green ogre lives in a swamp alongside his friend Donkey", answer: "Who is Shrek?", revealed: false },
      { val: 400, text: "This 1997 James Cameron film starred Leonardo DiCaprio and Kate Winslet", answer: "What is Titanic?", revealed: false },
      { val: 600, text: "This animated movie features the hit song 'Let It Go'", answer: "What is Frozen?", revealed: false },
      { val: 800, text: "This actor played Tony Stark / Iron Man in the Marvel Cinematic Universe", answer: "Who is Robert Downey Jr.?", revealed: false },
      { val: 1000, text: "This TV comedy set in Dunder Mifflin featured Michael Scott", answer: "What is The Office?", revealed: false }
    ]
  },
  {
    category: "FOOD & DRINK",
    clues: [
      { val: 200, text: "This Italian dish consists of dough topped with tomato sauce and cheese", answer: "What is pizza?", revealed: false },
      { val: 400, text: "This popular hot beverage is made from roasted coffee beans", answer: "What is coffee?", revealed: false },
      { val: 600, text: "This Mexican dip is made primarily from mashed avocados", answer: "What is guacamole?", revealed: false },
      { val: 800, text: "This sweet treat is made from cocoa beans", answer: "What is chocolate?", revealed: false },
      { val: 1000, text: "This Japanese dish features vinegared rice combined with seafood or vegetables", answer: "What is sushi?", revealed: false }
    ]
  },
  {
    category: "HISTORY",
    clues: [
      { val: 200, text: "This first President of the United States is featured on the $1 bill", answer: "Who is George Washington?", revealed: false },
      { val: 400, text: "This ancient civilization built the Great Pyramids at Giza", answer: "Who are the Ancient Egyptians?", revealed: false },
      { val: 600, text: "This year marked the end of World War II", answer: "What is 1945?", revealed: false },
      { val: 800, text: "This ocean liner sank on its maiden voyage in 1912 after hitting an iceberg", answer: "What is the Titanic?", revealed: false },
      { val: 1000, text: "This wall separated East and West Berlin from 1961 to 1989", answer: "What is the Berlin Wall?", revealed: false }
    ]
  }
];

const DEFAULT_BRANDING = {
  eventTitle: "JEOPARDY!",
  eventSubtitle: "LIVE STAGE SHOWDOWN",
  eventTag: "JEOP-15",
  showEventTag: true,
  defaultTheme: "runway-blue"
};

class JeopardyController {
  constructor() {
    this.board = JSON.parse(JSON.stringify(PRESET_JEOPARDY_BOARD));
    this.p1Name = "CONTESTANT 1";
    this.p2Name = "CONTESTANT 2";
    this.p3Name = "CONTESTANT 3";
    this.p1Score = 0;
    this.p2Score = 0;
    this.p3Score = 0;
    this.activeClue = null; // { catIdx, clueIdx, text, answer, val, dailyDouble }
    this.theme = "runway-blue";
    this.branding = this.loadBranding();

    this.broadcast = new BroadcastChannel('jeopardy_stage_broadcast');
    this.broadcast.onmessage = (e) => {
      if (e.data && e.data.type === 'REQUEST_STATE') {
        this.broadcastState();
      }
    };

    sounds.muted = true;
    this.initDOM();
    this.bindEvents();
    this.applyBranding();
    this.renderBoard();

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.initHost(
        (buzzData) => this.handleMobileBuzz(buzzData),
        (voteData) => {}
      );
      mobilePeerManager.onFinalSubmitCallback = (finalData) => this.handleFinalSubmit(finalData);
      mobilePeerManager.setGameInfo("JEOPARDY!", [this.p1Name, this.p2Name, this.p3Name]);
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
    if (this.elements.brandEventTitle) this.elements.brandEventTitle.textContent = b.eventTitle || "JEOPARDY!";
    if (this.elements.brandEventSubtitle) this.elements.brandEventSubtitle.textContent = b.eventSubtitle || "LIVE STAGE SHOWDOWN";
    if (this.elements.brandTagCode) this.elements.brandTagCode.textContent = b.eventTag || "JEOP-15";
    
    const badge = document.querySelector('.flight-badge');
    if (badge) {
      if (b.showEventTag === false) badge.classList.add('hidden');
      else badge.classList.remove('hidden');
    }

    document.title = `${b.eventTitle || "Jeopardy!"} - Host Control`;
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
      qrBtn: document.getElementById('qr-btn'),
      spectatorBtn: document.getElementById('spectator-btn'),
      soundBtn: document.getElementById('sound-btn'),
      soundIcon: document.getElementById('sound-icon'),
      soundText: document.getElementById('sound-text'),
      adminBtn: document.getElementById('admin-btn'),
      resetBtn: document.getElementById('reset-btn'),

      p1NameInput: document.getElementById('p1-name'),
      p2NameInput: document.getElementById('p2-name'),
      p3NameInput: document.getElementById('p3-name'),
      p1ScoreDisplay: document.getElementById('p1-score'),
      p2ScoreDisplay: document.getElementById('p2-score'),
      p3ScoreDisplay: document.getElementById('p3-score'),

      teleprompterClue: document.getElementById('teleprompter-clue'),
      teleprompterAnswer: document.getElementById('teleprompter-answer'),
      activeClueValueTag: document.getElementById('active-clue-value-tag'),
      dailyDoubleBtn: document.getElementById('daily-double-btn'),

      jeopardyBoardGrid: document.getElementById('jeopardy-board-grid'),

      adminModal: document.getElementById('admin-modal'),
      closeAdminBtn: document.getElementById('close-admin-btn'),
      savePrizesBtn: document.getElementById('save-prizes-btn'),
      settingEventTitle: document.getElementById('setting-event-title'),
      settingEventSubtitle: document.getElementById('setting-event-subtitle'),
      settingEventTag: document.getElementById('setting-event-tag'),
      settingTheme: document.getElementById('setting-theme')
    };

    this.soundFxBtns = document.querySelectorAll('.sound-fx-btn');
    this.finalJeopardyBtn = document.getElementById('final-jeopardy-btn');
    this.closeClueBtn = document.getElementById('close-clue-btn');
  }

  bindEvents() {
    this.elements.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));

    if (this.finalJeopardyBtn) this.finalJeopardyBtn.addEventListener('click', () => this.triggerFinalJeopardyMode());

    if (this.closeClueBtn) {
      this.closeClueBtn.addEventListener('click', () => {
        if (this.state) this.state.activeClue = null;
        this.activeClue = null;
        if (this.elements.activeClueValueTag) this.elements.activeClueValueTag.textContent = 'SELECT A CLUE FROM THE BOARD';
        if (this.elements.teleprompterClue) this.elements.teleprompterClue.textContent = 'Select any category dollar value ($200 - $1000) below to activate clue.';
        if (this.elements.teleprompterAnswer) this.elements.teleprompterAnswer.textContent = 'Secret Answer: ---';
        this.broadcastState();
      });
    }

    // CSV Import / Export
    const importCsvBtn = document.getElementById('import-csv-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const csvFileInput = document.getElementById('csv-file-input');

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.downloadCsvTemplate();
      });
    }

    if (importCsvBtn && csvFileInput) {
      importCsvBtn.addEventListener('click', () => {
        sounds.playSelect();
        csvFileInput.click();
      });

      csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.parseCsvAndLoadBoard(evt.target.result);
        };
        reader.readAsText(file);
      });
    }

    this.elements.spectatorBtn.addEventListener('click', () => {
      window.open('jeopardy-spectator.html', 'JeopardySpectatorWindow', 'width=1280,height=720');
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

    this.elements.p1NameInput.addEventListener('input', (e) => {
      this.p1Name = e.target.value.toUpperCase() || "CONTESTANT 1";
      this.broadcastState();
    });

    this.elements.p2NameInput.addEventListener('input', (e) => {
      this.p2Name = e.target.value.toUpperCase() || "CONTESTANT 2";
      this.broadcastState();
    });

    this.elements.p3NameInput.addEventListener('input', (e) => {
      this.p3Name = e.target.value.toUpperCase() || "CONTESTANT 3";
      this.broadcastState();
    });

    this.elements.dailyDoubleBtn.addEventListener('click', () => {
      sounds.playDailyDouble();
      this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'daily' });
      if (this.activeClue) {
        this.activeClue.dailyDouble = true;
        this.broadcastState();
      }
    });

    // QR Modal
    const qrModal = document.getElementById('qr-modal');
    const closeQrBtn = document.getElementById('close-qr-btn');
    const resetBuzzersBtn = document.getElementById('reset-buzzers-btn');

    if (this.elements.qrBtn && qrModal) {
      this.elements.qrBtn.addEventListener('click', () => {
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
          if (snd === 'chime') sounds.playChime();
          else if (snd === 'daily') sounds.playDailyDouble();
          else if (snd === 'buzzer') sounds.playBuzzer();
          else if (snd === 'win') sounds.playFanfare();
          else if (snd === 'theme') sounds.playTheme();
          else if (snd === 'stop') sounds.stopAll();
          this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: snd });
        });
      });
    }

    // Modal
    this.elements.adminBtn.addEventListener('click', () => {
      this.elements.settingEventTitle.value = this.branding.eventTitle || "";
      this.elements.settingEventSubtitle.value = this.branding.eventSubtitle || "";
      this.elements.settingEventTag.value = this.branding.eventTag || "";
      this.elements.settingTheme.value = this.branding.defaultTheme || this.theme;
      this.elements.adminModal.classList.remove('hidden');
    });

    this.elements.closeAdminBtn.addEventListener('click', () => this.elements.adminModal.classList.add('hidden'));

    this.elements.savePrizesBtn.addEventListener('click', () => {
      const b = this.branding;
      b.eventTitle = this.elements.settingEventTitle.value.trim() || "JEOPARDY!";
      b.eventSubtitle = this.elements.settingEventSubtitle.value.trim() || "LIVE STAGE SHOWDOWN";
      b.eventTag = this.elements.settingEventTag.value.trim() || "JEOP-15";
      b.defaultTheme = this.elements.settingTheme.value;
      this.saveBranding(b);
      this.setTheme(b.defaultTheme);
      this.elements.adminModal.classList.add('hidden');
    });

    this.elements.resetBtn.addEventListener('click', () => {
      this.p1Score = 0;
      this.p2Score = 0;
      this.p3Score = 0;
      this.activeClue = null;
      this.board = JSON.parse(JSON.stringify(PRESET_JEOPARDY_BOARD));
      this.renderBoard();
      this.renderScores();
      this.broadcastState();
    });
  }

  handleMobileBuzz(buzzData) {
    sounds.playBuzzer();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'buzzer' });
    this.elements.teleprompterClue.textContent = `⚡ ${buzzData.teamName} BUZZED IN! (${buzzData.reactionTime}s)`;
  }

  renderBoard() {
    let html = '';
    // 6 Category Headers
    this.board.forEach(cat => {
      html += `<div class="category-header-cell">${cat.category}</div>`;
    });

    // 5 Rows of Clues ($200 to $1000)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        const clue = this.board[c].clues[r];
        html += `
          <button class="clue-cell-btn ${clue.revealed ? 'revealed' : ''}" onclick="jeopApp.selectClue(${c}, ${r})">
            ${clue.revealed ? '---' : '$' + clue.val}
          </button>
        `;
      }
    }

    this.elements.jeopardyBoardGrid.innerHTML = html;
  }

  selectClue(catIdx, clueIdx) {
    const clue = this.board[catIdx].clues[clueIdx];
    clue.revealed = true;

    this.activeClue = {
      catIdx,
      clueIdx,
      category: this.board[catIdx].category,
      val: clue.val,
      text: clue.text,
      answer: clue.answer
    };

    sounds.playChime();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'chime' });

    this.elements.activeClueValueTag.textContent = `${this.activeClue.category} - $${clue.val}`;
    this.elements.teleprompterClue.textContent = clue.text;
    this.elements.teleprompterAnswer.textContent = `Secret Answer: ${clue.answer}`;

    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.resetBuzzers();
    }

    this.renderBoard();
    this.broadcastState();
  }

  awardPoints(pIdx) {
    const val = this.activeClue ? this.activeClue.val : 200;
    if (pIdx === 0) this.p1Score += val;
    else if (pIdx === 1) this.p2Score += val;
    else if (pIdx === 2) this.p3Score += val;

    sounds.playDeal();
    this.renderScores();
    this.broadcastState();
  }

  deductPoints(pIdx) {
    const val = this.activeClue ? this.activeClue.val : 200;
    if (pIdx === 0) this.p1Score -= val;
    else if (pIdx === 1) this.p2Score -= val;
    else if (pIdx === 2) this.p3Score -= val;

    sounds.playBuzzer();
    this.renderScores();
    this.broadcastState();
  }

  renderScores() {
    this.elements.p1ScoreDisplay.textContent = `$${this.p1Score}`;
    this.elements.p2ScoreDisplay.textContent = `$${this.p2Score}`;
    this.elements.p3ScoreDisplay.textContent = `$${this.p3Score}`;
  }

  broadcastState() {
    if (!this.broadcast) return;
    const statePayload = {
      branding: this.branding,
      theme: this.theme,
      p1Name: this.p1Name,
      p2Name: this.p2Name,
      p3Name: this.p3Name,
      p1Score: this.p1Score,
      p2Score: this.p2Score,
      p3Score: this.p3Score,
      activeClue: this.activeClue,
      board: this.board
    };
    try {
      localStorage.setItem('jeopardy_last_state', JSON.stringify(statePayload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_JEOPARDY_STATE', state: statePayload });
  }

  downloadCsvTemplate() {
    let csv = "Category,Value,Clue,Answer\n";
    this.board.forEach(cat => {
      cat.clues.forEach(c => {
        const catEsc = `"${cat.category.replace(/"/g, '""')}"`;
        const clueEsc = `"${c.text.replace(/"/g, '""')}"`;
        const ansEsc = `"${c.answer.replace(/"/g, '""')}"`;
        csv += `${catEsc},${c.val},${clueEsc},${ansEsc}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'jeopardy_board_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  parseCsvAndLoadBoard(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return;

    if (lines[0].toUpperCase().includes('CATEGORY')) {
      lines.shift();
    }

    const newBoardMap = {};

    lines.forEach(line => {
      const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
      const cols = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        cols.push((match[1] !== undefined ? match[1] : match[2]).trim());
      }

      if (cols.length >= 4) {
        const category = cols[0].toUpperCase();
        const val = parseInt(cols[1], 10) || 200;
        const text = cols[2];
        const answer = cols[3];

        if (!newBoardMap[category]) newBoardMap[category] = [];
        newBoardMap[category].push({ val, text, answer, revealed: false });
      }
    });

    const allCategories = Object.keys(newBoardMap);
    if (allCategories.length > 6) {
      alert(`Warning: Your CSV has ${allCategories.length} categories. Only the first 6 will be loaded.`);
    }

    const categories = allCategories.slice(0, 6);
    if (categories.length === 0) {
      alert("Could not parse valid categories from CSV. Please check formatting.");
      return;
    }

    const newBoard = categories.map(catName => {
      const clues = newBoardMap[catName];
      if (clues.length > 5) {
        console.warn('Extra clues truncated for category: ' + catName);
      }
      return {
        category: catName,
        clues: clues.slice(0, 5)
      };
    });

    this.board = newBoard;
    this.renderBoard();
    this.broadcastState();
    alert(`Successfully loaded ${categories.length} Jeopardy Categories from CSV!`);
  }

  handleFinalSubmit(finalData) {
    sounds.playSelect();
    if (this.elements.teleprompterClue) {
      this.elements.teleprompterClue.textContent = `👑 ${finalData.teamName} SUBMITTED WAGER: $${finalData.wager} | ANSWER: "${finalData.answer}"`;
    }
  }

  triggerFinalJeopardyMode() {
    sounds.playTheme();
    if (typeof mobilePeerManager !== 'undefined') {
      mobilePeerManager.setMode('FINAL_JEOPARDY');
    }
    this.activeClue = {
      category: "FINAL JEOPARDY",
      val: "FINAL",
      text: "THIS FAMOUS CANADIAN MONUMENT IS LOCATED IN NEWFOUNDLAND",
      answer: "What is Signal Hill / Cape Spear?"
    };
    this.elements.teleprompterClue.textContent = `👑 FINAL JEOPARDY MODE ACTIVE - Mobile Wagers Open!`;
    this.broadcastState();
  }
}

let jeopApp = null;
window.addEventListener('DOMContentLoaded', () => {
  jeopApp = new JeopardyController();
});
