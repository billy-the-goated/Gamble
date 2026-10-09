(() => {
  "use strict";

  const STORAGE_KEY = "lucky-lantern-save-v1";
  const STARTING_BALANCE = 1000;
  const formatChips = (amount) => amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    console.warn("Saved casino chips could not be loaded.", error);
    saved = null;
  }
  let balance = Number.isFinite(saved?.balance) && saved.balance >= 0 ? saved.balance : STARTING_BALANCE;
  let stats = saved?.stats && Number.isSafeInteger(saved.stats.played) && Number.isSafeInteger(saved.stats.won)
    ? saved.stats
    : { played: 0, won: 0 };
  let toastTimer;

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, stats }));
    } catch (error) {
      console.warn("Casino progress could not be saved.", error);
      showToast("Your browser could not save this visit.");
    }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setBalance(amount) {
    balance = amount;
    const display = document.getElementById("balance");
    if (display) display.textContent = `$${formatChips(balance)}`;
    save();
  }

  function validWager(input) {
    const amount = Number(input.value);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      showToast("Please enter a whole-number wager of at least 1 chip.");
      input.focus();
      return null;
    }
    if (amount > balance) {
      showToast("That wager is more chips than you have.");
      input.focus();
      return null;
    }
    return amount;
  }

  const display = document.getElementById("balance");
  if (display) display.textContent = `$${formatChips(balance)}`;
  window.Lantern = {
    get balance() { return balance; },
    stats,
    save,
    setBalance,
    formatChips,
    showToast,
    validWager
  };
})();
