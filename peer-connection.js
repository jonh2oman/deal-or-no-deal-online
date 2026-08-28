/**
 * Mobile Peer Communication & QR Code Engine
 * Manages WebRTC PeerJS connections for Mobile Player Buzzers and Audience Voting.
 */

class MobilePeerManager {
  constructor(isHost = false, role = 'host') {
    this.isHost = isHost;
    this.role = role; // 'host', 'buzzer', 'vote'
    this.peer = null;
    this.peerId = null;
    this.connections = [];
    this.buzzLocked = false;
    this.votes = { deal: 0, noDeal: 0, total: 0 };
    this.onBuzzCallback = null;
    this.onVoteCallback = null;
  }

  initHost(onBuzz, onVote) {
    this.onBuzzCallback = onBuzz;
    this.onVoteCallback = onVote;

    // Load PeerJS dynamically if needed
    if (typeof Peer === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
      script.onload = () => this.createHostPeer();
      document.head.appendChild(script);
    } else {
      this.createHostPeer();
    }
  }

  createHostPeer() {
    const randomId = 'STAGE-' + Math.floor(1000 + Math.random() * 9000);
    this.peer = new Peer(randomId);

    this.peer.on('open', (id) => {
      this.peerId = id;
      this.renderQRCode(id);
    });

    this.peer.on('connection', (conn) => {
      this.connections.push(conn);

      if (this.gameTitle && this.playersList && conn.open) {
        conn.send({ type: 'INIT_GAME_INFO', gameTitle: this.gameTitle, playersList: this.playersList });
      }

      conn.on('open', () => {
        if (this.gameTitle && this.playersList) {
          conn.send({ type: 'INIT_GAME_INFO', gameTitle: this.gameTitle, playersList: this.playersList });
        }
      });

      conn.on('data', (data) => {
        if (!data) return;
        if (data.type === 'BUZZ') {
          this.handleBuzz(data, conn);
        } else if (data.type === 'VOTE') {
          this.handleVote(data, conn);
        } else if (data.type === 'FINAL_SUBMIT') {
          if (this.onFinalSubmitCallback) {
            this.onFinalSubmitCallback(data);
          }
        }
      });

      conn.on('close', () => {
        this.connections = this.connections.filter(c => c !== conn);
      });
    });
  }

  setGameInfo(gameTitle, playersList) {
    this.gameTitle = gameTitle;
    this.playersList = playersList;
    this.connections.forEach(c => {
      if (c.open) c.send({ type: 'INIT_GAME_INFO', gameTitle, playersList });
    });
  }

  renderQRCode(peerId) {
    const qrContainer = document.getElementById('qrcode-canvas');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    const currentUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const targetUrl = `${currentUrl}/buzzer.html?host=${peerId}`;

    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: targetUrl,
        width: 200,
        height: 200,
        colorDark: "#0284c7",
        colorLight: "#ffffff"
      });
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = () => {
        new QRCode(qrContainer, {
          text: targetUrl,
          width: 200,
          height: 200,
          colorDark: "#0284c7",
          colorLight: "#ffffff"
        });
      };
      document.head.appendChild(script);
    }

    const linkEl = document.getElementById('qr-direct-link');
    if (linkEl) {
      linkEl.href = targetUrl;
      linkEl.textContent = targetUrl;
    }
  }

  handleBuzz(data, conn) {
    if (this.buzzLocked) {
      conn.send({ type: 'LOCKOUT', winner: this.firstBuzzerName });
      return;
    }

    this.buzzLocked = true;
    this.firstBuzzerName = data.playerName || data.teamName || "Player";

    // Broadcast lockout to all connected mobile devices
    this.connections.forEach(c => {
      if (c === conn) {
        c.send({ type: 'BUZZ_WIN', reactionTime: data.reactionTime });
      } else {
        c.send({ type: 'LOCKOUT', winner: this.firstBuzzerName });
      }
    });

    if (this.onBuzzCallback) {
      this.onBuzzCallback(data);
    }
  }

  resetBuzzers() {
    this.buzzLocked = false;
    this.firstBuzzerName = null;
    this.connections.forEach(c => c.send({ type: 'RESET_BUZZER' }));
  }

  setMode(modeName) {
    this.connections.forEach(c => {
      if (modeName === 'FINAL_JEOPARDY') {
        c.send({ type: 'MODE_FINAL_JEOPARDY' });
      } else {
        c.send({ type: 'MODE_BUZZER' });
      }
    });
  }

  handleVote(data) {
    if (data.vote === 'deal') this.votes.deal++;
    else if (data.vote === 'nodeal') this.votes.noDeal++;
    this.votes.total = this.votes.deal + this.votes.noDeal;

    const dealPct = this.votes.total > 0 ? Math.round((this.votes.deal / this.votes.total) * 100) : 50;
    const noDealPct = 100 - dealPct;

    const voteData = {
      deal: this.votes.deal,
      noDeal: this.votes.noDeal,
      total: this.votes.total,
      dealPct: dealPct,
      noDealPct: noDealPct
    };

    if (this.onVoteCallback) {
      this.onVoteCallback(voteData);
    }

    // Broadcast updated vote stats to all clients
    this.connections.forEach(c => c.send({ type: 'VOTE_STATS', voteData }));
  }

  resetVotes() {
    this.votes = { deal: 0, noDeal: 0, total: 0 };
    this.connections.forEach(c => c.send({ type: 'RESET_VOTES' }));
  }
}

// Global Peer Manager Singleton
const mobilePeerManager = new MobilePeerManager(true, 'host');
