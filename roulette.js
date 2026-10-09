(() => {
  "use strict";

  const rouletteReds = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const $ = (id) => document.getElementById(id);
  let spinning = false;
  let wheelRotation = 0;

  $("roulette-bet").addEventListener("change", () => {
    const numberBet = $("roulette-bet").value === "number";
    $("roulette-number").hidden = !numberBet;
    $("number-label").hidden = !numberBet;
  });

  $("spin-button").addEventListener("click", () => {
    if (spinning) return;
    const wager = Lantern.validWager($("roulette-wager"));
    if (wager === null) return;
    const bet = $("roulette-bet").value;
    const chosenNumber = Number($("roulette-number").value);
    if (bet === "number" && (!Number.isInteger(chosenNumber) || chosenNumber < 0 || chosenNumber > 36)) {
      Lantern.showToast("Pick a roulette number from 0 to 36.");
      $("roulette-number").focus();
      return;
    }

    Lantern.setBalance(Lantern.balance - wager);
    spinning = true;
    $("spin-button").disabled = true;
    $("roulette-message").textContent = "The wheel is turning...";
    const number = Math.floor(Math.random() * 37);
    wheelRotation += 1440 + Math.floor(Math.random() * 360);
    $("roulette-wheel").style.setProperty("--wheel-rotation", `${wheelRotation}deg`);
    $("roulette-wheel").style.transform = `rotate(${wheelRotation}deg)`;

    window.setTimeout(() => {
      const color = number === 0 ? "green" : rouletteReds.has(number) ? "red" : "black";
      const won = bet === "number"
        ? number === chosenNumber
        : bet === color || (bet === "even" && number !== 0 && number % 2 === 0) || (bet === "odd" && number % 2 === 1);
      const payout = won ? wager * (bet === "number" ? 36 : 2) : 0;
      $("wheel-number").textContent = number;
      $("wheel-number").style.color = color === "red" ? "#ffb6a7" : color === "green" ? "#9fe0b0" : "#fff2ce";
      if (payout > 0) Lantern.setBalance(Lantern.balance + payout);
      Lantern.stats.played++;
      if (won) Lantern.stats.won++;
      Lantern.save();
      $("roulette-message").textContent = won
        ? `${number} ${color} — your hunch was right! You collect ${Lantern.formatChips(payout)} chips.`
        : `${number} ${color} — not this time. The wheel has spoken.`;
      spinning = false;
      $("spin-button").disabled = false;
    }, 1200);
  });
})();
