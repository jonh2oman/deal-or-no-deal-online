/**
 * Deal or No Deal Mobile Spectator Board Receiver
 * Connects to host via PeerJS WebRTC for cross-device live updates.
 */

class MobileDealSpectator {
  constructor() {
    this.clockDisplay = document.getElementById('brand-title');
    this.mobileStatus = document.getElementById('mobile-status');
    this.mobileOfferBanner = document.getElementById('mobile-offer-banner');
    this.mobileOfferAmount = document.getElementById('mobile-offer-amount');
    this.mobileSealedCase = document.getElementById('mobile-sealed-case');
    this.mobileCasesGrid = document.getElementById('mobile-cases-grid');
    this.mobileLowPrizes = document.getElementById('mobile-low-prizes');
    this.mobileHighPrizes = document.getElementById('mobile-high-prizes');

    this.peer = null;
    this.conn = null;
    this.hostId = new URLSearchParams(window.location.search).get('host');

    if (this.hostId) {
      this.connectToPeer();
    } else {
      if (this.mobileStatus) this.mobileStatus.textContent = 'NO HOST ID IN URL';
    }
  }

  connectToPeer() {
    if (this.mobileStatus) this.mobileStatus.textContent = 'CONNECTING...';

    // Load PeerJS dynamically if not present
    const connectFn = () => {
      this.peer = new Peer();
      this.peer.on('open', () => {
        this.conn = this.peer.connect(this.hostId);
        this.conn.on('open', () => {
          if (this.mobileStatus) this.mobileStatus.textContent = 'CONNECTED — LIVE';
          // Request current state immediately
          this.conn.send({ type: 'REQUEST_STATE' });
        });
        this.conn.on('data', (data) => {
          if (!data) return;
          if (data.type === 'STATE_UPDATE' || data.type === 'SYNC_STATE') {
            this.renderState(data.state);
          }
        });
        this.conn.on('close', () => {
          if (this.mobileStatus) this.mobileStatus.textContent = 'DISCONNECTED — Refresh to reconnect';
        });
        this.conn.on('error', () => {
          if (this.mobileStatus) this.mobileStatus.textContent = 'CONNECTION ERROR';
        });
      });
      this.peer.on('error', () => {
        if (this.mobileStatus) this.mobileStatus.textContent = 'PEER ERROR — Refresh to retry';
      });
    };

    if (typeof Peer !== 'undefined') {
      connectFn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
      script.onload = connectFn;
      document.head.appendChild(script);
    }
  }

  renderState(state) {
    if (!state) return;

    if (state.branding && this.clockDisplay) {
      this.clockDisplay.textContent = `🧳 ${state.branding.eventTitle || 'DEAL OR NO DEAL'}`;
    }

    if (this.mobileSealedCase) {
      this.mobileSealedCase.textContent = state.playerCaseNumber ? `#${state.playerCaseNumber}` : 'None Chosen';
    }

    if (state.gameState === 'BANKER_OFFER' && state.offerBroadcasted) {
      if (this.mobileOfferBanner) this.mobileOfferBanner.classList.remove('hidden');
      if (this.mobileOfferAmount && state.offerAmount !== undefined) {
        this.mobileOfferAmount.textContent = `$${Number(state.offerAmount).toLocaleString()}`;
      }
    } else {
      if (this.mobileOfferBanner) this.mobileOfferBanner.classList.add('hidden');
    }

    // Render Briefcases Grid
    if (this.mobileCasesGrid && Array.isArray(state.cases)) {
      this.mobileCasesGrid.innerHTML = '';
      state.cases.forEach(b => {
        const btn = document.createElement('div');
        btn.className = `mobile-case-btn ${b.opened ? 'opened' : ''}`;
        btn.textContent = `#${b.number}`;
        this.mobileCasesGrid.appendChild(btn);
      });
    }

    // Render Low & High Prize Columns
    if (Array.isArray(state.prizes)) {
      const openedPrizeNames = new Set(
        (state.cases || []).filter(c => c.opened && c.prize).map(c => c.prize.name)
      );
      const sorted = [...state.prizes].sort((a, b) => (a.numValue || 0) - (b.numValue || 0));
      const half = Math.ceil(sorted.length / 2);
      const low = sorted.slice(0, half);
      const high = sorted.slice(half);

      if (this.mobileLowPrizes) {
        this.mobileLowPrizes.innerHTML = low.map(p => `
          <div class="mobile-prize-item low ${openedPrizeNames.has(p.name) ? 'opened' : ''}">${p.name}</div>
        `).join('');
      }
      if (this.mobileHighPrizes) {
        this.mobileHighPrizes.innerHTML = high.map(p => `
          <div class="mobile-prize-item high ${openedPrizeNames.has(p.name) ? 'opened' : ''}">${p.name}</div>
        `).join('');
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MobileDealSpectator();
});
