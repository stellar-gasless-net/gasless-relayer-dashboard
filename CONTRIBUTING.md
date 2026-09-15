# Contributing to Gasless Relayer Developer Dashboard (`gasless-relayer-dashboard`)

Thank you for helping build **`gasless-relayer-dashboard`**! 🖥️

This repository houses the **Developer Portal & Admin Console SPA UI** for managing Paymaster gas reserves, issuing dApp API Keys, and monitoring meta-transaction relays.

---

## 📋 Table of Contents

1. [Local Setup](#-local-setup)
2. [UI Design System & Styling Tokens](#-ui-design-system--styling-tokens)
3. [Contributor Guidelines](#-contributor-guidelines)
4. [Accessibility & Testing](#-accessibility--testing)

---

## 🛠️ Local Setup

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/gasless-relayer-dashboard.git
   cd gasless-relayer-dashboard
   ```

2. **Serve the Application**:
   ```bash
   npx serve .
   ```
   Or open [`index.html`](./index.html) directly in your browser.

---

## 🎨 UI Design System & Styling Tokens

We enforce a sleek **Glassmorphism Dark Mode** UI design system:
- Primary Color: `#6366f1` (Indigo Glow)
- Secondary Color: `#a855f7` (Purple Glow)
- Panel Background: `rgba(20, 28, 46, 0.75)` with `backdrop-filter: blur(12px)`
- Borders: `rgba(255, 255, 255, 0.1)`

---

## 🤝 Contributor Guidelines

### Step 1: Find an Issue
Browse [open issues](https://github.com/stellar-gasless-net/gasless-relayer-dashboard/issues) and pick one that matches your experience level:
- [`good first issue`](https://github.com/stellar-gasless-net/gasless-relayer-dashboard/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22): small UI fixes, copy changes, accessibility gaps.
- `intermediate`: new dashboard views or live-data wiring.
- `advanced`: changes touching the relayer's API surface.

### Step 2: Branch & Implement
```bash
git checkout -b fix/issue-8-mobile-nav-overflow
```
Stick to the design tokens above — don't introduce a second color system or styling approach.

### Step 3: Verify & Open a PR
Run the check in [Accessibility & Testing](#-accessibility--testing) below, then open a PR referencing the issue (e.g. `Closes #8`).

---

## ♿ Accessibility & Testing

- Ensure interactive elements are keyboard reachable (`Tab` & `Enter` navigation).
- Include `aria-label` attributes for icon-only buttons.
- Maintain responsive layouts across desktop and mobile viewports.
- Before opening a PR, run the same check CI runs: `bash scripts/check-source-artifacts.sh` — scans for accidentally committed secrets or leftover local build artifacts. See `.github/workflows/ci.yml`.
