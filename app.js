document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs Logic
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navItems.forEach((n) => n.classList.remove('active'));
      tabContents.forEach((c) => (c as HTMLElement).style.display = 'none');

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
    openDepositBtn.addEventListener('click', () => {
      depositModal.style.display = 'flex';
    });
  }

  if (closeDepositBtn && depositModal) {
    closeDepositBtn.addEventListener('click', () => {
      depositModal.style.display = 'none';
    });
  }

  if (depositForm) {
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = (document.getElementById('depositAmount') as HTMLInputElement)?.value || '500';
      showToast(`Successfully deposited ${amount} XLM into Paymaster Gas Pool!`);
      if (depositModal) depositModal.style.display = 'none';
    });
  }

  // Toast Notification Helper
  function showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
