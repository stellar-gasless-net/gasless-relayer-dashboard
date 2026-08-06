document.addEventListener('DOMContentLoaded', function () {
  let totalSponsoredGas = 1428.90;
  let totalRelayedCount = 14289;

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

  // 2. Deposit XLM Modal Logic
  const depositModal = document.getElementById('depositModal');
  const openDepositBtn = document.getElementById('openDepositBtn');
  const closeDepositBtn = document.getElementById('closeDepositBtn');
  const depositForm = document.getElementById('depositForm');

  document.querySelectorAll('.openDepositModalBtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (depositModal) depositModal.style.display = 'flex';
    });
  });

  if (openDepositBtn && depositModal) {
    openDepositBtn.addEventListener('click', function () {
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
        statGas.innerText = totalSponsoredGas.toFixed(2) + ' XLM';
      }

      showToast('Successfully deposited ' + addedAmount + ' XLM into Paymaster Reserve!');
      if (depositModal) depositModal.style.display = 'none';
    });
  }

  // 3. Create API Key Modal Logic
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
      const keyPrefix = 'st_gas_live_...' + randomSuffix;
      const fullKey = 'st_gas_live_' + Math.random().toString(36).substring(2, 12) + randomSuffix;

      const newRowHtml = '<tr>' +
        '<td>' + name + '</td>' +
        '<td><code>' + keyPrefix + '</code></td>' +
        '<td>' + limit + '</td>' +
        '<td>100,000 / 100,000</td>' +
        '<td><span class="badge">Active</span></td>' +
        '<td><button class="btn btn-secondary copy-key-btn" data-key="' + fullKey + '" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Copy Key</button></td>' +
      '</tr>';

      const tBodyOverview = document.getElementById('apiKeysOverviewTableBody');
      const tBodyMain = document.getElementById('apiKeysMainTableBody');
      if (tBodyOverview) tBodyOverview.insertAdjacentHTML('afterbegin', newRowHtml);
      if (tBodyMain) tBodyMain.insertAdjacentHTML('afterbegin', newRowHtml);

      bindCopyButtons();
      showToast('API Key "' + name + '" created successfully!');
      if (apiKeyModal) apiKeyModal.style.display = 'none';
      if (nameInput) nameInput.value = '';
    });
  }

  // 4. Soroban FeeBump Relay Simulator Logic
  const quickRunDemoBtn = document.getElementById('quickRunDemoBtn');
  const runFullDemoBtn = document.getElementById('runFullDemoBtn');

  function triggerGaslessExecutionDemo() {
    const demoTabItem = document.querySelector('[data-tab="demoTab"]');
    if (demoTabItem) demoTabItem.click();

    const progressBox = document.getElementById('demoProgressBox');
    const statusText = document.getElementById('demoStatusText');
    const progressBar = document.getElementById('demoProgressBar');

    if (progressBox && statusText && progressBar) {
      progressBox.style.display = 'block';
      statusText.innerText = 'Step 1/3: Signing Off-Chain Soroban Auth Entry...';
      progressBar.style.width = '33%';

      setTimeout(function () {
        statusText.innerText = 'Step 2/3: Relayer Wrapping payload into FeeBumpTransaction...';
        progressBar.style.width = '66%';

        setTimeout(function () {
          statusText.innerText = 'Step 3/3: Broadcasted FeeBumpTx to Horizon RPC Node!';
          progressBar.style.width = '100%';

          setTimeout(function () {
            totalRelayedCount += 1;
            const statRelayed = document.getElementById('statRelayedTxs');
            if (statRelayed) statRelayed.innerText = totalRelayedCount.toLocaleString();

            const randomTxHash = '0x' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 6);
            const shortHash = randomTxHash.substring(0, 6) + '...' + randomTxHash.substring(randomTxHash.length - 4);

            const newTxRow = '<tr>' +
              '<td><code class="tx-hash-link" data-hash="' + randomTxHash + '" style="cursor: pointer; color: #818cf8;">' + shortHash + '</code></td>' +
              '<td><code>GCSIMULATED_USER</code></td>' +
              '<td><code>trusted-forwarder</code></td>' +
              '<td>USDC Paymaster</td>' +
              '<td>0.0001 XLM</td>' +
              '<td><span class="badge">Success</span></td>' +
              '<td>Just now</td>' +
            '</tr>';

            const txOverviewBody = document.getElementById('txOverviewTableBody');
            const allTxBody = document.getElementById('allTxTableBody');
            if (txOverviewBody) txOverviewBody.insertAdjacentHTML('afterbegin', newTxRow);
            if (allTxBody) allTxBody.insertAdjacentHTML('afterbegin', newTxRow);

            bindTxDetailLinks();
            showToast('⚡ Soroban Meta-Tx ' + shortHash + ' Broadcasted Successfully!');
            progressBox.style.display = 'none';
          }, 800);
        }, 800);
      }, 800);
    }
  }

  if (quickRunDemoBtn) quickRunDemoBtn.addEventListener('click', triggerGaslessExecutionDemo);
  if (runFullDemoBtn) runFullDemoBtn.addEventListener('click', triggerGaslessExecutionDemo);

  // 5. Transaction Detail Inspector Modal Logic
  const txDetailModal = document.getElementById('txDetailModal');
  const closeTxDetailBtn = document.getElementById('closeTxDetailBtn');

  function bindTxDetailLinks() {
    document.querySelectorAll('.tx-hash-link').forEach(function (link) {
      link.onclick = function (e) {
        e.preventDefault();
        const hash = link.getAttribute('data-hash') || '0x7f8a12c9a4b8';
        const titleEl = document.getElementById('detailTxTitle');
        const contentEl = document.getElementById('detailTxContent');
        const explorerLink = document.getElementById('detailStellarExpertLink');

        if (titleEl) titleEl.innerText = 'Transaction Inspector: ' + hash;
        if (contentEl) {
          contentEl.innerText = JSON.stringify({
            txHash: hash,
            network: 'Stellar Testnet',
            type: 'FeeBumpTransaction',
            feeSponsor: 'GCRELAYER_TREASURY_KEYPAIR',
            innerTxUserSigner: 'GCSIMULATED_USER_WALLET',
            targetContract: 'CCFORWARDER_TRUSTED_SOROBAN',
            gasSponsoredStroops: 1000,
            executionStatus: 'SUCCESS',
            ledgerTimestamp: new Date().toISOString(),
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
        const key = btn.getAttribute('data-key') || 'st_gas_live_key';
        navigator.clipboard.writeText(key).then(function () {
          showToast('Copied API Key to clipboard!');
        }).catch(function () {
          showToast('Key copied: ' + key);
        });
      };
    });
  }

  // 7. Export CSV Handler
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', function () {
      const csvContent = 'data:text/csv;charset=utf-8,TxHash,UserSigner,TargetContract,Paymaster,GasSponsored,Status,Time\n' +
        '0x7f8a12c9a4b8,GBXXUSER1,trusted-forwarder,USDC Paymaster,0.0001 XLM,Success,2 mins ago\n' +
        '0x9e12b41dc982,GDYYUSER2,account-abstraction-wallet,Voucher Paymaster,0.0001 XLM,Success,5 mins ago\n';
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'stellar_gasless_relayed_txs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded transaction audit log CSV!');
    });
  }

  // Bind initial dynamic links
  bindCopyButtons();
  bindTxDetailLinks();

  // Toast Notification Helper
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
