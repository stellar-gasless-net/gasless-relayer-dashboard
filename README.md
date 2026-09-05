# Stellar Gasless Protocol Console (`gasless-relayer-dashboard`)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**A frontend preview of the admin console planned for Stellar Gasless Network — Paymaster gas reserves, API key management, relayer health, and Soroban meta-transaction inspection.**

⚠️ **Current status: mostly a UI mockup, with two genuinely real pieces added 2026-09-04.** No `stellar-gasless-relayer` instance is deployed anywhere public — you have to run one yourself locally to see the real parts light up. Paymaster gas-reserve accounting, API key issuance, and the transaction history table are all still hardcoded placeholders or generated locally in your browser tab — nothing there is persisted or real.

**What's real now**, via `real.js` (see its own header comment for two ESM/CDN interop bugs found and fixed while building this):
- **Live Relayer Status** (Overview tab) — point it at a `stellar-gasless-relayer` instance you're running locally and it shows that service's real `/health` and `/metrics.json` data: real keypair pool size, real relayed/failed counts, real XLM spent sponsoring fees. Shows "not reachable" honestly if there's nothing there.
- **Real Gasless Transaction** (Relay Engine tab) — connects a real Freighter wallet, builds and signs a real call to the deployed `did_registry` contract (registering or updating your connected wallet's own DID), and submits it through `@stellar-gasless/sdk`'s real `GaslessClient` to your configured relayer. The result box independently checks Horizon afterward to confirm the fee was actually paid by the relayer's sponsor account, not your wallet — the same proof used in `stellar-gasless-sdk`'s own `examples/e2e-gasless-relay.mjs`.

The old fully-fake "Relay Engine" walkthrough below the real card still works exactly as before (fetches one unrelated real Horizon tx as an illustration) for anyone without a wallet or a relayer handy.

This repository houses the **Console UI** for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem. It's the least-finished piece of the project — treat it as a design reference, not a working product.

## What's genuinely real here (and what honestly isn't)

- **Two real, end-to-end integrations, not just UI.** The Overview tab's relayer status polls a real running `stellar-gasless-relayer`'s `/health` and `/metrics.json`. The "Real Gasless Transaction" card connects an actual Freighter wallet, builds and signs a real `did_registry` call, submits it through `@stellar-gasless/sdk`'s real `GaslessClient`, and independently re-checks Horizon afterward to confirm the relayer's sponsor — not the user's wallet — actually paid the fee.
- **Everything else is honestly labeled as a mockup**, not silently implied to be real: Paymaster gas-reserve accounting, API key issuance, and the transaction history table are disclosed as local-only, hardcoded, or generated in-browser.
- **The old fully-fake demo still works**, wrapped behind a `<details>` toggle so it doesn't compete with the real card for a visitor's attention, for anyone without a wallet or relayer handy.

---

## Console Portal UI Architecture

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
│                        │  (StellarExpert Explorer)    │                         │
│                        └──────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Capabilities

### 1. Overview Metrics (`index.html`)
* Shows what a relayed-transaction / gas-budget / paymaster overview would look like. All values start at zero and only change from your own clicks in this tab — they are not pulled from anywhere real.

### 2. Relay Walkthrough (`app.js`)
* Walks through the 3-step gasless flow as a UI mock. Makes one real, read-only fetch to Stellar Testnet Horizon RPC (`https://horizon-testnet.stellar.org`) to display a genuine recent tx hash as an example — that fetched transaction was not produced by this app.

### 3. Paymaster Gas Pool Vaults (`paymastersTab`)
* Local-only top-up modal that updates on-screen sample balances. No XLM moves anywhere.

### 4. dApp API Key UI (`apikeysTab`)
* Generates a demo key string client-side for UI preview purposes. Not a real, working credential — there's no backend to authenticate it against.

### 5. SDK Code Snippet Example
* Renders example TypeScript integration code with placeholder values you fill in once a relayer is actually deployed.

---

## Running the Console Locally

Open [`index.html`](./index.html) directly in any web browser, or launch a local dev server:

```bash
npx serve .
```

---

## Ecosystem

Part of **stellar-gasless-net**'s gasless meta-transaction protocol suite, alongside:
- [`soroban-gasless-contracts`](https://github.com/stellar-gasless-net/soroban-gasless-contracts) — the on-chain WASM contracts (trusted forwarder, paymasters, smart account wallet)
- [`stellar-gasless-relayer`](https://github.com/stellar-gasless-net/stellar-gasless-relayer) — the backend service this console's Overview tab polls and the Relay Engine tab submits through
- [`stellar-gasless-sdk`](https://github.com/stellar-gasless-net/stellar-gasless-sdk) — the TypeScript SDK this console's real gasless transaction demo actually uses

The real demo's target contract, `did_registry`, is a cross-org dependency: it's deployed from [`stellar-zkident`](https://github.com/stellar-zklab/stellar-zkident) in the separate `stellar-zklab` org, chosen simply because it was a real, already-deployed contract with a simple call shape — not because these two ecosystems are otherwise related.

---

## Contributing & `CONTRIBUTING.md` Guidelines

Please review our dedicated **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** guide before opening pull requests:
* **[Protocol Console Contributor Guide](./CONTRIBUTING.md)**
* **[Security Disclosure Policy](./SECURITY.md)**

### Pull Request Checklist:
- [ ] Claim an issue tagged `good first issue`, `intermediate`, or `advanced`.
- [ ] Test UI interactivity across Chrome, Edge, and Firefox.
- [ ] Follow Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`).

---

## Future Improvements & Console Roadmap

- [ ] **Real-Time WebSockets Telemetry Feed**: Live streaming transaction feed via WebSockets.
- [ ] **Multi-Paymaster Analytics Charts**: Visual gas consumption graphs and cost projections.
- [ ] **Dark / Light Theme Toggle**: User preference theme toggle.
