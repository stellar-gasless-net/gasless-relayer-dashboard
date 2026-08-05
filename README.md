# ⚡ Stellar Gasless Developer Portal & Dashboard (`gasless-relayer-dashboard`)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)

Interactive Developer Portal & Admin Management Console for **Stellar Gasless Network**, allowing dApp developers to manage Paymaster gas pools, issue API Keys, track relayer latency, and audit meta-transaction relays on Stellar & Soroban.

---

## 🎨 Feature Overview

* **Overview Dashboard**: High-level telemetry displaying total relayed transactions, sponsored gas budget in XLM, active paymaster vaults, and relayer latency.
* **Paymaster Pool Manager**: Modal interface allowing developers to top up XLM and SAC token gas pools directly via browser wallets.
* **API Key Management Portal**: Generate, restrict, and monitor API keys for frontend apps consuming `@stellar-gasless/sdk`.
* **Live Relayed Transaction Inspector**: Real-time transaction audit table with status badges and block explorer links.
* **Single-Page Application (SPA) Navigation**: Fast tab-switching without page reloads.

---

## 🛠️ Running Locally

```bash
npm start
```
Or simply open [`index.html`](./index.html) directly in any modern browser!
