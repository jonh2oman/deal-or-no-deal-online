# 🧳 Deal or No Deal - Live Stage & Spectator Display Engine

> A modern, customizable, dual-screen **Deal or No Deal** live stage game show application designed for festivals, corporate events, fundraisers, and live party entertainment.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/Frontend-HTML5%20%2F%20Vanilla%20JS-orange.svg)
![CSS3](https://img.shields.io/badge/Styling-Glassmorphism%20%26%20Vanilla%20CSS-blueviolet.svg)
![Real-Time Sync](https://img.shields.io/badge/Sync-Triple--Channel%20Real--Time%20IPC-brightgreen.svg)

---

## 🌐 Live Online Demos

* 🎛️ **Host Control Panel:** [https://jonh2oman.github.io/deal-or-no-deal-online/](https://jonh2oman.github.io/deal-or-no-deal-online/)
* 📺 **Spectator Display (TV / Projector View):** [https://jonh2oman.github.io/deal-or-no-deal-online/spectator.html](https://jonh2oman.github.io/deal-or-no-deal-online/spectator.html)

---

## ✨ Features & Highlights

### 🎛️ 1. Host Stage Operations Control Panel (`index.html`)
* **Square Control Button Matrix:** High-visibility square control buttons (`[ 1 ]`, `[ 2 ]` ... `[ 15 ]`) for swift, error-free case picking on stage.
* **Crossed-Off Prize Tracking:** Real-time strikethrough updates on both low and high prize columns as briefcases are opened.
* **Host Teleprompter & Comedy Banter Engine:** Prominent top teleprompter console with dynamic, event-driven comedic quotes and audience banter.
* **Banker Offer Staging ("OFFER INCOMING..."):** Staging holding screen keeps the offer secret on the spectator display until the host clicks `📡 PUSH OFFER TO SPECTATOR SCREEN`.
* **Suggested vs. Custom Host Offers:** Choose between algorithmic Banker expected-value offers or input custom cash amounts and physical bonus items (e.g., *"Lawn Chair + Hoodie"*).

### 📺 2. Casted Spectator TV Window (`spectator.html`)
* **3D Aluminum Briefcase Graphics:** Realistic 3D briefcases with chrome handles, latches, corner brackets, and metallic perspective flip animations.
* **Edge-to-Edge Fullscreen Layout:** Responsive 100vh stage graphics designed specifically for big-screen TVs, projectors, and secondary monitor casting.

### 👁️ 3. Host X-Ray Peek Mode
* Secret host toggle switch (`👁️ Host Peek ON / OFF`) that displays confidential gold prize preview badges (`👁️ $50`) on unopened host buttons.
* **100% Confidential:** Operates exclusively on the Host Control Panel—the Spectator Display remains completely sealed!

### 🎵 4. Stage Soundboard & Audio Engine
* **One-Touch Sound FX Console:** 8 quick-trigger buttons (`🎵 Reveal`, `📞 Ring`, `📡 Tension`, `🤝 Deal`, `🚫 No Deal`, `🏆 Fanfare`, `🎺 Theme`, `🛑 Silence`).
* **Single-Tab PA Audio Routing:** Host laptop audio is muted by default so sound effects play exclusively over the TV / venue PA speakers without double audio or echoing.

### 🎨 5. Visual & Atmospheric Stage Themes
* **3 High-End Color Themes:**
  * ✈️ **Runway Blue** (Classic deep navy, electric blue & silver briefcases)
  * 🌅 **Golden Sunset** (Rich gold, amber, mahogany & warm stage glow)
  * 📡 **Night Radar** (Tactical dark green radar grid & emerald neon highlights)
* **Dynamic Stage Lighting:** Animated dual swaying spotlight beams (`.stage-spotlight-left` & `.stage-spotlight-right`).
* **Synthesized Ambient Soundscapes:** Toggleable background jet cabin hums or radar pulse audio.

### ⚙️ 6. Customizable Event Branding & Prize Setup
* **Custom Event Branding:** Customize Main App Title, Sub-Title/Location, Event Tag (`DND-15`), and Banker Call Name directly in the settings modal.
* **Custom 15-Prize Setup:** Configure prize names and dollar values for any event type (Kids Rounds, Corporate Galas, VIP Finale Rounds).
* **LocalStorage Persistence:** All custom settings and prizes persist locally across sessions.

### 📡 7. Triple-Channel Real-Time Sync Engine
* Built with a multi-layered synchronization architecture (`BroadcastChannel` + native `storage` window events + 300ms heartbeat pulse) for sub-16ms, unshakeable state sync across dual monitors and browser tabs.

---

## 🚀 Getting Started Locally

No build tools or Node dependencies required! Simply clone and open `index.html` in your web browser:

```bash
# Clone the repository
git clone https://github.com/jonh2oman/deal-or-no-deal-online.git

# Navigate into the project folder
cd deal-or-no-deal-online

# Open index.html in your browser
open index.html
```

To run a dual-monitor live show:
1. Open `index.html` on your primary laptop screen (Host Control Panel).
2. Click **`📺 Spectator Mode`** on the top toolbar to open `spectator.html` in a separate window.
3. Drag the `spectator.html` window to your secondary display / TV / projector and press `F11` (or `Cmd+Shift+F`) for full screen.

---

## 📁 Repository Structure

```
deal-or-no-deal-online/
├── index.html        # Host Stage Operations Control Panel
├── spectator.html    # Casted Spectator Display (TV / Projector View)
├── styles.css        # Modern Glassmorphism & Aviation Design System
├── app.js            # Main Game Loop, State Machine & Broadcast Engine
├── spectator.js      # Real-Time Spectator Receiver & Stage Renderer
├── audio.js          # Hybrid MP3 & Web Audio API Sound Engine
├── banker.js         # Algorithmic In-Play Prize Offer Calculator
├── assets/           # Logos & Graphics
└── sounds/           # Stage MP3 Soundboard Tracks
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
