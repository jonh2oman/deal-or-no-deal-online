/**
 * Deal or No Deal Mobile Spectator Board Receiver
 */

class MobileDealSpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('gander_deal_broadcast');
    
    this.brandTitle = document.getElementById('brand-title');
    this.mobileStatus = document.getElementById('mobile-status');
    this.mobileOfferBanner = document.getElementById('mobile-offer-banner');
    this.mobileOfferAmount = document.getElementById('mobile-offer-amount');
    this.mobileSealedCase = document.getElementById('mobile-sealed-case');
    this.mobileCasesGrid = document.getElementById('mobile-cases-grid');
    this.mobileLowPrizes = document.getElementById('mobile-low-prizes');
    this.mobileHighPrizes = document.getElementById('mobile-high-prizes');

    this.init();
  }

  init() {
    this.broadcast.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'SYNC_STATE' || e.data.type === 'STATE_UPDATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('gander_deal_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}

    // Request fresh state from host
    this.broadcast.postMessage({ type: 'REQUEST_STATE' });
  }

  renderState(state) {
    if (!state) return;

    if (state.branding && this.brandTitle) {
      this.brandTitle.textContent = `🧳 ${state.branding.eventTitle || 'DEAL OR NO DEAL'}`;
    }

    if (this.mobileSealedCase) {
      this.mobileSealedCase.textContent = state.playerCaseNumber ? `#${state.playerCaseNumber}` : 'None Chosen';
    }

    if (state.isOfferActive && state.currentOffer) {
      if (this.mobileOfferBanner) this.mobileOfferBanner.classList.remove('hidden');
      if (this.mobileOfferAmount) this.mobileOfferAmount.textContent = `$${state.currentOffer.cashAmount.toLocaleString()}`;
    } else {
      if (this.mobileOfferBanner) this.mobileOfferBanner.classList.add('hidden');
    }

    // Render Briefcases Grid
    if (this.mobileCasesGrid && Array.isArray(state.briefcases)) {
      this.mobileCasesGrid.innerHTML = '';
      state.briefcases.forEach(b => {
        const btn = document.createElement('div');
        btn.className = `mobile-case-btn ${b.opened ? 'opened' : ''}`;
        btn.textContent = `#${b.number}`;
        this.mobileCasesGrid.appendChild(btn);
      });
    }

    // Render Low & High Prize Columns
    if (Array.isArray(state.prizes)) {
      const sorted = [...state.prizes].sort((a, b) => a.numValue - b.numValue);
      const low = sorted.slice(0, Math.ceil(sorted.length / 2));
      const high = sorted.slice(Math.ceil(sorted.length / 2));

      if (this.mobileLowPrizes) {
        this.mobileLowPrizes.innerHTML = low.map(p => `
          <div class="mobile-prize-item low ${p.opened ? 'opened' : ''}">
            ${p.name}
          </div>
        `).join('');
      }

      if (this.mobileHighPrizes) {
        this.mobileHighPrizes.innerHTML = high.map(p => `
          <div class="mobile-prize-item high ${p.opened ? 'opened' : ''}">
            ${p.name}
          </div>
        `).join('');
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MobileDealSpectator();
});
