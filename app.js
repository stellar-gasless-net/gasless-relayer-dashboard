document.addEventListener('DOMContentLoaded', function () {
  // NOTE: This dashboard has no backend deployed yet. All state below (gas pool,
  // paymaster balances, API keys, relayed tx history) lives only in this page's
  // memory and resets on reload. Nothing here is persisted or real.
  let totalSponsoredGas = 0;
  let totalRelayedCount = 0;
  let usdcPaymasterReserve = 0;
  let promoPaymasterReserve = 0;
  let activeDepositTarget = 'usdc';

  // Read-only public endpoint used only to fetch one example transaction hash
  // for the demo receipt below. This dashboard never submits anything to it.
  const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';

  // 1. Navigation Tabs Logic
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      navItems.forEach(function (n) { n.classList.remove('active'); });
      tabContents.forEach(function (c) { c.style.display = 'none'; });

      item.classList.add('active');
      const targetTabId = item.getAttribute('data-tab');
      const targetTab = document.getElementById(targetTabId || 'overviewTab');
      if (targetTab) {
        targetTab.style.display = 'block';
      }
    });
  });

  // 2. Deposit XLM Modal Logic (local UI state only — no real deposit happens)
  const depositModal = document.getElementById('depositModal');
  const openDepositBtn = document.getElementById('openDepositBtn');
  const closeDepositBtn = document.getElementById('closeDepositBtn');
  const depositForm = document.getElementById('depositForm');

  document.querySelectorAll('.openDepositModalBtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = btn.getAttribute('data-target') || 'usdc';
      activeDepositTarget = target;
      if (depositModal) depositModal.style.display = 'flex';
    });
  });

  if (openDepositBtn && depositModal) {
    openDepositBtn.addEventListener('click', function () {
      activeDepositTarget = 'usdc';
      depositModal.style.display = 'flex';
    });
  }

  if (closeDepositBtn && depositModal) {
    closeDepositBtn.addEventListener('click', function () {
      depositModal.style.display = 'none';
    });
  }

  if (depositForm) {
    depositForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const amountInput = document.getElementById('depositAmount');
      const addedAmount = parseFloat(amountInput ? amountInput.value : '500');

      totalSponsoredGas += addedAmount;
      const statGas = document.getElementById('statSponsoredGas');
      if (statGas) {
        statGas.innerHTML = totalSponsoredGas.toFixed(2) + ' XLM <span style="font-size:0.6em; color: var(--text-muted); font-weight: 400;">(sample)</span>';
      }

      if (activeDepositTarget === 'promo') {
        promoPaymasterReserve += addedAmount;
        const promoEl = document.getElementById('paymasterPromoBalance');
        if (promoEl) promoEl.innerText = promoPaymasterReserve.toFixed(2) + ' XLM';
      } else {
        usdcPaymasterReserve += addedAmount;
        const usdcEl = document.getElementById('paymasterUsdcBalance');
        if (usdcEl) usdcEl.innerText = usdcPaymasterReserve.toFixed(2) + ' XLM';
      }

      showToast('UI preview only: no real XLM moved. ' + addedAmount.toFixed(2) + ' XLM added to the on-screen sample balance.');
      if (depositModal) depositModal.style.display = 'none';
    });
  }

  // 3. Create API Key Modal Logic (generates a UI-only placeholder, not a real credential)
  const apiKeyModal = document.getElementById('apiKeyModal');
  const openApiKeyBtnOverview = document.getElementById('openApiKeyBtnOverview');
  const openApiKeyBtnMain = document.getElementById('openApiKeyBtnMain');
  const closeApiKeyBtn = document.getElementById('closeApiKeyBtn');
  const apiKeyForm = document.getElementById('apiKeyForm');

  function openApiKeyModal() {
    if (apiKeyModal) apiKeyModal.style.display = 'flex';
  }

  if (openApiKeyBtnOverview) openApiKeyBtnOverview.addEventListener('click', openApiKeyModal);
  if (openApiKeyBtnMain) openApiKeyBtnMain.addEventListener('click', openApiKeyModal);
  if (closeApiKeyBtn && apiKeyModal) {
    closeApiKeyBtn.addEventListener('click', function () {
      apiKeyModal.style.display = 'none';
    });
  }

  if (apiKeyForm) {
    apiKeyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const nameInput = document.getElementById('apiKeyName');
      const limitInput = document.getElementById('apiKeyRateLimit');
      const name = nameInput ? nameInput.value : 'Stellar dApp Gateway';
      const limit = limitInput ? limitInput.value : '30 req/min';

      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const keyPrefix = 'demo_key_...' + randomSuffix;
      const fullKey = 'demo_key_' + Math.random().toString(36).substring(2, 12) + randomSuffix;

      const newRowHtml = '<tr>' +
        '<td>' + name + '</td>' +
        '<td><code>' + keyPrefix + '</code></td>' +
        '<td>' + limit + '</td>' +
        '<td>0 / 0</td>' +
        '<td><span class="badge" style="background: rgba(180, 83, 9, 0.25); color: #fbbf24;">Demo Only</span></td>' +
        '<td><button class="btn btn-secondary copy-key-btn" data-key="' + fullKey + '" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Copy Key</button></td>' +
      '</tr>';

      const tBodyOverview = document.getElementById('apiKeysOverviewTableBody');
      const tBodyMain = document.getElementById('apiKeysMainTableBody');
      // Replace the "no keys yet" placeholder row the first time a demo key is created.
      if (tBodyOverview && tBodyOverview.querySelector('td[colspan]')) tBodyOverview.innerHTML = '';
      if (tBodyMain && tBodyMain.querySelector('td[colspan]')) tBodyMain.innerHTML = '';
      if (tBodyOverview) tBodyOverview.insertAdjacentHTML('afterbegin', newRowHtml);
      if (tBodyMain) tBodyMain.insertAdjacentHTML('afterbegin', newRowHtml);

      const snippetKeyEl = document.getElementById('codeSnippetKey');
      if (snippetKeyEl) snippetKeyEl.innerText = fullKey;

      bindCopyButtons();
      showToast('Demo key "' + name + '" created in this browser tab only — not a real, working credential.');
      if (apiKeyModal) apiKeyModal.style.display = 'none';
      if (nameInput) nameInput.value = '';
    });
  }

  // Helper to limit table DOM rows to 50
  function trimTableRows(tbodyElement) {
    if (!tbodyElement) return;
    while (tbodyElement.rows.length > 50) {
      tbodyElement.deleteRow(tbodyElement.rows.length - 1);
    }
  }

  // 4. Relay Walkthrough (Demo) — does not sign, sponsor, or broadcast anything.
  // The only real network call is a read-only fetch of the latest public testnet
  // transaction, used purely to show what a receipt would look like.
  const quickRunDemoBtn = document.getElementById('quickRunDemoBtn');
  const runFullDemoBtn = document.getElementById('runFullDemoBtn');

  if (quickRunDemoBtn) {
    quickRunDemoBtn.addEventListener('click', function () {
      const demoTabItem = document.querySelector('[data-tab="demoTab"]');
      if (demoTabItem) demoTabItem.click();
      const inputEl = document.getElementById('demoUserAddressInput');
      if (inputEl) inputEl.focus();
    });
  }

  if (runFullDemoBtn) {
    runFullDemoBtn.addEventListener('click', async function () {
      const progressBox = document.getElementById('demoProgressBox');
      const statusText = document.getElementById('demoStatusText');
      const progressBar = document.getElementById('demoProgressBar');
      const receiptBox = document.getElementById('demoResultReceiptBox');

      const userAddressInput = document.getElementById('demoUserAddressInput');
      const targetContractSelect = document.getElementById('demoTargetContractSelect');
      const paymasterSelect = document.getElementById('demoPaymasterTypeSelect');
      const gasCapSelect = document.getElementById('demoGasFeeCapSelect');

      const userAddr = userAddressInput ? (userAddressInput.value || 'GDEMO_NO_REAL_WALLET_USED') : 'GDEMO_NO_REAL_WALLET_USED';
      const targetContract = targetContractSelect ? targetContractSelect.value : 'trusted-forwarder';
      const paymasterType = paymasterSelect ? paymasterSelect.value : 'USDC Paymaster';
      const gasFeeCap = gasCapSelect ? gasCapSelect.value : '0.0001 XLM (1,000 Stroops)';

      const shortUser = userAddr.length > 10 ? (userAddr.substring(0, 5) + '...' + userAddr.substring(userAddr.length - 4)) : userAddr;

      if (progressBox && statusText && progressBar) {
        if (receiptBox) receiptBox.style.display = 'none';
        progressBox.style.display = 'block';
        statusText.innerText = 'Step 1/3: Walking through the auth-signing UI for ' + shortUser + ' (nothing is actually signed)...';
        progressBar.style.width = '33%';

        setTimeout(async function () {
          statusText.innerText = 'Step 2/3: Fetching one real example transaction from Horizon testnet (read-only, ' + HORIZON_TESTNET_URL + ')...';
          progressBar.style.width = '66%';

          let exampleTxHash = null;
          let fetchFailed = false;
          try {
            const rpcResponse = await fetch(HORIZON_TESTNET_URL + '/transactions?order=desc&limit=1');
            const rpcData = await rpcResponse.json();
            if (rpcData && rpcData._embedded && rpcData._embedded.records && rpcData._embedded.records.length > 0) {
              exampleTxHash = rpcData._embedded.records[0].hash;
            } else {
              fetchFailed = true;
            }
          } catch (err) {
            fetchFailed = true;
            console.log('Horizon testnet fetch failed:', err);
          }

          if (fetchFailed || !exampleTxHash) {
            statusText.innerText = 'Could not reach Horizon testnet just now — no example hash to show. This demo does not fabricate a fallback result.';
            progressBar.style.width = '100%';
            setTimeout(function () { progressBox.style.display = 'none'; }, 1500);
            showToast('Example fetch failed — try again. (This is expected sometimes; it is a real network call, not scripted.)');
            return;
          }

          setTimeout(function () {
            statusText.innerText = 'Step 3/3: Walkthrough complete (no transaction was submitted)';
            progressBar.style.width = '100%';

            setTimeout(function () {
              totalRelayedCount += 1;
              const statRelayed = document.getElementById('statRelayedTxs');
              if (statRelayed) statRelayed.innerHTML = totalRelayedCount.toLocaleString() + ' <span style="font-size:0.6em; color: var(--text-muted); font-weight: 400;">(demo runs)</span>';

              const shortHash = exampleTxHash.substring(0, 4) + '...' + exampleTxHash.substring(Math.max(0, exampleTxHash.length - 4));

              if (receiptBox) {
                const receiptHashEl = document.getElementById('receiptHash');
                const receiptCapEl = document.getElementById('receiptFeeCap');
                if (receiptHashEl) receiptHashEl.innerText = exampleTxHash;
                if (receiptCapEl) receiptCapEl.innerText = gasFeeCap;
                receiptBox.style.display = 'block';
              }

              const newTxRow = '<tr style="background: rgba(99, 102, 241, 0.12); transition: background 2s ease;">' +
                '<td><code class="tx-hash-link" data-hash="' + exampleTxHash + '" style="cursor: pointer; color: #818cf8;">' + shortHash + '</code></td>' +
                '<td><code>' + shortUser + '</code></td>' +
                '<td><code>' + targetContract + '</code></td>' +
                '<td>' + paymasterType + '</td>' +
                '<td>' + gasFeeCap.split(' ')[0] + '</td>' +
                '<td><span class="badge" style="background: rgba(180, 83, 9, 0.25); color: #fbbf24;">DEMO — NOT SUBMITTED</span></td>' +
                '<td>Just now</td>' +
              '</tr>';

              const txOverviewBody = document.getElementById('txOverviewTableBody');
              const allTxBody = document.getElementById('allTxTableBody');
              // Replace the "no transactions yet" placeholder row on the first demo run.
              if (txOverviewBody && txOverviewBody.querySelector('td[colspan]')) txOverviewBody.innerHTML = '';
              if (allTxBody && allTxBody.querySelector('td[colspan]')) allTxBody.innerHTML = '';
              if (txOverviewBody) {
                txOverviewBody.insertAdjacentHTML('afterbegin', newTxRow);
                trimTableRows(txOverviewBody);
              }
              if (allTxBody) {
                allTxBody.insertAdjacentHTML('afterbegin', newTxRow);
                trimTableRows(allTxBody);
              }

              bindTxDetailLinks();
              showToast('Demo walkthrough finished — no transaction was actually signed or broadcast.');
              progressBox.style.display = 'none';
            }, 500);
          }, 500);
        }, 500);
      }
    });
  }

  // 5. Transaction Detail Inspector Modal Logic
  const txDetailModal = document.getElementById('txDetailModal');
  const closeTxDetailBtn = document.getElementById('closeTxDetailBtn');

  function bindTxDetailLinks() {
    document.querySelectorAll('.tx-hash-link').forEach(function (link) {
      link.onclick = function (e) {
        e.preventDefault();
        const hash = link.getAttribute('data-hash');
        if (!hash) return;
        const titleEl = document.getElementById('detailTxTitle');
        const contentEl = document.getElementById('detailTxContent');
        const explorerLink = document.getElementById('detailStellarExpertLink');

        if (titleEl) titleEl.innerText = 'Example Testnet Tx: ' + hash.substring(0, 8) + '...';
        if (contentEl) {
          contentEl.innerText = JSON.stringify({
            note: 'This hash is a real, unrelated public Stellar testnet transaction fetched read-only from Horizon. It was NOT produced by this dashboard, and the fields below are illustrative placeholders only — no Soroban auth entry, keypair, or paymaster charge described here actually happened.',
            stellarTestnetTxHash: hash,
            network: 'Stellar Testnet (horizon-testnet.stellar.org)',
            exampleTargetContract: 'trusted-forwarder (not yet deployed)',
          }, null, 2);
        }
        if (explorerLink) {
          explorerLink.setAttribute('href', 'https://stellar.expert/explorer/testnet/tx/' + hash);
        }
        if (txDetailModal) txDetailModal.style.display = 'flex';
      };
    });
  }

  if (closeTxDetailBtn && txDetailModal) {
    closeTxDetailBtn.addEventListener('click', function () {
      txDetailModal.style.display = 'none';
    });
  }

  // 6. Copy Key Handler
  function bindCopyButtons() {
    document.querySelectorAll('.copy-key-btn').forEach(function (btn) {
      btn.onclick = function () {
        const key = btn.getAttribute('data-key') || 'demo_key';
        const snippetKeyEl = document.getElementById('codeSnippetKey');
        if (snippetKeyEl) snippetKeyEl.innerText = key;

        navigator.clipboard.writeText(key).then(function () {
          showToast('Copied demo key to clipboard (not a working credential).');
        }).catch(function () {
          showToast('Demo key: ' + key);
        });
      };
    });
  }

  // 7. Export CSV Handler — exports whatever demo rows exist in this tab right now.
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', function () {
      const rows = document.querySelectorAll('#allTxTableBody tr');
      let csvContent = 'data:text/csv;charset=utf-8,TxHash,UserSigner,TargetContract,Paymaster,GasSponsored,Status,Time\n';
      let hasData = false;
      rows.forEach(function (row) {
        if (row.querySelector('td[colspan]')) return;
        const cells = row.querySelectorAll('td');
        if (cells.length < 7) return;
        hasData = true;
        const hashEl = cells[0].querySelector('code');
        const hash = hashEl ? hashEl.getAttribute('data-hash') || hashEl.innerText : '';
        csvContent += [hash, cells[1].innerText, cells[2].innerText, cells[3].innerText, cells[4].innerText, cells[5].innerText, cells[6].innerText].join(',') + '\n';
      });
      if (!hasData) {
        showToast('Nothing to export yet — run the demo walkthrough first.');
        return;
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'stellar_gasless_demo_runs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded demo run history (not real relayed transactions).');
    });
  }

  bindCopyButtons();
  bindTxDetailLinks();

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('show');
    }, 100);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }
});
