/**
 * Gander Festival of Flight - Deal or No Deal
 * Application Controller & Game Loop
 */

const DEFAULT_GANDER_PRIZES = [
  { id: 1, name: "$0.25", numValue: 0.25 },
  { id: 2, name: "$1 Mystery Gift", numValue: 1.00 },
  { id: 3, name: "$2 Mystery Gift", numValue: 2.00 },
  { id: 4, name: "$3 Mystery Gift", numValue: 3.00 },
  { id: 5, name: "$4 Mystery Gift", numValue: 4.00 },
  { id: 6, name: "$5 Mystery Gift", numValue: 5.00 },
  { id: 7, name: "$6 Mystery Gift", numValue: 6.00 },
  { id: 8, name: "$7 Mystery Gift", numValue: 7.00 },
  { id: 9, name: "$8 Gift Card", numValue: 8.00 },
  { id: 10, name: "$10 Gift Card", numValue: 10.00 },
  { id: 11, name: "$15 Gift Card", numValue: 15.00 },
  { id: 12, name: "$20 Gift Card", numValue: 20.00 },
  { id: 13, name: "$30 Gift Card", numValue: 30.00 },
  { id: 14, name: "$40 Gift Card", numValue: 40.00 },
  { id: 15, name: "Grand Prize: $50 Festival Flight Prize", numValue: 50.00 }
];

// Elimination targets per round
const ROUND_TARGETS = [4, 3, 2, 1, 1]; // Round 1: 4, Round 2: 3, Round 3: 2, Round 4: 1, Round 5: 1

const HOST_BANTER = {
  START: [
    `"Welcome to Deal or No Deal! Keep your fingers crossed and choose your case wisely."`,
    `"Pick your personal briefcase! Is it fortune, fame, or a $0.25 prize inside? Let's find out!"`,
    `"Choose carefully! No pressure, but the entire audience is counting on you!"`,
    `"Select your lucky case! Trust your instincts!"`
  ],
  LOW_REVEAL: [
    `"BOOM! A low prize is outta here! Great job eliminating that small value!"`,
    `"Adios tiny prize! The Banker is starting to sweat now!"`,
    `"Another low value down! Clear skies ahead for a big win!"`,
    `"Small prize eliminated! The audience is loving this strategy!"`,
    `"Scratch another small value off the board! We are flying high now!"`
  ],
  HIGH_REVEAL: [
    `"Ouch! That high prize just went up in smoke! Take a deep breath..."`,
    `"Big prize eliminated! Stay calm and keep focused."`,
    `"Oof! Look confident and pretend that was all part of your master strategy!"`,
    `"A high value is gone, but stay calm—there are still big prizes on the board!"`
  ],
  BANKER_CALL: [
    `"Ring ring! The Banker is on the line with an offer!"`,
    `"Incoming offer from the Banker! Hold your breath, folks!"`,
    `"The Banker is calling! Ask the crowd: Should we take the deal or keep playing?"`,
    `"The Banker is transmitting an offer! Will it be sky-high?"`
  ],
  DEAL_ACCEPTED: [
    `"DEAL ACCEPTED! Congratulations to our contestant!"`,
    `"Smart play! Cash locked in! Give a massive hand for our winner!"`
  ],
  NO_DECLINED: [
    `"NO DEAL! Our contestant has nerves of steel! Onward to the next round!"`,
    `"Refused! The Banker is pulling his hair out while we keep playing!"`
  ]
};

const DEFAULT_BRANDING = {
  eventTitle: "DEAL OR NO DEAL",
  eventSubtitle: "LIVE STAGE GAME SHOW",
  eventTag: "DND-15",
  bankerName: "BANKER"
};

class GameController {
  constructor() {
    this.prizes = this.loadPrizes();
    this.branding = this.loadBranding();
    this.cases = []; // Array of { number: 1..15, prize: PrizeObj, opened: bool }
    this.playerCaseNumber = null;
    this.currentRoundIndex = 0; // 0..4 for regular rounds
    this.casesToOpenThisRound = 0;
    this.casesOpenedThisRound = 0;
    this.gameState = 'SETUP'; // 'SELECT_CASE', 'ELIMINATING', 'BANKER_OFFER', 'FINAL_SWAP', 'GAME_OVER'
    this.currentOffer = null;
    this.dealAccepted = false;
    this.acceptedOfferValue = null;
    this.swapData = null;
    this.resultData = null;

    this.broadcast = new BroadcastChannel('gander_deal_broadcast');
    this.broadcast.onmessage = (e) => {
      if (e.data && e.data.type === 'REQUEST_STATE') {
        this.broadcastState();
      }
    };

    // Mute Host laptop audio by default so sound ONLY plays on the Casted Spectator TV window!
    sounds.muted = true;

    this.initDOM();
    this.bindEvents();
    this.resetGame();

    // Set default sound button state to PA Audio Only
    if (this.elements.soundIcon && this.elements.soundText) {
      this.elements.soundIcon.textContent = '📺';
      this.elements.soundText.textContent = 'Spectator PA Audio Only (Host Muted)';
    }
  }

