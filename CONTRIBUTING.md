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

## ♿ Accessibility & Testing

- Ensure interactive elements are keyboard reachable (`Tab` & `Enter` navigation).
- Include `aria-label` attributes for icon-only buttons.
- Maintain responsive layouts across desktop and mobile viewports.
