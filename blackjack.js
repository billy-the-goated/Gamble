(() => {
  "use strict";

  const suits = ["♠", "♥", "♦", "♣"];
  const redSuits = new Set(["♥", "♦"]);
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const $ = (id) => document.getElementById(id);
  let hand = null;
  let shoe = [];
  let roundActive = false;
  let canDouble = false;

  function makeShoe() {
    const cards = [];
    for (let deck = 0; deck < 4; deck++) {
      for (const suit of suits) {
        for (const rank of ranks) cards.push({ rank, suit });
      }
    }
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  function draw() {
    if (shoe.length === 0) shoe = makeShoe();
    return shoe.pop();
  }

  function cardValue(card) {
    if (card.rank === "A") return 11;
    if (["J", "Q", "K"].includes(card.rank)) return 10;
    return Number(card.rank);
  }

  function total(cards) {
    let value = cards.reduce((sum, card) => sum + cardValue(card), 0);
    let aces = cards.filter((card) => card.rank === "A").length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  }

  function renderCards(container, cards, hideHole = false) {
    container.replaceChildren();
    cards.forEach((card, index) => {
      const element = document.createElement("div");
      if (hideHole && index === 1) {
        element.className = "card card-back";
        element.textContent = "✦";
      } else {
        element.className = `card${redSuits.has(card.suit) ? " red-suit" : ""}`;
        const rank = document.createElement("span");
        rank.className = "card-rank";
        rank.textContent = card.rank;
        const suit = document.createElement("span");
        suit.className = "card-suit";
        suit.textContent = card.suit;
        element.append(rank, suit);
      }
      container.append(element);
    });
  }

  function renderHand(revealDealer = !roundActive) {
    if (!hand) return;
    renderCards($("player-cards"), hand.player);
    renderCards($("dealer-cards"), hand.dealer, !revealDealer);
    $("player-total").textContent = `· ${total(hand.player)}`;
    $("dealer-total").textContent = revealDealer ? `· ${total(hand.dealer)}` : `· ${cardValue(hand.dealer[0])} + ?`;
  }

  function updateControls() {
    $("deal-button").disabled = roundActive;
    $("hit-button").disabled = !roundActive;
    $("stand-button").disabled = !roundActive;
    $("double-button").disabled = !roundActive || !canDouble || Lantern.balance < hand?.wager;
  }

  function deal() {
    if (roundActive) return;
    const wager = Lantern.validWager($("blackjack-wager"));
    if (wager === null) return;
    Lantern.setBalance(Lantern.balance - wager);
    hand = { player: [draw(), draw()], dealer: [draw(), draw()], wager };
    roundActive = true;
    canDouble = true;
    $("dealer-status").textContent = "";
    $("player-status").textContent = "";
    $("blackjack-message").textContent = "Your move: hit, stand, or double your wager.";
    renderHand(false);
    updateControls();
    if (total(hand.player) === 21) dealerTurn();
  }

  function hit() {
    if (!roundActive) return;
    hand.player.push(draw());
    canDouble = false;
    renderHand(false);
    if (total(hand.player) >= 21) finish();
    else updateControls();
  }

  function stand() {
    if (!roundActive) return;
    canDouble = false;
    dealerTurn();
  }

  function doubleDown() {
    if (!roundActive || !canDouble || Lantern.balance < hand.wager) return;
    Lantern.setBalance(Lantern.balance - hand.wager);
    hand.wager *= 2;
    hand.player.push(draw());
    canDouble = false;
    renderHand(false);
    if (total(hand.player) >= 21) finish();
    else dealerTurn();
  }

  function dealerTurn() {
    if (!roundActive) return;
    canDouble = false;
    const millionToOneStreak = Math.random() < 1 / 1_000_000;
    if (millionToOneStreak) {
      hand.dealer.push({ rank: "10", suit: "♠" }, { rank: "10", suit: "♥" });
    } else {
      while (total(hand.dealer) < 17) hand.dealer.push(draw());
    }
    finish(millionToOneStreak);
  }

  function finish(millionToOneStreak = false) {
    const playerTotal = total(hand.player);
    const dealerTotal = total(hand.dealer);
    roundActive = false;
    canDouble = false;
    Lantern.stats.played++;

    let payout = 0;
    let message;
    if (playerTotal > 21) {
      message = "Bust. The house takes this hand.";
    } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
      const blackjack = hand.player.length === 2 && playerTotal === 21;
      payout = blackjack ? hand.wager * 2.5 : hand.wager * 2;
      message = blackjack ? "Blackjack! A 3:2 payout, beautifully played." : "You win! Your wager is returned with winnings.";
      Lantern.stats.won++;
    } else if (playerTotal === dealerTotal) {
      payout = hand.wager;
      message = "A push. Your wager comes back to you.";
    } else {
      message = "The dealer takes this hand. The next one's yours.";
    }

    if (millionToOneStreak) {
      message = `The impossible happens: the dealer pulls two 10s in a row${dealerTotal > 21 ? " and busts" : ""}!`;
    }
    if (payout > 0) Lantern.setBalance(Lantern.balance + payout);
    Lantern.save();
    $("blackjack-message").textContent = `${message}${payout > hand.wager ? ` You collect $${Lantern.formatChips(payout)}.` : payout > 0 ? ` $${Lantern.formatChips(payout)} returned.` : ""}`;
    $("dealer-status").textContent = dealerTotal > 21 ? "Bust" : dealerTotal === 21 ? "Twenty-one" : "";
    $("player-status").textContent = playerTotal > 21 ? "Bust" : playerTotal === 21 ? "Twenty-one" : "";
    renderHand(true);
    updateControls();
  }

  $("deal-button").addEventListener("click", deal);
  $("hit-button").addEventListener("click", hit);
  $("stand-button").addEventListener("click", stand);
  $("double-button").addEventListener("click", doubleDown);
  document.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $("blackjack-wager");
      input.value = Number(input.value || 0) + Number(button.dataset.add);
    });
  });
  $("dealer-total").textContent = "· —";
  $("player-total").textContent = "· —";
})();
