// Real integration module — everything in here talks to genuinely real, deployed things:
// a real stellar-gasless-relayer instance (you run it, see stellar-gasless-relayer/README.md),
// the real deployed did_registry contract on Stellar testnet (from stellar-zkident), and a
// real connected Freighter wallet. Nothing here is mocked. The rest of this dashboard
// (app.js) remains an honest UI mockup for pieces with no real backend yet (API key
// issuance, paymaster gas-reserve accounting) — this module only lights up the parts that
// are now genuinely real.
// Importing '@stellar/stellar-sdk' and its '/contract' subpath as two separate esm.sh
// module fetches loaded two independent copies of shared internals (stellar-base's ScVal
// etc.), breaking instanceof/.clone() checks across them (a real "Hm.clone is not a
// function" crash hit during development). Fixed by loading the package's own pre-bundled
// UMD build instead (see index.html's <script> tag before this one) — everything internally
// deduped into one bundle exposed as window.StellarSdk, sidestepping the ESM CDN hazard
// entirely. Freighter's own package has no such internal cross-refs, so it's fine via esm.sh.
const { Client: ContractClient } = window.StellarSdk.contract;
import freighter from 'https://esm.sh/@stellar/freighter-api@6.0.1';

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
// A real deployed contract from this ecosystem's stellar-zkident repo — see
// stellar-zkident/deployments/testnet.json. Used as the real target for the Relay Engine's
// gasless demo below.
const DID_REGISTRY_ID = 'CDGDZX4OGVCWEYANDRSWKSK6LLYOGFRJDZQNFNNYPTQPAKELKR4TXLB6';

async function fetchHorizonTx(hash) {
  const res = await fetch(`${HORIZON_URL}/transactions/${hash}`);
  if (!res.ok) throw new Error(`Horizon lookup failed: HTTP ${res.status}`);
  return res.json();
}

let connectedAddress = null;
let relayerUrl = localStorage.getItem('gasless_dashboard_relayer_url') || 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  wireRelayerConnection();
  wireRealWalletAndDemo();
  wireSessionKeys();
  wireVerifiedCredential();
});

// --- Verified Credential Check: real has_credential reads from stellar-zkident's -------
// credential_verifier. Mirrors @stellar-gasless/sdk's hasVerifiedCredential (src/utils/
// zkident.ts) — reimplemented here (not imported) because this dashboard is plain static
// HTML/JS with no bundler, and that package isn't published to a registry a <script> tag
// can reach. Keep this in sync with the SDK's own version if that algorithm ever changes.
const CREDENTIAL_VERIFIER_ID = 'CDLRSLHALMX6OU5IHWY6CKTROK3SYENEA75K6OWSZCPAW4EOTR2OZGSF';

async function hasVerifiedCredential(userAddress, credentialType) {
  const client = await ContractClient.from({
    contractId: CREDENTIAL_VERIFIER_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
  });
  const tx = await client.has_credential({ user: userAddress, credential_type: credentialType });
  return Boolean(tx.result);
}

function wireVerifiedCredential() {
  const btn = document.getElementById('verifiedCredentialCheckBtn');
  if (!btn) return;

  btn.addEventListener('click', runVerifiedCredentialCheck);
  // Real read, no wallet needed — check the pre-filled real demo subject on load so the
  // panel shows genuine non-empty data immediately.
  runVerifiedCredentialCheck();
}

async function runVerifiedCredentialCheck() {
  const box = document.getElementById('verifiedCredentialResultBox');
  const address = document.getElementById('verifiedCredentialAddressInput').value.trim();
  const credentialType = document.getElementById('verifiedCredentialTypeInput').value.trim();
  if (!address || !credentialType) {
    box.innerHTML = '<span style="color:#f87171;">Enter both an address and a credential type.</span>';
    return;
  }

  box.textContent = `Calling has_credential on credential_verifier for ${address.slice(0, 6)}...${address.slice(-4)}...`;
  try {
    const verified = await hasVerifiedCredential(address, credentialType);
    box.innerHTML = verified
      ? `<span style="color: var(--accent-green); font-weight:600;">&#9679; Verified — this address holds a real "${credentialType}" credential.</span>`
      : `<span style="color:#fbbf24;">Not verified — no matching credential record for this address. A real, honest "no," not an error.</span>`;
  } catch (err) {
    box.innerHTML = `<span style="color:#f87171;">Check failed: ${err.message}</span>`;
  }
}

