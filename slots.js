(() => {
  "use strict";

  const reels = [
    document.getElementById("reel-one"),
    document.getElementById("reel-two"),
    document.getElementById("reel-three")
  ];
  const prizes = new Map([["🍒", 4], ["🍋", 5], ["🔔", 8], ["🏮", 12], ["⭐", 25], ["7️⃣", 50]]);
  const symbols = [...prizes.keys()];
  const button = document.getElementById("slots-spin");
  let spinning = false;

  button.addEventListener("click", () => {
    if (spinning) return;
    const wager = Lantern.validWager(document.getElementById("slots-wager"));
    if (wager === null) return;
    Lantern.setBalance(Lantern.balance - wager);
    spinning = true;
    button.disabled = true;
    document.getElementById("slots-message").textContent = "The reels are turning...";

    const result = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    const timers = reels.map((reel, index) => {
      reel.classList.add("spinning");
      return window.setTimeout(() => {
        reel.classList.remove("spinning");
        reel.textContent = result[index];
      }, 650 + index * 300);
    });

    window.setTimeout(() => {
      const multiplier = result.every((symbol) => symbol === result[0]) ? prizes.get(result[0]) : 0;
      const payout = wager * multiplier;
      if (payout > 0) Lantern.setBalance(Lantern.balance + payout);
      Lantern.stats.played++;
      if (payout > 0) Lantern.stats.won++;
      Lantern.save();
      document.getElementById("slots-message").textContent = payout > 0
        ? `${result[0]} ${result[0]} ${result[0]} — a ${multiplier}× line! You collect ${Lantern.formatChips(payout)} chips.`
        : `${result.join("  ")} — no line this time. Give it another whirl?`;
      spinning = false;
      button.disabled = false;
    }, Math.max(...timers.map((_, index) => 650 + index * 300)) + 100);
  });
})();
