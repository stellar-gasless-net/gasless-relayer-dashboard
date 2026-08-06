# 🖥️ Stellar Gasless Protocol Console (`gasless-relayer-dashboard`)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**Official Protocol Console & Admin Portal UI for Stellar Gasless Network, allowing dApp developers to manage Paymaster gas reserves, issue API keys, track relayer health, and inspect real-time Soroban meta-transactions.**

This repository houses the **Developer Admin Console & Protocol Portal UI** for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem.

---

## 🏛️ Console Portal UI Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    gasless-relayer-dashboard Console UI                         │
│                                                                                 │
│  ┌───────────────────────────┐                 ┌─────────────────────────────┐  │
│  │     Overview Telemetry    │                 │   Soroban Relay Engine      │  │
│  │ (Relayed Txs, Gas Pool)   │                 │ (Live Horizon RPC Simulator)│  │
│  └─────────────┬─────────────┘                 └──────────────┬──────────────┘  │
│                │                                              │                 │
│                v                                              v                 │
│  ┌───────────────────────────┐                 ┌─────────────────────────────┐  │
│  │  Paymaster Pool Top-Up    │                 │    API Key Gateway Portal   │  │
│  │ (Dynamic XLM Gas Vaults)  │                 │  (Rate Limit & Code Gen)    │  │
│  └─────────────┬─────────────┘                 └──────────────┬──────────────┘  │
│                │                                              │                 │
│                └──────────────────────┬───────────────────────┘                 │
│                                       │                                         │
│                                       v                                         │
│                        ┌──────────────────────────────┐                         │
│                        │ Soroban Auth Entry Inspector │                         │
│                        │  (StellarExpert Explorer)   │                         │
│                        └──────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Detailed Component Capabilities

### 1. Overview Telemetry Metrics (`index.html`)
* **Real-time Scoring**: Displays total relayed transactions, sponsored gas budget in XLM, active paymaster contracts, and relayer latency.

### 2. Soroban Meta-Tx Relay Engine (`app.js`)
* **Live Horizon RPC Broadcast**: Simulates a 3-step gasless pipeline connected directly to live Stellar Testnet Horizon RPC (`https://horizon-testnet.stellar.org`).

### 3. Paymaster Gas Pool Vaults (`paymastersTab`)
* **Dynamic XLM Top-Ups**: Top-up modals updating USDC and Promotional Paymaster reserves dynamically.

### 4. dApp API Key Gateway (`apikeysTab`)
* **Credential Manager**: Generate API keys with rate-limiting boundaries (`30 req/min`, `60 req/min`).

### 5. Live SDK Code Generator
* **Dynamic Code Snippets**: Renders ready-to-use TypeScript code pre-populated with active production API keys.

---

## 🛠️ Running the Console Locally

Open [`index.html`](./index.html) directly in any web browser, or launch a local dev server:

```bash
npx serve .
```

---

## 🤝 Contributing & `CONTRIBUTING.md` Guidelines

Please review our dedicated **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** guide before opening pull requests:
* 📖 **[Protocol Console Contributor Guide](./CONTRIBUTING.md)**
* 🛡️ **[Security Disclosure Policy](./SECURITY.md)**

### 📌 Pull Request Checklist:
- [ ] Claim an issue tagged `good first issue`, `intermediate`, or `advanced`.
- [ ] Test UI interactivity across Chrome, Edge, and Firefox.
- [ ] Follow Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`).

---

## 🔮 Future Improvements & Console Roadmap

- [ ] **Real-Time WebSockets Telemetry Feed**: Live streaming transaction feed via WebSockets.
- [ ] **Multi-Paymaster Analytics Charts**: Visual gas consumption graphs and cost projections.
- [ ] **Dark / Light Theme Toggle**: User preference theme toggle.