// --- Session Keys tab: real get_session_key reads from account-abstraction-wallet -------

function formatStroopsAsXlm(stroops) {
  return (Number(stroops) / 1e7).toLocaleString(undefined, { maximumFractionDigits: 7 });
}

function wireSessionKeys() {
  const btn = document.getElementById('sessionKeyLookupBtn');
  if (!btn) return;

  const runLookup = () => lookupSessionKey();
  btn.addEventListener('click', runLookup);

  // Real read, no wallet needed — look up the pre-filled real demo session key on load so
  // the tab shows genuine data immediately instead of an empty box.
  runLookup();
}

async function lookupSessionKey() {
  const box = document.getElementById('sessionKeyResultBox');
  const walletId = document.getElementById('sessionKeyWalletInput').value.trim();
  const sessionKeyAddress = document.getElementById('sessionKeyAddressInput').value.trim();
  if (!walletId || !sessionKeyAddress) {
    box.innerHTML = '<span style="color:#f87171;">Enter both a wallet contract ID and a session key address.</span>';
    return;
  }

  box.textContent = `Reading get_session_key from ${walletId.slice(0, 6)}...${walletId.slice(-4)} on testnet...`;
  try {
    const client = await ContractClient.from({
      contractId: walletId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
    const tx = await client.get_session_key({ session_key: sessionKeyAddress });
    const data = tx.result;

    if (!data) {
      box.innerHTML = `<span style="color: #fbbf24;">No session key registered at this address on this wallet — a real, honest "not found," not an error.</span>`;
      return;
    }

    const functionsList = data.allowed_functions.map((f) => `<code>${f}</code>`).join(', ');
    const expiresDate = new Date(Number(data.expires_at) * 1000).toISOString();
    const capLine = data.spend_cap === null || data.spend_cap === undefined
      ? 'No spend cap (unlimited transfer amount, still scoped to the allowed contract/functions)'
      : `${formatStroopsAsXlm(data.spend_cap)} cumulative &middot; spent so far: ${formatStroopsAsXlm(data.spent)}`;

    box.innerHTML = `
      <div style="color: var(--accent-green); font-weight:600; margin-bottom:0.6rem;">&#9679; Real permissions, read live from the contract</div>
      <div style="margin-bottom:0.3rem;">This key can call: ${functionsList} <span style="color:var(--text-muted);">on</span> ${data.allowed_contract.slice(0, 6)}...${data.allowed_contract.slice(-4)}</div>
      <div style="margin-bottom:0.3rem;">Spend cap: ${capLine}</div>
      <div>Expires: ${expiresDate}</div>
    `;
  } catch (err) {
    box.innerHTML = `<span style="color:#f87171;">Lookup failed: ${err.message}</span>`;
  }
}

// --- Overview tab: real relayer health/metrics polling ---------------------------------

function wireRelayerConnection() {
  const card = document.getElementById('overviewTab');
  if (!card) return;

  const section = document.createElement('div');
  section.className = 'card';
  section.style.marginBottom = '2rem';
  section.innerHTML = `
    <h3 style="margin-top:0;">Live Relayer Status (Real)</h3>
    <p style="color: var(--text-muted); font-size: 0.9rem;">
      Not deployed publicly yet — point this at a <code>stellar-gasless-relayer</code> instance you're
      running locally (<code>npm run dev</code> in that repo) to see its real, live health and telemetry.
    </p>
    <div style="display:flex; gap:0.75rem; margin-bottom:1rem;">
      <input id="relayerUrlInput" class="input-field" style="flex:1;" value="${relayerUrl}" placeholder="http://localhost:3001">
      <button id="relayerConnectBtn" class="btn btn-primary">Connect</button>
    </div>
    <div id="relayerStatusBox" style="font-family: monospace; font-size: 0.85rem; color: var(--text-muted);">
      Not connected.
    </div>
  `;
  card.insertBefore(section, card.children[1] || null);

  document.getElementById('relayerConnectBtn').addEventListener('click', async () => {
    relayerUrl = document.getElementById('relayerUrlInput').value.trim() || 'http://localhost:3001';
    localStorage.setItem('gasless_dashboard_relayer_url', relayerUrl);
    await refreshRelayerStatus();
  });

  refreshRelayerStatus();
}

// Plain-language depletion line for the daily sponsorship budget, modeled on Superfluid
// Explorer's "Pred. liquidation: <date>" pattern — real numbers from the relayer's own
// /metrics.json (spend_budget.ts's tracked totals), not a client-side guess.
function formatDailyBudgetLine(dailyBudget) {
  if (!dailyBudget) return '';
  const { globalLimitStroops, globalSpentStroops, resetsAt } = dailyBudget;
  if (!globalLimitStroops || globalLimitStroops <= 0) {
    return `<div>sponsorship budget: <span style="color: var(--text-muted);">unlimited (no GLOBAL_DAILY_BUDGET_STROOPS configured)</span></div>`;
  }
  const pct = Math.min(100, (globalSpentStroops / globalLimitStroops) * 100);
  const spentXlm = (globalSpentStroops / 1e7).toFixed(4);
  const limitXlm = (globalLimitStroops / 1e7).toFixed(4);
  const msLeft = Math.max(0, new Date(resetsAt).getTime() - Date.now());
  const hoursLeft = Math.floor(msLeft / 3_600_000);
  const minsLeft = Math.floor((msLeft % 3_600_000) / 60_000);
  const barColor = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : 'var(--accent-green)';
  return `
    <div style="margin-top:0.4rem;">
      <div>today's sponsorship budget: ${pct.toFixed(1)}% used (${spentXlm} / ${limitXlm} XLM) &mdash; resets in ${hoursLeft}h ${minsLeft}m</div>
      <div style="width:100%; max-width:280px; height:6px; background:#1f2937; border-radius:3px; overflow:hidden; margin-top:0.3rem;">
        <div style="width:${pct}%; height:100%; background:${barColor};"></div>
      </div>
    </div>
  `;
}

async function refreshRelayerStatus() {
  const box = document.getElementById('relayerStatusBox');
  box.textContent = `Connecting to ${relayerUrl} ...`;
  try {
    const [healthRes, metricsRes] = await Promise.all([
      fetch(`${relayerUrl}/health`),
      fetch(`${relayerUrl}/metrics.json`),
    ]);
    const health = await healthRes.json();
    const metrics = await metricsRes.json();
    box.innerHTML = `
      <div style="color: var(--accent-green); font-weight:600; margin-bottom:0.5rem;">&#9679; Connected — real data from ${relayerUrl}</div>
      <div>service: ${health.service} v${health.version}</div>
      <div>sponsoring keypair pool size: ${health.keypairPoolSize}</div>
      <div>total relayed: ${metrics.totalRelayed} &nbsp; total failed: ${metrics.totalFailed}</div>
      <div>total XLM spent sponsoring fees: ${metrics.totalXlmSpent}</div>
      <div>uptime: ${metrics.uptimeSeconds}s</div>
      ${formatDailyBudgetLine(metrics.dailyBudget)}
    `;
    const statRelayed = document.getElementById('statRelayedTxs');
    if (statRelayed) statRelayed.innerHTML = `${metrics.totalRelayed} <span style="font-size:0.6em; color: var(--text-muted); font-weight: 400;">(real, from connected relayer)</span>`;
  } catch (err) {
    box.innerHTML = `<span style="color:#f87171;">Not reachable at ${relayerUrl} — ${err.message}. Run one locally (see stellar-gasless-relayer/README.md) and click Connect again.</span>`;
  }
}

// --- Relay Engine tab: a real gasless transaction, not a fetched-unrelated-tx mockup ----

function wireRealWalletAndDemo() {
  const demoTab = document.getElementById('demoTab');
  if (!demoTab) return;

  const realCard = document.createElement('div');
  realCard.className = 'card';
  realCard.style.marginBottom = '2rem';
  realCard.style.border = '1px solid rgba(16, 185, 129, 0.4)';
  realCard.innerHTML = `
    <h3 style="margin-top:0; color: var(--accent-green);">Real Gasless Transaction (Not a Mockup)</h3>
    <p style="color: var(--text-muted); font-size: 0.9rem;">
      Connects a real Freighter wallet, builds and signs a real call to the deployed
      <code>did_registry</code> contract, and submits it through <code>@stellar-gasless/sdk</code>'s
      real <code>GaslessClient</code> to the relayer configured above. Requires that relayer to
      actually be reachable and funded.
    </p>
    <button id="realConnectWalletBtn" class="btn btn-primary" style="margin-bottom:1rem;">Connect Real Wallet</button>
    <div id="realWalletStatus" style="font-size:0.85rem; color: var(--text-muted); margin-bottom:1rem;"></div>
    <button id="realRunBtn" class="btn btn-primary" disabled style="width:100%; padding:0.85rem;">Run Real Gasless Transaction</button>
    <div id="realResultBox" style="margin-top:1rem; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap;"></div>
  `;
  demoTab.insertBefore(realCard, demoTab.firstChild);

  document.getElementById('realConnectWalletBtn').addEventListener('click', async () => {
    const status = document.getElementById('realWalletStatus');
    try {
      const { isConnected, error: connErr } = await freighter.isConnected();
      if (connErr || !isConnected) throw new Error('Freighter not detected — install it from freighter.app.');
      const { address, error } = await freighter.requestAccess();
      if (error || !address) throw new Error(error?.message || 'Wallet access denied.');
      const { network, error: netErr } = await freighter.getNetwork();
      if (netErr) throw new Error(netErr.message);
      if (network !== 'TESTNET') throw new Error(`Freighter is on ${network} — switch to Testnet.`);
      connectedAddress = address;
      status.innerHTML = `<span style="color: var(--accent-green);">Connected: ${address}</span>`;
      document.getElementById('realRunBtn').disabled = false;
    } catch (err) {
      status.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
    }
  });

  document.getElementById('realRunBtn').addEventListener('click', runRealGaslessFlow);
}

async function runRealGaslessFlow() {
  const box = document.getElementById('realResultBox');
  const runBtn = document.getElementById('realRunBtn');
  runBtn.disabled = true;
  box.textContent = 'Checking existing DID state on-chain...';

  try {
    const readClient = await ContractClient.from({
      contractId: DID_REGISTRY_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
    const existingTx = await readClient.resolve_did({ address: connectedAddress });
    const existing = existingTx.result;

    const client = await ContractClient.from({
      contractId: DID_REGISTRY_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey: connectedAddress,
      signTransaction: freighter.signTransaction,
    });

    const document_ = `ipfs://gasless-dashboard-demo-${Date.now()}`;
    box.textContent = existing
      ? 'DID already registered for this wallet — calling update_did instead. Freighter will ask you to sign.'
      : 'No DID registered yet for this wallet — calling register_did. Freighter will ask you to sign.';

    const tx = existing
      ? await client.update_did({ owner: connectedAddress, document: document_ }, { timeoutInSeconds: 1800 })
      : await client.register_did({ owner: connectedAddress, document: document_ }, { timeoutInSeconds: 1800 });

    await tx.sign();
    const signedXdr = tx.signed.toXDR();

    box.textContent = `Signed. Submitting via GaslessClient to ${relayerUrl} ...`;
    const res = await fetch(`${relayerUrl}/v1/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ innerTransactionXdr: signedXdr, dappApiKey: 'dashboard-demo' }),
    });
    const result = await res.json();

    if (!result.success) {
      box.innerHTML = `<span style="color:#f87171;">Relayer rejected the transaction: ${result.error}</span>`;
      return;
    }

    box.innerHTML = `<span style="color: var(--accent-green);">Confirmed. txHash: ${result.hash}</span>\nVerifying real fee sponsorship on Horizon...`;

    // Independently confirm the fee sponsor differs from the connected wallet, rather than
    // just trusting the relayer's own success response.
    await new Promise((r) => setTimeout(r, 4000));
    const horizonTx = await fetchHorizonTx(result.hash);
    const sponsored = horizonTx.fee_account !== connectedAddress;
    box.innerHTML =
      `<span style="color: var(--accent-green);">Confirmed. txHash: ${result.hash}</span>\n` +
      `fee_account (who actually paid): ${horizonTx.fee_account}\n` +
      `your wallet: ${connectedAddress}\n` +
      (sponsored
        ? `<span style="color: var(--accent-green);">Genuinely sponsored — the relayer's account paid, not you.</span>`
        : `<span style="color:#f87171;">Unexpected: fee_account matches your own wallet.</span>`) +
      `\nView: https://stellar.expert/explorer/testnet/tx/${result.hash}`;
  } catch (err) {
    box.innerHTML = `<span style="color:#f87171;">${err.message}</span>`;
  } finally {
    runBtn.disabled = false;
  }
}
