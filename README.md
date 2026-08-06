# ⚡ Stellar Gasless Protocol Console (`gasless-relayer-dashboard`)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)

Official Admin Console SPA UI for **Stellar Gasless Network**, allowing dApp developers to manage Paymaster gas pools, issue API Keys, track relayer latency, and audit meta-transaction relays on Stellar & Soroban.

---

## 🎨 Console Modules & Features

* **Overview Dashboard**: Telemetry displaying total relayed transactions, sponsored gas budget in XLM, active paymaster vaults, and relayer response latency.
* **Soroban Meta-Tx Relay Engine**: Simulator demonstrating 0-XLM fee-bump transaction wrapping and Horizon RPC broadcast.
* **Paymaster Pool Manager**: Deposit modal for topping up XLM and SAC token gas reserves.
* **API Key Gateway Portal**: Create, restrict, and monitor dApp API keys consuming `@stellar-gasless/sdk`.
* **Relayed Transaction Inspector**: Transaction audit table with status badges and StellarExpert explorer links.

---

## 🛠️ Running Locally

```bash
npm start
```
Or open [`index.html`](./index.html) directly in any web browser!
