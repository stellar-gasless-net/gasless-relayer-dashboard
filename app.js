document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('depositModal');
  const openBtn = document.getElementById('openDepositBtn');
  const closeBtn = document.getElementById('closeDepositBtn');
  const depositForm = document.getElementById('depositForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (depositForm) {
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = (document.getElementById('depositAmount') as HTMLInputElement)?.value || '100';
      alert(`Successfully deposited ${amount} XLM into Paymaster Gas Reserve Pool!`);
      if (modal) modal.style.display = 'none';
    });
  }
});
