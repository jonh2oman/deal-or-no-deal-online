/**
 * Gander Festival of Flight - Spectator Display Engine
 * Listens to BroadcastChannel real-time sync from Host Controller.
 */

class SpectatorController {
  constructor() {
    this.broadcast = new BroadcastChannel('gander_deal_broadcast');
    this.state = null;

    this.initDOM();
    this.bindBroadcast();

    // Try loading initial state from localStorage immediately
    try {
      const saved = localStorage.getItem('gander_deal_last_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.cases) {
          this.renderState(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load initial spectator state from storage.", e);
    }

    // Request fresh state from host
    this.broadcast.postMessage({ type: 'REQUEST_STATE' });
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
      playerCaseSlot: document.getElementById('player-case-slot'),
      roundIndicator: document.getElementById('round-indicator'),

      caseRevealModal: document.getElementById('case-reveal-modal'),
      revealCaseTitle: document.getElementById('reveal-case-title'),
      revealPrizeValue: document.getElementById('reveal-prize-value'),
      revealStatusNote: document.getElementById('reveal-status-note'),
      revealPrizeBox: document.getElementById('reveal-prize-box'),

      bankerModal: document.getElementById('banker-modal'),
      offerTypeBadge: document.getElementById('offer-type-badge'),
      bankerTitleHeading: document.getElementById('banker-title-heading'),
      offerLabelHeading: document.getElementById('offer-label-heading'),
      bankerOfferCard: document.getElementById('banker-offer-card'),
      bankerOfferDisplay: document.getElementById('banker-offer-display'),
      bankerPhysicalDisplay: document.getElementById('banker-physical-display'),
      bankerEvMeta: document.getElementById('banker-ev-meta'),

      swapModal: document.getElementById('swap-modal'),
      swapPlayerCaseNum: document.getElementById('swap-player-case-num'),
      swapOtherCaseNum: document.getElementById('swap-other-case-num'),

      resultModal: document.getElementById('result-modal'),
      resultIcon: document.getElementById('result-icon'),
      resultTitle: document.getElementById('result-title'),
      resultSubtitle: document.getElementById('result-subtitle'),
      resultPrizeValue: document.getElementById('result-prize-value'),
      resultCaseInfo: document.getElementById('result-case-info')
    };
  }

  bindBroadcast() {
    this.broadcast.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'SYNC_STATE') {
        if (data.state && data.state.theme) {
          document.documentElement.setAttribute('data-theme', data.state.theme);
          document.body.setAttribute('data-theme', data.state.theme);
        }
        this.renderState(data.state);
      } else if (data.type === 'SET_AMBIENT') {
        sounds.startAmbient(data.ambient);
      } else if (data.type === 'PLAY_SOUND') {
        this.handlePlaySound(data.sound);
      }
    };