  // Load custom prizes from localStorage or default
  loadPrizes() {
    try {
      const saved = localStorage.getItem('gander_festival_prizes_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 15) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load saved prizes, using defaults.", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_GANDER_PRIZES));
  }

  savePrizes(newPrizes) {
    this.prizes = newPrizes;
    try {
      localStorage.setItem('gander_festival_prizes_v3', JSON.stringify(newPrizes));
    } catch (e) {
      console.warn("Could not save prizes to localStorage.", e);
    }
  }

  loadBranding() {
    try {
      const saved = localStorage.getItem('gander_deal_branding');
      if (saved) {
        return Object.assign({}, DEFAULT_BRANDING, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load branding settings, using defaults.", e);
    }
    return Object.assign({}, DEFAULT_BRANDING);
  }

  saveBranding(updatedBranding) {
    this.branding = updatedBranding;
    try {
      localStorage.setItem('gander_deal_branding', JSON.stringify(updatedBranding));
    } catch (e) {
      console.warn("Could not save branding settings.", e);
    }
    this.applyBranding();
    this.broadcastState();
  }

  applyBranding() {
    if (!this.branding) return;
    const b = this.branding;
    if (this.elements.brandEventTitle) this.elements.brandEventTitle.textContent = b.eventTitle || "DEAL OR NO DEAL";
    if (this.elements.brandEventSubtitle) this.elements.brandEventSubtitle.textContent = b.eventSubtitle || "LIVE STAGE GAME SHOW";
    if (this.elements.brandTagCode) this.elements.brandTagCode.textContent = b.eventTag || "DND-15";
    document.title = `${b.eventTitle || "Deal or No Deal"} - Host Control`;
  }

  initDOM() {
    this.elements = {
      brandEventTitle: document.getElementById('brand-event-title'),
      brandEventSubtitle: document.getElementById('brand-event-subtitle'),
      brandTagCode: document.getElementById('brand-tag-code'),
      lowPrizesList: document.getElementById('low-prizes-list'),
      highPrizesList: document.getElementById('high-prizes-list'),
      briefcaseGrid: document.getElementById('briefcase-grid'),
      statusHeading: document.getElementById('status-heading'),
      statusSubtext: document.getElementById('status-subtext'),
      hostBanterQuote: document.getElementById('host-banter-quote'),
      playerCaseSlot: document.getElementById('player-case-slot'),
      roundIndicator: document.getElementById('round-indicator'),

      // Settings Navigation Tabs & Form Fields
      tabBrandingBtn: document.getElementById('tab-branding-btn'),
      tabPrizesBtn: document.getElementById('tab-prizes-btn'),
      sectionBranding: document.getElementById('section-branding'),
      sectionPrizes: document.getElementById('section-prizes'),
      settingEventTitle: document.getElementById('setting-event-title'),
      settingEventSubtitle: document.getElementById('setting-event-subtitle'),
      settingEventTag: document.getElementById('setting-event-tag'),
      settingBankerName: document.getElementById('setting-banker-name'),

      // Modals
      caseRevealModal: document.getElementById('case-reveal-modal'),
      revealCaseTitle: document.getElementById('reveal-case-title'),
      revealPrizeValue: document.getElementById('reveal-prize-value'),
      revealStatusNote: document.getElementById('reveal-status-note'),
      revealPrizeBox: document.getElementById('reveal-prize-box'),
      continueRevealBtn: document.getElementById('continue-reveal-btn'),
      continueBtnText: document.getElementById('continue-btn-text'),

      adminModal: document.getElementById('admin-modal'),
      adminBtn: document.getElementById('admin-btn'),
      closeAdminBtn: document.getElementById('close-admin-btn'),
      prizeForm: document.getElementById('prize-form'),
      resetDefaultPrizesBtn: document.getElementById('reset-default-prizes-btn'),
      savePrizesBtn: document.getElementById('save-prizes-btn'),

      bankerModal: document.getElementById('banker-modal'),
      offerTypeBadge: document.getElementById('offer-type-badge'),
      bankerTitleHeading: document.getElementById('banker-title-heading'),
      offerLabelHeading: document.getElementById('offer-label-heading'),
      bankerOfferCard: document.getElementById('banker-offer-card'),
      bankerOfferDisplay: document.getElementById('banker-offer-display'),
      bankerPhysicalDisplay: document.getElementById('banker-physical-display'),
      bankerEvMeta: document.getElementById('banker-ev-meta'),
      dealBtn: document.getElementById('deal-btn'),
      noDealBtn: document.getElementById('no-deal-btn'),

      tabSuggestedBtn: document.getElementById('tab-suggested-btn'),
      tabCustomBtn: document.getElementById('tab-custom-btn'),
      customOfferBox: document.getElementById('custom-offer-box'),
      customOfferAmount: document.getElementById('custom-offer-amount'),
      customOfferPrize: document.getElementById('custom-offer-prize'),
      applyCustomOfferBtn: document.getElementById('apply-custom-offer-btn'),

      broadcastOfferBtn: document.getElementById('broadcast-offer-btn'),
      broadcastLiveTag: document.getElementById('broadcast-live-tag'),

      swapModal: document.getElementById('swap-modal'),
      swapPlayerCaseNum: document.getElementById('swap-player-case-num'),
      swapOtherCaseNum: document.getElementById('swap-other-case-num'),
      keepCaseBtn: document.getElementById('keep-case-btn'),
      swapCaseBtn: document.getElementById('swap-case-btn'),

      resultModal: document.getElementById('result-modal'),
      resultIcon: document.getElementById('result-icon'),
      resultTitle: document.getElementById('result-title'),
      resultSubtitle: document.getElementById('result-subtitle'),
      resultPrizeValue: document.getElementById('result-prize-value'),
      resultCaseInfo: document.getElementById('result-case-info'),
      playAgainBtn: document.getElementById('play-again-btn'),

      soundBtn: document.getElementById('sound-btn'),
      soundIcon: document.getElementById('sound-icon'),
      soundText: document.getElementById('sound-text'),
      peekToggleBtn: document.getElementById('peek-toggle-btn'),
      peekText: document.getElementById('peek-text'),
      peekIcon: document.getElementById('peek-icon'),
      themeSelect: document.getElementById('theme-select'),
      ambientSelect: document.getElementById('ambient-select'),
      spectatorBtn: document.getElementById('spectator-btn'),
      resetBtn: document.getElementById('reset-btn')
    };

    this.soundFxBtns = document.querySelectorAll('.sound-fx-btn');
  }

  setTheme(themeName) {
    this.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);
    this.broadcastState();
  }

  setAmbient(ambientType) {
    this.ambient = ambientType;
    sounds.startAmbient(ambientType);
    if (this.broadcast) {
      this.broadcast.postMessage({ type: 'SET_AMBIENT', ambient: ambientType });
    }
  }

  bindEvents() {
    // Settings Nav Tabs (Branding vs Prizes)
    if (this.elements.tabBrandingBtn && this.elements.tabPrizesBtn) {
      this.elements.tabBrandingBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.elements.tabBrandingBtn.classList.add('active');
        this.elements.tabPrizesBtn.classList.remove('active');
        this.elements.sectionBranding.classList.remove('hidden');
        this.elements.sectionPrizes.classList.add('hidden');
      });

      this.elements.tabPrizesBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.elements.tabPrizesBtn.classList.add('active');
        this.elements.tabBrandingBtn.classList.remove('active');
        this.elements.sectionPrizes.classList.remove('hidden');
        this.elements.sectionBranding.classList.add('hidden');
      });
    }

    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener('change', (e) => {
        sounds.playSelect();
        this.setTheme(e.target.value);
      });
    }

    if (this.elements.ambientSelect) {
      this.elements.ambientSelect.addEventListener('change', (e) => {
        sounds.playSelect();
        this.setAmbient(e.target.value);
      });
    }

    // Host X-Ray Peek Mode Toggle
    if (this.elements.peekToggleBtn) {
      this.elements.peekToggleBtn.addEventListener('click', () => {
        sounds.playSelect();
        this.hostPeekMode = !this.hostPeekMode;
        if (this.hostPeekMode) {
          this.elements.peekToggleBtn.classList.add('peek-active');
          this.elements.peekText.textContent = 'Host Peek ON 👁️';
        } else {
          this.elements.peekToggleBtn.classList.remove('peek-active');
          this.elements.peekText.textContent = 'Host Peek OFF';
        }
        this.renderBriefcases();
      });
    }
    // Soundboard Console buttons
    if (this.soundFxBtns) {
      this.soundFxBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const sound = btn.dataset.sound;
          if (sound === 'stop') {
            sounds.stopAll();
            if (this.broadcast) this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'stopRing' });
          } else {
            if (sound === 'open') sounds.playOpen();
            else if (sound === 'ring') sounds.startRing();
            else if (sound === 'banker') sounds.playBanker();
            else if (sound === 'deal') sounds.playDeal();
            else if (sound === 'noDeal') sounds.playNoDeal();
            else if (sound === 'win') sounds.playFanfare();
            else if (sound === 'theme') sounds.playTheme();

            if (this.broadcast) this.broadcast.postMessage({ type: 'PLAY_SOUND', sound });
          }
        });
      });
    }

    // Push Offer to Spectator Screen
    this.elements.broadcastOfferBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.offerBroadcasted = true;
      this.elements.broadcastOfferBtn.classList.add('hidden');
      this.elements.broadcastLiveTag.classList.remove('hidden');

      sounds.playBanker();
      if (this.broadcast) this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'banker' });
      this.broadcastState();
    });
    // Reveal Continue button
    this.elements.continueRevealBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.elements.caseRevealModal.classList.add('hidden');
      this.revealData = null;
      this.broadcastState();

      if (this.pendingNextStep === 'BANKER_OFFER') {
        this.pendingNextStep = null;
        this.triggerBankerOffer();
      }
    });

    // Offer Tabs (Suggested vs Custom Host Offer)
    this.elements.tabSuggestedBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.elements.tabSuggestedBtn.classList.add('active');
      this.elements.tabCustomBtn.classList.remove('active');
      this.elements.customOfferBox.classList.add('hidden');

      if (this.suggestedOffer) {
        this.currentOffer = Object.assign({}, this.suggestedOffer);
        this.renderActiveOfferUI();
      }
    });

    this.elements.tabCustomBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.elements.tabCustomBtn.classList.add('active');
      this.elements.tabSuggestedBtn.classList.remove('active');
      this.elements.customOfferBox.classList.remove('hidden');

      if (this.suggestedOffer && !this.elements.customOfferAmount.value) {
        this.elements.customOfferAmount.value = this.suggestedOffer.offerAmount;
      }
    });

    this.elements.applyCustomOfferBtn.addEventListener('click', () => {
      sounds.playSelect();
      const customVal = parseFloat(this.elements.customOfferAmount.value) || 0;
      const customPrize = this.elements.customOfferPrize.value.trim();

      let formatted = "";
      if (Number.isInteger(customVal)) {
        formatted = "$" + customVal.toLocaleString('en-US');
      } else {
        formatted = "$" + customVal.toFixed(2);
      }

      this.currentOffer = {
        isCustom: true,
        offerAmount: customVal,
        formattedOffer: formatted,
        physicalPrize: customPrize,
        ev: this.suggestedOffer ? this.suggestedOffer.ev : 0
      };

      this.renderActiveOfferUI();
    });
    // Toolbar controls
    this.elements.soundBtn.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      this.elements.soundIcon.textContent = isMuted ? '📺' : '🔊';
      this.elements.soundText.textContent = isMuted ? 'Spectator PA Audio Only (Host Muted)' : 'Host Laptop Audio ON';
    });

    this.elements.spectatorBtn.addEventListener('click', () => {
      sounds.playSelect();
      window.open('spectator.html', 'GanderFestivalSpectator', 'width=1400,height=900,menubar=no,toolbar=no,location=no');
      setTimeout(() => this.broadcastState(), 400);
    });

    this.elements.resetBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.resetGame();
    });

    // Admin modal
    this.elements.adminBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.openAdminModal();
    });

    this.elements.closeAdminBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.closeAdminModal();
    });

    this.elements.resetDefaultPrizesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playSelect();
      this.savePrizes(JSON.parse(JSON.stringify(DEFAULT_GANDER_PRIZES)));
      this.populateAdminForm();
      this.renderPrizeBoards();
    });

    this.elements.savePrizesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playSelect();
      this.saveAdminForm();
      this.closeAdminModal();
      this.resetGame();
    });

    // Banker modal
    this.elements.dealBtn.addEventListener('click', () => {
      sounds.stopRing();
      sounds.playDeal();
      this.handleDealAccepted();
    });

    this.elements.noDealBtn.addEventListener('click', () => {
      sounds.stopRing();
      sounds.playNoDeal();
      this.handleNoDealDeclined();
    });

    // Swap modal
    this.elements.keepCaseBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.elements.swapModal.classList.add('hidden');
      this.finishGameWithReveal(false); // keep case
    });

    this.elements.swapCaseBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.elements.swapModal.classList.add('hidden');
      this.finishGameWithReveal(true); // swap case
    });

    // Result modal
    this.elements.playAgainBtn.addEventListener('click', () => {
      sounds.playSelect();
      this.elements.resultModal.classList.add('hidden');
      this.resetGame();
    });
  }

  resetGame() {
    sounds.stopRing();
    this.playerCaseNumber = null;
    this.currentRoundIndex = 0;
    this.casesToOpenThisRound = ROUND_TARGETS[0];
    this.casesOpenedThisRound = 0;
    this.gameState = 'SELECT_CASE';
    this.dealAccepted = false;
    this.acceptedOfferValue = null;

    // Shuffle prizes into 15 cases
    const sortedPrizes = [...this.prizes].sort((a, b) => a.numValue - b.numValue);
    const shuffledPrizes = [...sortedPrizes].sort(() => Math.random() - 0.5);

    this.cases = Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      prize: shuffledPrizes[i],
      opened: false
    }));

    this.swapData = null;
    this.resultData = null;

    this.applyBranding();
    this.renderPrizeBoards();
    this.renderBriefcases();
    this.updatePodium();
    const eventName = this.branding ? this.branding.eventTitle : "DEAL OR NO DEAL";
    this.updateStatusBanner(`WELCOME TO ${eventName.toUpperCase()}`, "Click any briefcase to select your personal case for the flight deck!");
    this.broadcastState();
  }

  renderPrizeBoards() {
    const sortedPrizes = [...this.prizes].sort((a, b) => a.numValue - b.numValue);
    const lowPrizes = sortedPrizes.slice(0, 8);
    const highPrizes = sortedPrizes.slice(8, 15);

    const isEliminated = (prizeObj) => {
      // Checked against opened cases
      return this.cases.some(c => c.opened && c.prize.id === prizeObj.id);
    };

    // Low Prizes List
    this.elements.lowPrizesList.innerHTML = lowPrizes.map(p => `
      <div class="prize-card ${isEliminated(p) ? 'eliminated' : ''}" data-prize-id="${p.id}">
        <span class="prize-name">${p.name}</span>
      </div>
    `).join('');

    // High Prizes List
    this.elements.highPrizesList.innerHTML = highPrizes.map(p => `
      <div class="prize-card ${p.numValue >= 50 ? 'grand-prize' : ''} ${isEliminated(p) ? 'eliminated' : ''}" data-prize-id="${p.id}">
        <span class="prize-name">${p.name}</span>
      </div>
    `).join('');
  }

  renderBriefcases() {
    this.elements.briefcaseGrid.className = "host-case-matrix";
    this.elements.briefcaseGrid.innerHTML = this.cases.map(c => {
      let extraClasses = '';
      let statusTag = `CASE #${c.number}`;

      if (c.number === this.playerCaseNumber) {
        extraClasses += ' selected-player';
        statusTag = 'PERSONAL CASE';
      }

      if (c.opened) {
        extraClasses += ' opened';
        if (c.prize.numValue >= 10) extraClasses += ' high-value';
        statusTag = 'REVEALED';
      }

      return `
        <button class="host-case-btn ${extraClasses}" data-case-num="${c.number}" type="button">
          <span class="host-case-num">${c.number}</span>
          <span class="host-case-tag">${statusTag}</span>
          ${this.hostPeekMode && !c.opened ? `<div class="host-peek-badge">👁️ ${c.prize.name}</div>` : ''}
          ${c.opened ? `<div class="host-case-revealed">${c.prize.name}</div>` : ''}
        </button>
      `;
    }).join('');

    // Bind briefcase clicks
    this.elements.briefcaseGrid.querySelectorAll('.host-case-btn').forEach(el => {
      el.addEventListener('click', () => {
        const caseNum = parseInt(el.getAttribute('data-case-num'));
        this.handleCaseClick(caseNum);
      });
    });
  }

  updatePodium() {
    if (!this.playerCaseNumber) {
      this.elements.playerCaseSlot.innerHTML = `<span class="empty-slot-text">No Case Chosen</span>`;
      this.elements.playerCaseSlot.classList.remove('has-case');
      this.elements.roundIndicator.textContent = "ROUND 1: SELECT YOUR CASE";
    } else {
      this.elements.playerCaseSlot.innerHTML = `
        <div class="sealed-case-display">
          <span class="badge-icon">🧳</span>
          <span class="sealed-case-num">#${this.playerCaseNumber}</span>
        </div>
      `;
      this.elements.playerCaseSlot.classList.add('has-case');
      
      if (this.gameState === 'ELIMINATING') {
        const remainingToOpen = this.casesToOpenThisRound - this.casesOpenedThisRound;
        this.elements.roundIndicator.textContent = `ROUND ${this.currentRoundIndex + 1}: OPEN ${remainingToOpen} MORE CASE${remainingToOpen > 1 ? 'S' : ''}`;
      } else if (this.gameState === 'BANKER_OFFER') {
        const bankerName = (this.branding && this.branding.bankerName) ? this.branding.bankerName.toUpperCase() : "THE BANKER";
        this.elements.roundIndicator.textContent = `${bankerName} CALLING!`;
      } else if (this.gameState === 'FINAL_SWAP') {
        this.elements.roundIndicator.textContent = `FINAL CASE DECISION`;
      }
    }
  }

  updateStatusBanner(heading, subtext, banterType = null) {
    this.elements.statusHeading.textContent = heading;
    this.elements.statusSubtext.textContent = subtext;

    if (banterType && HOST_BANTER[banterType]) {
      const quotes = HOST_BANTER[banterType];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      if (this.elements.hostBanterQuote) {
        this.elements.hostBanterQuote.textContent = randomQuote;
      }
    }
  }

  handleCaseClick(caseNum) {
    const targetCase = this.cases.find(c => c.number === caseNum);
    if (!targetCase) return;

    if (this.gameState === 'SELECT_CASE') {
      // Select player's case
      sounds.playSelect();
      this.playerCaseNumber = caseNum;
      this.gameState = 'ELIMINATING';
      this.currentRoundIndex = 0;
      this.casesToOpenThisRound = ROUND_TARGETS[0];
      this.casesOpenedThisRound = 0;

      this.renderBriefcases();
      this.updatePodium();
      const bankerName = (this.branding && this.branding.bankerName) ? this.branding.bankerName.toUpperCase() : "THE BANKER";
      this.updateStatusBanner(
        `CASE #${this.playerCaseNumber} IS SEALED & DELIVERED TO ${bankerName}!`,
        `Round 1: Click ${this.casesToOpenThisRound} briefcases to eliminate prizes from the board.`,
        'START'
      );
      this.broadcastState();
    } else if (this.gameState === 'ELIMINATING') {
      if (caseNum === this.playerCaseNumber || targetCase.opened) return;

      // 1. Play 3D flip animation & opening sound
      sounds.playOpen();
      const caseEl = document.querySelector(`.host-case-btn[data-case-num="${caseNum}"]`);
      if (caseEl) {
        caseEl.classList.add('opening-anim');
      }

      // Mark as opened
      targetCase.opened = true;
      this.casesOpenedThisRound++;

      this.renderBriefcases();
      this.renderPrizeBoards();

      const remainingInRound = this.casesToOpenThisRound - this.casesOpenedThisRound;
      const isHighValue = targetCase.prize.numValue >= 10;
      let statusNote = "";
      let continueBtnText = "CONTINUE GAME ✈️";

      if (remainingInRound > 0) {
        this.pendingNextStep = 'CONTINUE';
        statusNote = `Eliminated from the board! Open ${remainingInRound} more case${remainingInRound > 1 ? 's' : ''} in Round ${this.currentRoundIndex + 1}.`;
        continueBtnText = "CONTINUE GAME ✈️";

        this.updateStatusBanner(
          `REVEALED: ${targetCase.prize.name}!`,
          `Open ${remainingInRound} more case${remainingInRound > 1 ? 's' : ''} before Flight Control calls.`,
          isHighValue ? 'HIGH_REVEAL' : 'LOW_REVEAL'
        );
      } else {
        // Last case of the round!
        this.pendingNextStep = 'BANKER_OFFER';
        statusNote = `Round ${this.currentRoundIndex + 1} Complete! Flight Control is calling with an offer!`;
        continueBtnText = "ANSWER FLIGHT CONTROL CALL 📡";

        this.updateStatusBanner(
          `REVEALED: ${targetCase.prize.name}!`,
          `Round ${this.currentRoundIndex + 1} complete! Click button to take Flight Control's call.`,
          isHighValue ? 'HIGH_REVEAL' : 'LOW_REVEAL'
        );
      }

      this.updatePodium();

      // Show Case Reveal Modal
      this.elements.revealCaseTitle.textContent = `BRIEFCASE #${targetCase.number}`;
      this.elements.revealPrizeValue.textContent = targetCase.prize.name;
      this.elements.revealStatusNote.textContent = statusNote;
      this.elements.continueBtnText.textContent = continueBtnText;
      this.elements.revealPrizeBox.className = `reveal-prize-box ${isHighValue ? 'high-value' : ''}`;
      this.elements.caseRevealModal.classList.remove('hidden');

      this.revealData = {
        caseNum: targetCase.number,
        prizeName: targetCase.prize.name,
        isHigh: isHighValue,
        note: statusNote
      };

      this.broadcastState();
    }
  }

  triggerBankerOffer() {
    this.gameState = 'BANKER_OFFER';
    this.offerBroadcasted = false;
    this.updatePodium();
    const bankerName = (this.branding && this.branding.bankerName) ? this.branding.bankerName : "The Banker";
    this.updateStatusBanner("INCOMING OFFER...", `${bankerName} is transmitting a deal offer!`, 'BANKER_CALL');

    // Get unrevealed prizes
    const remainingPrizes = this.cases.filter(c => !c.opened).map(c => c.prize);
    this.suggestedOffer = FlightControllerBanker.calculateOffer(remainingPrizes, this.currentRoundIndex + 1);
    this.currentOffer = Object.assign({}, this.suggestedOffer);

    // Reset tab states & custom prize inputs
    this.elements.tabSuggestedBtn.classList.add('active');
    this.elements.tabCustomBtn.classList.remove('active');
    this.elements.customOfferBox.classList.add('hidden');
    this.elements.customOfferAmount.value = this.suggestedOffer.offerAmount;
    if (this.elements.customOfferPrize) {
      this.elements.customOfferPrize.value = '';
    }

    // Staging button reset
    this.elements.broadcastOfferBtn.classList.remove('hidden');
    this.elements.broadcastLiveTag.classList.add('hidden');

    this.renderActiveOfferUI();

    sounds.startRing();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'ring' });
    this.elements.bankerModal.classList.remove('hidden');
    this.broadcastState();
  }

  renderActiveOfferUI() {
    if (!this.currentOffer) return;

    if (this.currentOffer.isCustom) {
      this.elements.offerLabelHeading.textContent = "HOST OFFER";
      this.elements.offerTypeBadge.textContent = "SPECIAL HOST OFFER";
      this.elements.bankerTitleHeading.textContent = "HOST OFFER PRESENTED!";
      this.elements.bankerOfferCard.classList.add('custom-host-card');

      if (this.currentOffer.physicalPrize) {
        this.elements.bankerPhysicalDisplay.textContent = `+ ${this.currentOffer.physicalPrize}`;
        this.elements.bankerPhysicalDisplay.classList.remove('hidden');
      } else {
        this.elements.bankerPhysicalDisplay.classList.add('hidden');
      }
    } else {
      const bankerName = (this.branding && this.branding.bankerName) ? this.branding.bankerName.toUpperCase() : "BANKER";
      this.elements.offerLabelHeading.textContent = `${bankerName} OFFER`;
      this.elements.offerTypeBadge.textContent = "INCOMING TRANSMISSION";
      this.elements.bankerTitleHeading.textContent = `${bankerName} CALLING...`;
      this.elements.bankerOfferCard.classList.remove('custom-host-card');
      this.elements.bankerPhysicalDisplay.classList.add('hidden');
    }

    this.elements.bankerOfferDisplay.textContent = this.currentOffer.formattedOffer;
    this.elements.bankerEvMeta.textContent = `Board Average EV: $${this.currentOffer.ev || 0}`;

    this.broadcastState();
  }

  handleDealAccepted() {
    sounds.stopRing();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'stopRing' });
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'deal' });
    this.elements.bankerModal.classList.add('hidden');
    this.dealAccepted = true;

    let dealValue = this.currentOffer.formattedOffer;
    if (this.currentOffer.physicalPrize) {
      dealValue += ` + ${this.currentOffer.physicalPrize}`;
    }
    this.acceptedOfferValue = dealValue;
    this.gameState = 'GAME_OVER';

    const playerCase = this.cases.find(c => c.number === this.playerCaseNumber);

    this.showResultModal({
      icon: '🤝',
      title: 'DEAL ACCEPTED!',
      subtitle: `You accepted ${this.currentOffer.isCustom ? 'the Host Offer' : "the Banker's offer"}!`,
      prizeValue: this.acceptedOfferValue,
      caseInfo: `Your original sealed Case #${this.playerCaseNumber} contained: ${playerCase.prize.name}`
    });

    startConfetti();
    this.broadcastState();
  }

  handleNoDealDeclined() {
    sounds.stopRing();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'stopRing' });
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'nodeal' });
    this.elements.bankerModal.classList.add('hidden');
    if (this.elements.customOfferPrize) {
      this.elements.customOfferPrize.value = '';
    }
    this.currentRoundIndex++;

    // Check how many unopened non-player cases remain
    const unrevealedCases = this.cases.filter(c => !c.opened && c.number !== this.playerCaseNumber);

    if (unrevealedCases.length === 1) {
      // Down to final 2 cases! (Player Case + 1 remaining case)
      this.triggerFinalSwap(unrevealedCases[0]);
    } else if (this.currentRoundIndex < ROUND_TARGETS.length) {
      // Continue to next round
      this.gameState = 'ELIMINATING';
      this.casesToOpenThisRound = ROUND_TARGETS[this.currentRoundIndex];
      this.casesOpenedThisRound = 0;
      this.updatePodium();
      this.updateStatusBanner(
        `ROUND ${this.currentRoundIndex + 1} STARTED`,
        `Open ${this.casesToOpenThisRound} briefcase${this.casesToOpenThisRound > 1 ? 's' : ''} to continue.`
      );
      this.broadcastState();
    } else {
      // Extended Round 5+ (open 1 case per round)
      this.gameState = 'ELIMINATING';
      this.casesToOpenThisRound = 1;
      this.casesOpenedThisRound = 0;
      this.updatePodium();
      this.updateStatusBanner(
        `FINAL ELIMINATIONS`,
        `Open 1 briefcase to continue.`
      );
      this.broadcastState();
    }
  }

  triggerFinalSwap(otherCase) {
    this.gameState = 'FINAL_SWAP';
    this.swapData = { playerNum: this.playerCaseNumber, otherNum: otherCase.number };
    this.updatePodium();
    this.updateStatusBanner("THE FINAL FLIGHT CHOICE", "Will you keep your original sealed case or swap with the last remaining case?");

    this.elements.swapPlayerCaseNum.textContent = `#${this.playerCaseNumber}`;
    this.elements.swapOtherCaseNum.textContent = `#${otherCase.number}`;

    this.elements.swapModal.classList.remove('hidden');
    this.broadcastState();
  }

  finishGameWithReveal(didSwap) {
    this.gameState = 'GAME_OVER';

    const playerCase = this.cases.find(c => c.number === this.playerCaseNumber);
    const otherCase = this.cases.find(c => !c.opened && c.number !== this.playerCaseNumber);

    const winningCase = didSwap ? otherCase : playerCase;
    const losingCase = didSwap ? playerCase : otherCase;

    sounds.playFanfare();
    this.broadcast.postMessage({ type: 'PLAY_SOUND', sound: 'fanfare' });
    startConfetti();

    this.showResultModal({
      icon: '✈️',
      title: didSwap ? `SWAPPED & WON!` : `KEPT CASE #${playerCase.number}!`,
      subtitle: `Festival of Flight Final Briefcase Reveal!`,
      prizeValue: winningCase.prize.name,
      caseInfo: `The other case (#${losingCase.number}) contained: ${losingCase.prize.name}`
    });
    this.broadcastState();
  }

  showResultModal({ icon, title, subtitle, prizeValue, caseInfo }) {
    this.resultData = { icon, title, subtitle, prizeValue, caseInfo };
    this.elements.resultIcon.textContent = icon;
    this.elements.resultTitle.textContent = title;
    this.elements.resultSubtitle.textContent = subtitle;
    this.elements.resultPrizeValue.textContent = prizeValue;
    this.elements.resultCaseInfo.textContent = caseInfo;
    this.elements.resultModal.classList.remove('hidden');
  }

  broadcastState() {
    if (!this.broadcast) return;
    const statePayload = {
      prizes: this.prizes,
      cases: this.cases,
      playerCaseNumber: this.playerCaseNumber,
      currentRoundIndex: this.currentRoundIndex,
      gameState: this.gameState,
      currentOffer: this.currentOffer,
      statusHeading: this.elements.statusHeading ? this.elements.statusHeading.textContent : "",
      statusSubtext: this.elements.statusSubtext ? this.elements.statusSubtext.textContent : "",
      roundText: this.elements.roundIndicator ? this.elements.roundIndicator.textContent : "",
      swapData: this.swapData,
      resultData: this.resultData,
      revealData: this.revealData,
      offerBroadcasted: this.offerBroadcasted,
      theme: this.theme,
      branding: this.branding
    };
    try {
      localStorage.setItem('gander_deal_last_state', JSON.stringify(statePayload));
    } catch (e) {}
    this.broadcast.postMessage({ type: 'SYNC_STATE', state: statePayload });
  }

  // Admin Modal Methods
  openAdminModal() {
    this.populateAdminForm();
    this.elements.adminModal.classList.remove('hidden');
  }

  closeAdminModal() {
    this.elements.adminModal.classList.add('hidden');
  }

  populateAdminForm() {
    if (this.branding) {
      if (this.elements.settingEventTitle) this.elements.settingEventTitle.value = this.branding.eventTitle || "";
      if (this.elements.settingEventSubtitle) this.elements.settingEventSubtitle.value = this.branding.eventSubtitle || "";
      if (this.elements.settingEventTag) this.elements.settingEventTag.value = this.branding.eventTag || "";
      if (this.elements.settingBankerName) this.elements.settingBankerName.value = this.branding.bankerName || "";
    }

    this.elements.prizeForm.innerHTML = this.prizes.map((p, idx) => `
      <div class="prize-input-row">
        <span class="prize-idx-tag">#${idx + 1}</span>
        <input type="text" class="input-field name-input" data-idx="${idx}" value="${p.name}" placeholder="Prize Name">
        <input type="number" step="0.01" class="input-field num-input" data-idx="${idx}" value="${p.numValue}" placeholder="Value ($)">
      </div>
    `).join('');
  }

  saveAdminForm() {
    // 1. Save branding settings
    const updatedBranding = {
      eventTitle: this.elements.settingEventTitle ? (this.elements.settingEventTitle.value.trim() || "DEAL OR NO DEAL") : "DEAL OR NO DEAL",
      eventSubtitle: this.elements.settingEventSubtitle ? (this.elements.settingEventSubtitle.value.trim() || "LIVE STAGE GAME SHOW") : "LIVE STAGE GAME SHOW",
      eventTag: this.elements.settingEventTag ? (this.elements.settingEventTag.value.trim() || "DND-15") : "DND-15",
      bankerName: this.elements.settingBankerName ? (this.elements.settingBankerName.value.trim() || "BANKER") : "BANKER"
    };
    this.saveBranding(updatedBranding);

    // 2. Save prizes
    const updatedPrizes = [];
    const rows = this.elements.prizeForm.querySelectorAll('.prize-input-row');
    rows.forEach((row, idx) => {
      const name = row.querySelector('.name-input').value.trim() || `Prize #${idx + 1}`;
      const numVal = parseFloat(row.querySelector('.num-input').value) || (idx + 1);
      updatedPrizes.push({
        id: idx + 1,
        name: name,
        numValue: numVal
      });
    });
    this.savePrizes(updatedPrizes);
    this.renderPrizeBoards();
    this.closeAdminModal();
  }
}

/* ==========================================================================
   Canvas Confetti Animation Engine
   ========================================================================== */
let confettiAnimationId = null;
function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#38bdf8', '#0284c7', '#f59e0b', '#fbbf24', '#ffffff', '#10b981'];
  const particleCount = 120;
  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 10 + 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 5 + 3,
    speedX: (Math.random() - 0.5) * 4,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 10
  }));

  const startTime = Date.now();

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;

      if (p.y < canvas.height) alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
      ctx.restore();
    });

    if (alive && Date.now() - startTime < 6000) {
      confettiAnimationId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  render();
}

// Initialize App when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GameController();
});
