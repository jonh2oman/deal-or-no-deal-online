/**
 * Press Your Luck Spectator View Receiver
 */

const WHAMMY_BOARD_TILES_TV = [
  { val: 1000, label: "$1,000", type: "cash" },
  { val: 500, label: "$500 + SPIN", type: "cash" },
  { val: 2000, label: "$2,000", type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", type: "whammy" },
  { val: 1500, label: "$1,500", type: "cash" },
  { val: 750, label: "$750 + SPIN", type: "cash" },
  { val: 3000, label: "$3,000", type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", type: "whammy" },
  { val: 2500, label: "$2,500", type: "cash" },
  { val: 1200, label: "$1,200", type: "cash" },
  { val: 5000, label: "$5,000 + SPIN", type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", type: "whammy" },
  { val: 4000, label: "$4,000", type: "cash" },
  { val: 800, label: "$800 + SPIN", type: "cash" },
  { val: 1750, label: "$1,750", type: "cash" },
  { val: "WHAMMY", label: "💥 WHAMMY!", type: "whammy" },
  { val: 3500, label: "$3,500", type: "cash" },
  { val: 1000, label: "$1,000 + SPIN", type: "cash" }
];

class WhammySpectator {
  constructor() {
    this.broadcast = new BroadcastChannel('whammy_stage_broadcast');
    
    this.whammyGridTv = document.getElementById('whammy-grid-tv');

    this.p1NameTv = document.getElementById('p1-name-tv');
    this.p2NameTv = document.getElementById('p2-name-tv');
    this.p3NameTv = document.getElementById('p3-name-tv');

    this.p1CashTv = document.getElementById('p1-cash-tv');
    this.p2CashTv = document.getElementById('p2-cash-tv');
    this.p3CashTv = document.getElementById('p3-cash-tv');

    this.p1SpinsTv = document.getElementById('p1-spins-tv');
    this.p2SpinsTv = document.getElementById('p2-spins-tv');
    this.p3SpinsTv = document.getElementById('p3-spins-tv');

    this.p1WhammiesTv = document.getElementById('p1-whammies-tv');
    this.p2WhammiesTv = document.getElementById('p2-whammies-tv');
    this.p3WhammiesTv = document.getElementById('p3-whammies-tv');

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
      if (e.data.type === 'SYNC_WHAMMY_STATE') {
        this.renderState(e.data.state);
      }
    };

    try {
      const saved = localStorage.getItem('whammy_last_state');
      if (saved) this.renderState(JSON.parse(saved));
    } catch (err) {}
  }

  renderState(state) {
    if (!state) return;

    if (this.p1NameTv) this.p1NameTv.textContent = state.p1Name || "CONTESTANT 1";
    if (this.p2NameTv) this.p2NameTv.textContent = state.p2Name || "CONTESTANT 2";
    if (this.p3NameTv) this.p3NameTv.textContent = state.p3Name || "CONTESTANT 3";

    if (this.p1CashTv) this.p1CashTv.textContent = `$${state.p1Cash || 0}`;
    if (this.p2CashTv) this.p2CashTv.textContent = `$${state.p2Cash || 0}`;
    if (this.p3CashTv) this.p3CashTv.textContent = `$${state.p3Cash || 0}`;

    if (this.p1SpinsTv) this.p1SpinsTv.textContent = state.p1Spins || 0;
    if (this.p2SpinsTv) this.p2SpinsTv.textContent = state.p2Spins || 0;
    if (this.p3SpinsTv) this.p3SpinsTv.textContent = state.p3Spins || 0;

    if (this.p1WhammiesTv) this.p1WhammiesTv.textContent = state.p1Whammies || 0;
    if (this.p2WhammiesTv) this.p2WhammiesTv.textContent = state.p2Whammies || 0;
    if (this.p3WhammiesTv) this.p3WhammiesTv.textContent = state.p3Whammies || 0;

    this.podiums.forEach((pod, idx) => {
      if (pod) {
        if (idx === state.activeTurn) pod.classList.add('active-turn');
        else pod.classList.remove('active-turn');
      }
    });

    if (this.whammyGridTv) {
      this.whammyGridTv.innerHTML = '';
      WHAMMY_BOARD_TILES_TV.forEach((tileData, idx) => {
        const tile = document.createElement('div');
        tile.className = `whammy-tile-tv ${idx === state.activeTileIdx ? 'active-light' : ''}`;
        tile.textContent = tileData.label;
        this.whammyGridTv.appendChild(tile);
      });

      const center = document.createElement('div');
      center.className = 'whammy-tile-tv inner-center-tv';
      center.innerHTML = `
        <div style="font-size: 2.2rem; color: #fef08a; font-family: var(--font-display);">
          ${state.isCycling ? '⚡ PRESS YOUR LUCK!' : '🎯 LANDED ON: ' + WHAMMY_BOARD_TILES_TV[state.activeTileIdx].label}
        </div>
      `;
      this.whammyGridTv.appendChild(center);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WhammySpectator();
});
