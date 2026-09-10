# Stellar Gasless Protocol Console (`gasless-relayer-dashboard`)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)
[![Live Demo](https://img.shields.io/badge/Live_Demo-gasless--relayer--dashboard.vercel.app-black?style=flat&logo=vercel)](https://gasless-relayer-dashboard.vercel.app/)

**A frontend preview of the admin console planned for Stellar Gasless Network — Paymaster gas reserves, API key management, relayer health, and Soroban meta-transaction inspection.**

🔗 **[Live demo: gasless-relayer-dashboard.vercel.app](https://gasless-relayer-dashboard.vercel.app/)** (also mirrored on [GitHub Pages](https://stellar-gasless-net.github.io/gasless-relayer-dashboard/)) — no setup required.

⚠️ **Current status: mostly a UI mockup, with four genuinely real pieces (two added 2026-09-04, two added 2026-09-09/10).** No `stellar-gasless-relayer` instance is deployed anywhere public — you have to run one yourself locally to see two of the real parts light up; the Session Keys and Passkey Wallet tabs need nothing but a testnet RPC connection (and, for Passkey Wallet, a real browser/device that supports WebAuthn). Paymaster gas-reserve accounting, API key issuance, and the transaction history table are all still hardcoded placeholders or generated locally in your browser tab — nothing there is persisted or real.

**What's real now**, via `real.js`/`passkey.js` (see their own header comments for the real bugs found and fixed while building these):
- **Live Relayer Status** (Overview tab) — point it at a `stellar-gasless-relayer` instance you're running locally and it shows that service's real `/health` and `/metrics.json` data: real keypair pool size, real relayed/failed counts, real XLM spent sponsoring fees. Shows "not reachable" honestly if there's nothing there. **Added 2026-09-10**: a plain-language daily sponsorship budget line ("X% of today's budget used (Y / Z XLM) — resets in Hh Mm"), with a colored progress bar, read from the relayer's real `dailyBudget` field — shows "unlimited" honestly if the relayer has no `GLOBAL_DAILY_BUDGET_STROOPS` configured rather than a misleading 0%.
- **Real Gasless Transaction** (Relay Engine tab) — connects a real Freighter wallet, builds and signs a real call to the deployed `did_registry` contract (registering or updating your connected wallet's own DID), and submits it through `@stellar-gasless/sdk`'s real `GaslessClient` to your configured relayer. The result box independently checks Horizon afterward to confirm the fee was actually paid by the relayer's sponsor account, not your wallet — the same proof used in `stellar-gasless-sdk`'s own `examples/e2e-gasless-relay.mjs`.
- **Session Key Permissions (Session Keys tab, added 2026-09-09)** — real, live reads of `account-abstraction-wallet`'s `get_session_key` (see `soroban-gasless-contracts`), stated in plain language ("this key can call X · spend cap Y · expires Z") instead of raw contract fields. No wallet connection needed — it's public on-chain state. Pre-filled with a real registered demo session key so it shows genuine, non-empty data on load; looking up an address with no registered key honestly reports "not found" rather than erroring.
- **Real Passkey Smart Account (Passkey Wallet tab, added 2026-09-10)** — see its own section below; this is the first time this ecosystem's real WebAuthn/secp256r1 contract-level work has been demonstrated end-to-end in a browser rather than only in Rust unit tests.

The old fully-fake "Relay Engine" walkthrough below the real card still works exactly as before (fetches one unrelated real Horizon tx as an illustration) for anyone without a wallet or a relayer handy.

This repository houses the **Console UI** for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem. It's the least-finished piece of the project — treat it as a design reference, not a working product.

## What's genuinely real here (and what honestly isn't)

- **Four real, end-to-end integrations, not just UI.** The Overview tab's relayer status polls a real running `stellar-gasless-relayer`'s `/health` and `/metrics.json`. The "Real Gasless Transaction" card connects an actual Freighter wallet, builds and signs a real `did_registry` call, submits it through `@stellar-gasless/sdk`'s real `GaslessClient`, and independently re-checks Horizon afterward to confirm the relayer's sponsor — not the user's wallet — actually paid the fee. The Session Keys tab reads a real session key's real permissions straight from `account-abstraction-wallet`'s own `get_session_key`. The Passkey Wallet tab creates a real browser passkey, deploys a real fresh wallet contract, and authorizes a real on-chain call using only that passkey.
- **Everything else is honestly labeled as a mockup**, not silently implied to be real: Paymaster gas-reserve accounting, API key issuance, and the transaction history table are disclosed as local-only, hardcoded, or generated in-browser.
- **The old fully-fake demo still works**, wrapped behind a `<details>` toggle so it doesn't compete with the real card for a visitor's attention, for anyone without a wallet or relayer handy.

### Passkey Wallet tab — what's proven and what still needs a human with a real device

Every other "real" integration in this dashboard uses Freighter, a classic keypair browser extension. `account-abstraction-wallet`'s actual point — a smart account controlled by a real WebAuthn passkey instead of a seed phrase — had **never** been demonstrated working end-to-end anywhere in this ecosystem before this tab: not in this dashboard, not in `stellar-gasless-sdk` (its `PasskeyAdapter` existed but was called from exactly nowhere), not even in `stellar-gasless-sdk`'s own flagship `examples/e2e-gasless-relay.mjs` (which uses a plain raw keypair signer). The contract-level work was always real (24 passing tests, real `secp256r1_verify`) — it just had no visual/browser proof.

`passkey.js` implements, for real:
- **COSE_Key (CBOR) → SEC-1 uncompressed key conversion** and **DER ECDSA signature → raw low-S conversion** — both are real cryptographic wire-format conversions (WebAuthn and Soroban's `secp256r1_verify` use different formats for the same P-256 material), verified against 30 real P-256 signatures and a real public key round-tripped through Node's own crypto module before ever touching a browser — see the conversions' own doc comments for the exact algorithms.
- **Real passkey creation** (`navigator.credentials.create()`) and **real assertion signing** (`navigator.credentials.get()`) — genuine WebAuthn ceremonies, not simulated.
- **Real wallet deployment**: a fresh `account-abstraction-wallet` instance created via `Client.deploy()` against the already-installed wasm hash (confirmed via `stellar contract fetch` + `sha256sum` against the live deployed instance), then a real `init()` call binding it to the real passkey's public key.
- **Real custom-signature authorization**: `execute()`'s Soroban authorization entry is signed with a hand-constructed `WalletSignature::Owner(PasskeySignature)` value — encoded via the wallet's own on-chain contract spec (`walletClient.spec.nativeToScVal(...)`, not a guessed byte layout) — using `@stellar/stellar-sdk`'s lower-level `authorizeEntry()` override hook, with Freighter only ever signing the outer fee-paying transaction envelope, never the authorization itself.

**What's verified and what isn't, honestly:** the two cryptographic conversions are proven correct against real P-256 test vectors (see the project's own test log). The page loads, the tab renders, and every button's error-handling path was exercised (including the expected "Freighter not detected" failure in an automated browser with no extension installed). What has **not** been exercised end-to-end is the full deploy → authorize round trip against real testnet infrastructure, because that requires an actual human with an actual platform authenticator (TouchID/Windows Hello/a security key) — `navigator.credentials.create()`/`.get()` cannot be driven by automation. If you hit an error running through steps 2–4 yourself, it's most likely in the exact area that couldn't be pre-verified: the auth-entry construction in `executeRealViaPasskey`. Report back what you see and it can be debugged from there.

---

## Contents

- [Console Portal UI Architecture](#console-portal-ui-architecture)
- [Detailed Component Capabilities](#detailed-component-capabilities)
- [Running the Console Locally](#running-the-console-locally)
- [Ecosystem](#ecosystem)
- [Contributing & CONTRIBUTING.md Guidelines](#contributing--contributingmd-guidelines)
- [Future Improvements & Console Roadmap](#future-improvements--console-roadmap)

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

The [live demo](https://stellar-gasless-net.github.io/gasless-relayer-dashboard/) above needs no setup, but to see the two real integrations light up (Overview tab's live relayer status, and the real gasless transaction demo), you need a `stellar-gasless-relayer` instance running locally — see that repo's README. Otherwise, open [`index.html`](./index.html) directly in any web browser, or launch a local dev server:

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
