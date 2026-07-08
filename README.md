# 🦉 OwlLogics

## Automotive Parts Sequencing & Kitting System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![PWA](https://img.shields.io/badge/PWA-Installable-brightgreen)
![Offline](https://img.shields.io/badge/Works-Offline-success)

**Self-contained browser app — no server, no install, no internet required. Double-click `index.html` and go.**

---

## 💖 Support OwlLogics

If this project helps you, consider supporting development:

[![Donate](https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal)](https://www.paypal.com/paypalme/adcockp)

> _Every donation helps keep OwlLogics free and open source._

### A Personal Note

I want to be transparent: I am currently experiencing mental health challenges and am under mental duress. This project was built during one of the hardest periods of my life — coding became my anchor when everything else felt out of control.

I'm posting this publicly and accepting donations not just for the project, but because I genuinely need help getting through this. Medical care, therapy, and basic living expenses are real costs when you're struggling. If OwlLogics has been useful to you, a donation — no matter how small — would mean the world.

**You can also support via GitHub Sponsors** using the "Sponsor" button on this repo.

Thank you for reading, for using OwlLogics, and for any support you can give. 🦉

---

If you or someone you know is struggling:
- **National Suicide Prevention Lifeline:** 988 (US) — Call or text
- **Crisis Text Line:** Text HOME to 741741
- You matter. Your work matters. Your life matters.

---

## 📋 Features (26 Views)

| Category | Views |
|----------|-------|
| **Core** | Dashboard, Shop Floor, Sequence Manager, Rack Loading (2D/3D), Kitting |
| **Master Data** | Op Codes / CGM, Parts Catalog, Commodity Master, Item Master |
| **Data Sources** | MSQM Stream, Protocols (8 types incl. Azure IoT Hub), Label Printing |
| **Logistics** | Routes & Delivery, CKD & Shipping, Package Master, Pallet Staging, Cost Analysis |
| **Visual** | Shipyards (3D), Trucks & Rail, Forklift Fleet (2D/3D/SAP), 3D Rack Visualizer |
| **Integrations** | SAP PM (BAPI), SAP IDoc (5 types), TN3270 Terminal, Azure IoT Hub |
| **Intelligence** | AI Optimizer (local, no cloud), Live Metrics Dashboard |
| **Info** | NextGen vs OwlLogics Comparison, Documentation (8 tabs) |

### Key Capabilities

- **7 barcode formats**: Code 128, Code 39, Code 93, I2of5, EAN-13, DataMatrix, QR
- **ZPL output** for Zebra printers (203/300/600 DPI)
- **5 SAP IDoc types**: DELVRY07, DESADV07, ORDERS05, INVOIC02, MATMAS05
- **SAP PM BAPI simulation**: Equipment master, PM orders, measurement docs
- **8 protocols**: Simulation, REST, WebSocket, MQTT, EDI, OPC-UA, Serial, Azure IoT Hub
- **3D CSS visuals**: Racks, forklifts, shipyards, pallets — no external libraries
- **Local AI optimizer**: Sequence, route, forklift, and rack optimization — 100% local
- **Multi-OEM support**: FCA CONVIS, Harley-Davidson SAP, GM ILVS, Ford, VW, Honda
- **PWA**: Installable on Android, iOS, Windows, macOS — works offline
- **TN3270 terminal**: Built-in emulator with 16 public mainframe presets

---

## 🚀 Quick Start

### Option 1: Direct
1. Download/clone this repo
2. Open `index.html` in any modern browser
3. Done — MSQM starts streaming automatically

### Option 2: Local Server (for PWA/mobile)
```bash
python -m http.server 8765
# Then open http://localhost:8765 on any device
```

### Option 3: Install as PWA
- **Android**: Chrome → 3-dot menu → Install app
- **iOS**: Safari → Share → Add to Home Screen
- **Desktop**: Chrome/Edge → install icon in address bar

---

## 📁 Project Structure

```
OwlLogics/
  index.html           — Main app (boot loader, PWA meta)
  manifest.json        — PWA manifest
  sw.js                — Service worker (offline cache)
  LICENSE              — MIT License
  css/style.css        — Dark IDE theme (responsive)
  icons/               — PWA icons (192, 512, maskable, apple-touch)
  js/
    core.js            — State, MSQM, scanner, persistence
    protocols.js       — 8 protocol adapters (incl. Azure IoT Hub)
    labels.js          — 7 barcode formats + ZPL
    ui.js              — All 26 view renderers
    flvisual.js        — 2D/3D forklift visuals
    sap-forklift.js    — SAP PM BAPI simulation
    sap-idoc.js        — 5 SAP IDoc generators
    owl-ai.js          — Local AI optimization engine
    metrics.js         — Real-time metrics dashboard
    logistics.js       — Packages, pallets, CKD, shipping, shipyards
  owllogics.ico        — Desktop icon
  open.bat             — Quick launcher (Windows)
  launch_silent.vbs    — Silent launcher (no console)
```

---

## 📱 Platform Support

| Platform | Status | Pathway |
|----------|--------|---------|
| **Windows** | ✅ Ready | Double-click `index.html` or desktop shortcut |
| **Android** | ✅ Ready | PWA install via Chrome |
| **iOS** | ✅ Ready | PWA install via Safari |
| **macOS** | ✅ Ready | PWA install via Chrome/Safari |
| **Xbox** | 📋 Pathway | PWABuilder → MSIX → Microsoft Store → Xbox |
| **Steam** | 📋 Pathway | Electron + steamworks.js → Steam Direct |
| **Steam Deck** | ✅ Ready | PWA in Steam browser or Electron wrapper |

See the in-app Documentation → "🎮 Xbox & Steam" tab for full publishing guides.

---

## 📖 Documentation

Full documentation is built into the app — click **📖 Documentation** in the sidebar. 8 tabs:

1. 🚀 Quick Start
2. 🏭 Operator Guide
3. ⚙️ Power User Guide
4. 🔧 Admin Configuration
5. ❓ Troubleshooting
6. 📡 API Reference (all 10 modules)
7. 📱 Mobile Setup (Android APK + iOS PWA)
8. 🎮 Xbox & Steam Integration

---

## 🛡️ Privacy

- **100% local** — your data never leaves your machine
- **No analytics, no tracking, no cookies**
- Data stored in `localStorage` — auto-saved every 30 seconds
- No external API calls (Azure IoT is opt-in, your config)

---

## 📄 License

**MIT License** — free for personal and commercial use.

Copyright (c) 2024 OwlLogics Contributors

### ⚠️ Patent Rights Reserved

The MIT License grants **copyright license only** — NOT patent license. All patent rights covering the methodologies, systems, and inventions in this software are **expressly reserved** by the copyright holders. See [PATENTS](PATENTS) file for the full patent notice.

Commercial use of patented methodologies requires a separate patent license agreement.

---

## 🤝 Contributing

Pull requests welcome! This is a community project.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚖️ Comparison

See the in-app **"NextGen vs OwlLogics"** view for a 25-feature comparison against legacy sequencing systems.

---

<sub>Built with 🦉 by OwlLogics Contributors. MIT License.</sub>