    // Channel 2: Instant window storage event listener (Bulletproof across file:// windows!)
    window.addEventListener('storage', (e) => {
      if (e.key === 'gander_deal_last_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.cases) {
            this.renderState(parsed);
          }
        } catch (err) {}
      } else if (e.key === 'gander_deal_sound_trigger' && e.newValue) {
        const soundName = e.newValue.split('_')[0];
        this.handlePlaySound(soundName);
      }
    });

    // Channel 3: High-speed 300ms heartbeat poll
    setInterval(() => {
      try {
        const saved = localStorage.getItem('gander_deal_last_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.cases && (!this.state || JSON.stringify(parsed) !== JSON.stringify(this.state))) {
            this.renderState(parsed);
          }
        }
      } catch (err) {}
    }, 300);
  }

  handlePlaySound(sound) {
    if (sound === 'open') sounds.playOpen();
    else if (sound === 'ring') sounds.startRing();
    else if (sound === 'stopRing') sounds.stopRing();
    else if (sound === 'banker') sounds.playBanker();
    else if (sound === 'deal') sounds.playDeal();
    else if (sound === 'noDeal') sounds.playNoDeal();
    else if (sound === 'win' || sound === 'fanfare') { sounds.playFanfare(); startConfetti(); }
    else if (sound === 'theme') sounds.playTheme();
    else if (sound === 'buzzer') { if (typeof sounds !== 'undefined' && sounds.playBuzzer) sounds.playBuzzer(); }
    else if (sound === 'stop') { if (typeof sounds !== 'undefined' && sounds.stopAll) sounds.stopAll(); }
  }

  renderState(state) {
    this.state = state;
    if (!state || !state.prizes || !state.cases) return;

    if (state.theme) {
      document.documentElement.setAttribute('data-theme', state.theme);
      document.body.setAttribute('data-theme', state.theme);
    }

    if (state.branding) {
      if (this.elements.brandEventTitle) this.elements.brandEventTitle.textContent = state.branding.eventTitle || "DEAL OR NO DEAL";
      if (this.elements.brandEventSubtitle) this.elements.brandEventSubtitle.textContent = state.branding.eventSubtitle || "LIVE STAGE GAME SHOW";
      if (this.elements.brandTagCode) this.elements.brandTagCode.textContent = state.branding.eventTag || "DND-15";
      
      const flightBadge = document.querySelector('.flight-badge');
      if (flightBadge) {
        if (state.branding.showEventTag === false) {
          flightBadge.classList.add('hidden');
        } else {
          flightBadge.classList.remove('hidden');
        }
      }

      document.title = `${state.branding.eventTitle || "Deal or No Deal"} - Stage Display`;
    }

    // Render Prize Boards
    const sortedPrizes = [...state.prizes].sort((a, b) => a.numValue - b.numValue);
    const lowPrizes = sortedPrizes.slice(0, 8);
    const highPrizes = sortedPrizes.slice(8, 15);

    const isEliminated = (p) => state.cases.some(c => c.opened && c.prize && c.prize.id === p.id);

    this.elements.lowPrizesList.innerHTML = lowPrizes.map(p => `
      <div class="prize-card ${isEliminated(p) ? 'eliminated' : ''}">
        <span class="prize-name">${p.name}</span>
      </div>
    `).join('');

    this.elements.highPrizesList.innerHTML = highPrizes.map(p => `
      <div class="prize-card ${p.numValue >= 50 ? 'grand-prize' : ''} ${isEliminated(p) ? 'eliminated' : ''}">
        <span class="prize-name">${p.name}</span>
      </div>
    `).join('');

    // Render Briefcases
    this.elements.briefcaseGrid.innerHTML = state.cases.map(c => {
      let extraClasses = '';
      if (c.opened && c.prize) {
        extraClasses += ' opened';
        if (c.prize.numValue >= 10) extraClasses += ' high-value';
      }
      if (c.number === state.playerCaseNumber) {
        extraClasses += ' selected-player';
      }

      return `
        <div class="case-card ${extraClasses}">
          <div class="chrome-handle-arch"></div>
          <div class="chrome-latch latch-left"></div>
          <div class="chrome-latch latch-right"></div>
          <div class="corner-bracket top-left"></div>
          <div class="corner-bracket top-right"></div>
          <div class="corner-bracket bottom-left"></div>
          <div class="corner-bracket bottom-right"></div>
          <div class="case-badge-plate">
            <span class="case-tag">GND-${c.number.toString().padStart(2, '0')}</span>
            <span class="case-number">${c.number}</span>
          </div>
          <div class="rubber-foot foot-left"></div>
          <div class="rubber-foot foot-right"></div>
          ${(c.opened && c.prize) ? `<div class="case-revealed-value">${c.prize.name}</div>` : ''}
        </div>
      `;
    }).join('');

    // Render Status & Podium
    this.elements.statusHeading.textContent = state.statusHeading;
    this.elements.statusSubtext.textContent = state.statusSubtext;

    if (!state.playerCaseNumber) {
      this.elements.playerCaseSlot.innerHTML = `<span class="empty-slot-text">No Case Chosen</span>`;
      this.elements.playerCaseSlot.classList.remove('has-case');
      this.elements.roundIndicator.textContent = "ROUND 1";
    } else {
      this.elements.playerCaseSlot.innerHTML = `
        <div class="sealed-case-display">
          <span class="badge-icon">🧳</span>
          <span class="sealed-case-num">#${state.playerCaseNumber}</span>
        </div>
      `;
      this.elements.playerCaseSlot.classList.add('has-case');
      this.elements.roundIndicator.textContent = state.roundText || "LIVE GAME";
    }

    // Modal Displays
    if (state.revealData) {
      this.elements.revealCaseTitle.textContent = `BRIEFCASE #${state.revealData.caseNum}`;
      this.elements.revealPrizeValue.textContent = state.revealData.prizeName;
      this.elements.revealStatusNote.textContent = state.revealData.note;
      this.elements.revealPrizeBox.className = `reveal-prize-box ${state.revealData.isHigh ? 'high-value' : ''}`;
      this.elements.caseRevealModal.classList.remove('hidden');
    } else {
      this.elements.caseRevealModal.classList.add('hidden');
    }

    if (state.gameState === 'BANKER_OFFER' && state.currentOffer) {
      if (!state.offerBroadcasted) {
        // Holding screen until host pushes the offer
        if (this.elements.offerLabelHeading) this.elements.offerLabelHeading.textContent = "INCOMING OFFER";
        if (this.elements.offerTypeBadge) this.elements.offerTypeBadge.textContent = "TRANSMISSION IN PROGRESS";
        if (this.elements.bankerTitleHeading) this.elements.bankerTitleHeading.textContent = "BANKER CALLING...";
        if (this.elements.bankerOfferCard) this.elements.bankerOfferCard.classList.remove('custom-host-card');
        if (this.elements.bankerPhysicalDisplay) this.elements.bankerPhysicalDisplay.classList.add('hidden');

        this.elements.bankerOfferDisplay.textContent = "OFFER INCOMING...";
        this.elements.bankerEvMeta.textContent = "The Banker is preparing a deal offer for the contestant!";
      } else {
        // Offer is live!
        if (state.currentOffer.isCustom) {
          if (this.elements.offerLabelHeading) this.elements.offerLabelHeading.textContent = "HOST OFFER";
          if (this.elements.offerTypeBadge) this.elements.offerTypeBadge.textContent = "SPECIAL HOST OFFER";
          if (this.elements.bankerTitleHeading) this.elements.bankerTitleHeading.textContent = "HOST OFFER PRESENTED!";
          if (this.elements.bankerOfferCard) this.elements.bankerOfferCard.classList.add('custom-host-card');

          if (state.currentOffer.physicalPrize && this.elements.bankerPhysicalDisplay) {
            this.elements.bankerPhysicalDisplay.textContent = `+ ${state.currentOffer.physicalPrize}`;
            this.elements.bankerPhysicalDisplay.classList.remove('hidden');
          } else if (this.elements.bankerPhysicalDisplay) {
            this.elements.bankerPhysicalDisplay.classList.add('hidden');
          }
        } else {
          if (this.elements.offerLabelHeading) this.elements.offerLabelHeading.textContent = "BANKER OFFER";
          if (this.elements.offerTypeBadge) this.elements.offerTypeBadge.textContent = "INCOMING TRANSMISSION";
          if (this.elements.bankerTitleHeading) this.elements.bankerTitleHeading.textContent = "BANKER CALLING...";
          if (this.elements.bankerOfferCard) this.elements.bankerOfferCard.classList.remove('custom-host-card');
          if (this.elements.bankerPhysicalDisplay) this.elements.bankerPhysicalDisplay.classList.add('hidden');
        }

        this.elements.bankerOfferDisplay.textContent = state.currentOffer.formattedOffer;
        this.elements.bankerEvMeta.textContent = `Board Average EV: $${state.currentOffer.ev}`;
      }
      this.elements.bankerModal.classList.remove('hidden');
    } else {
      this.elements.bankerModal.classList.add('hidden');
    }

    if (state.gameState === 'FINAL_SWAP' && state.swapData) {
      this.elements.swapPlayerCaseNum.textContent = `#${state.swapData.playerNum}`;
      this.elements.swapOtherCaseNum.textContent = `#${state.swapData.otherNum}`;
      this.elements.swapModal.classList.remove('hidden');
    } else {
      this.elements.swapModal.classList.add('hidden');
    }

    if (state.gameState === 'GAME_OVER' && state.resultData) {
      this.elements.resultIcon.textContent = state.resultData.icon;
      this.elements.resultTitle.textContent = state.resultData.title;
      this.elements.resultSubtitle.textContent = state.resultData.subtitle;
      this.elements.resultPrizeValue.textContent = state.resultData.prizeValue;
      this.elements.resultCaseInfo.textContent = state.resultData.caseInfo;
      this.elements.resultModal.classList.remove('hidden');
    } else {
      this.elements.resultModal.classList.add('hidden');
    }
  }
}

/* Confetti Engine for Spectator */
let confettiAnimationId = null;
function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#38bdf8', '#0284c7', '#f59e0b', '#fbbf24', '#ffffff', '#10b981'];
  const particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 12 + 6,
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

window.addEventListener('DOMContentLoaded', () => {
  window.spectator = new SpectatorController();
});
