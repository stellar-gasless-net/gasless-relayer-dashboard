document.addEventListener('DOMContentLoaded', function () {
  // Navigation Tabs Logic
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

  // Modal Handlers
  const depositModal = document.getElementById('depositModal');
  const openDepositBtn = document.getElementById('openDepositBtn');
  const closeDepositBtn = document.getElementById('closeDepositBtn');
  const depositForm = document.getElementById('depositForm');

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
      const amount = amountInput ? amountInput.value : '500';
      showToast('Successfully deposited ' + amount + ' XLM into Paymaster Gas Pool!');
      if (depositModal) depositModal.style.display = 'none';
    });
  }

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
