(() => {
  "use strict";

  const suits = ["♠", "♥", "♦", "♣"];
  const redSuits = new Set(["♥", "♦"]);
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const $ = (id) => document.getElementById(id);
  let hands = [];
  let dealer = [];
  let shoe = [];
  let activeHand = 0;
  let roundActive = false;
  let canDouble = false;
  let canSplit = false;
  let splitRound = false;

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

  function drawForDealer(cards) {
    if (shoe.length === 0) shoe = makeShoe();
    const weights = shoe.map((card) => total([...cards, card]) === 21 ? 0.2 : 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let target = Math.random() * totalWeight;
    let selectedIndex = shoe.length - 1;
    for (let index = 0; index < weights.length; index++) {
      target -= weights[index];
      if (target < 0) {
        selectedIndex = index;
        break;
      }
    }
    return shoe.splice(selectedIndex, 1)[0];
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

  function renderHands(revealDealer = !roundActive) {
    renderCards($("dealer-cards"), dealer, !revealDealer);
    $("dealer-total").textContent = revealDealer ? `· ${total(dealer)}` : `· ${cardValue(dealer[0])} + ?`;
    const playerHands = $("player-hands");
    playerHands.classList.toggle("split-layout", hands.length > 1);
    playerHands.replaceChildren();
    hands.forEach((hand, index) => {
      const section = document.createElement("div");
      section.className = `hand${roundActive && index === activeHand ? " active-hand" : ""}`;
      const heading = document.createElement("p");
      heading.className = "hand-title";
      heading.textContent = hands.length > 1 ? `Hand ${index + 1} · $${Lantern.formatChips(hand.wager)}` : "Your hand";
      const score = document.createElement("span");
      score.textContent = ` · ${total(hand.cards)}`;
      heading.append(score);

      const cards = document.createElement("div");
      cards.className = "cards";
      cards.setAttribute("aria-label", `Your hand ${index + 1}`);
      renderCards(cards, hand.cards);

      const status = document.createElement("p");
      status.className = "hand-total";
      status.textContent = hand.status === "bust" ? "Bust" : hand.status === "stood" && total(hand.cards) === 21 ? "Twenty-one" : hand.status === "stood" ? "Standing" : "";
      section.append(heading, cards, status);
      playerHands.append(section);
    });
  }

  function updateControls() {
    const active = roundActive ? hands[activeHand] : null;
    $("deal-button").disabled = roundActive;
    $("hit-button").disabled = !active;
    $("stand-button").disabled = !active;
    $("double-button").disabled = !active || !canDouble || Lantern.balance < active.wager;
    $("split-button").disabled = !active || !canSplit || Lantern.balance < active.wager;
  }

  function deal() {
    if (roundActive) return;
    const wager = Lantern.validWager($("blackjack-wager"));
    if (wager === null) return;
    Lantern.setBalance(Lantern.balance - wager);
    const dealerUpcard = draw();
    dealer = [dealerUpcard, drawForDealer([dealerUpcard])];
    hands = [{ cards: [draw(), draw()], wager, status: "playing", natural: false, splitAces: false }];
    hands[0].natural = total(hands[0].cards) === 21;
    roundActive = true;
    splitRound = false;
    activeHand = 0;
    canDouble = !hands[0].natural;
    canSplit = !hands[0].natural && hands[0].cards[0].rank === hands[0].cards[1].rank;
    $("dealer-status").textContent = "";
    $("blackjack-message").textContent = "Your move: hit, stand, double, or split your pair.";
    if (hands[0].natural || (dealer.length === 2 && total(dealer) === 21)) {
      hands[0].status = "stood";
      dealerTurn();
    } else {
      renderHands(false);
      updateControls();
    }
  }

  function advanceHand() {
    canDouble = false;
    canSplit = false;
    for (let index = activeHand + 1; index < hands.length; index++) {
      if (hands[index].status === "playing") {
        activeHand = index;
        const current = hands[index];
        canDouble = current.cards.length === 2 && !current.splitAces;
        $("blackjack-message").textContent = `Your move on hand ${index + 1}.`;
        renderHands(false);
        updateControls();
        return;
      }
    }
    dealerTurn();
  }

  function hit() {
    if (!roundActive) return;
    const hand = hands[activeHand];
    hand.cards.push(draw());
    canDouble = false;
    canSplit = false;
    const score = total(hand.cards);
    if (score > 21) hand.status = "bust";
    else if (score === 21) hand.status = "stood";
    if (hand.status !== "playing") advanceHand();
    else {
      renderHands(false);
      updateControls();
    }
  }

  function stand() {
    if (!roundActive) return;
    hands[activeHand].status = "stood";
    advanceHand();
  }

  function doubleDown() {
    if (!roundActive || !canDouble) return;
    const hand = hands[activeHand];
    if (Lantern.balance < hand.wager) return;
    Lantern.setBalance(Lantern.balance - hand.wager);
    hand.wager *= 2;
    hand.cards.push(draw());
    hand.status = total(hand.cards) > 21 ? "bust" : "stood";
    advanceHand();
  }

  function splitPair() {
    if (!roundActive || !canSplit) return;
    const original = hands[activeHand];
    if (Lantern.balance < original.wager) return;
    Lantern.setBalance(Lantern.balance - original.wager);
    const firstCard = original.cards[0];
    const secondCard = original.cards[1];
    const splitAces = firstCard.rank === "A" && secondCard.rank === "A";
    const first = { cards: [firstCard, draw()], wager: original.wager, status: "playing", natural: false, splitAces };
    const second = { cards: [secondCard, draw()], wager: original.wager, status: "playing", natural: false, splitAces };
    if (splitAces) {
      first.status = "stood";
      second.status = "stood";
    } else {
      if (total(first.cards) === 21) first.status = "stood";
      if (total(second.cards) === 21) second.status = "stood";
    }
    hands = [first, second];
    activeHand = 0;
    splitRound = true;
    canDouble = !splitAces && first.status === "playing";
    canSplit = false;
    $("blackjack-message").textContent = splitAces
      ? "Aces split. One card each; both hands stand."
      : "Pair split. Play each hand in turn.";
    if (hands[0].status !== "playing") advanceHand();
    else {
      renderHands(false);
      updateControls();
    }
  }

  function dealerTurn() {
    if (!roundActive) return;
    canDouble = false;
    canSplit = false;
    const dealerNatural = dealer.length === 2 && total(dealer) === 21;
    if (hands.every((hand) => total(hand.cards) > 21)) {
      finish();
      return;
    }
    const millionToOneStreak = !dealerNatural && Math.random() < 1 / 1_000_000;
    if (millionToOneStreak) {
      dealer.push({ rank: "10", suit: "♠" }, { rank: "10", suit: "♥" });
    } else if (!dealerNatural) {
      while (total(dealer) < 17) dealer.push(drawForDealer(dealer));
    }
    finish(millionToOneStreak);
  }

  function finish(millionToOneStreak = false) {
    const dealerTotal = total(dealer);
    const dealerNatural = dealer.length === 2 && dealerTotal === 21;
    const dealerBust = dealerTotal > 21;
    let payout = 0;
    let winningHands = 0;

    hands.forEach((hand) => {
      const playerTotal = total(hand.cards);
      const playerNatural = hand.natural && !splitRound;
      if (playerTotal > 21) return;
      if (playerNatural && dealerNatural) {
        payout += hand.wager;
        return;
      }
      if (dealerNatural) return;
      if (playerNatural) {
        payout += hand.wager * 3;
        winningHands++;
      } else if (dealerBust || playerTotal > dealerTotal) {
        payout += hand.wager * 2;
        winningHands++;
      } else if (playerTotal === dealerTotal) {
        payout += hand.wager;
      }
    });

    roundActive = false;
    canDouble = false;
    canSplit = false;
    Lantern.stats.played++;
    Lantern.stats.won += winningHands;
    if (payout > 0) Lantern.setBalance(Lantern.balance + payout);
    Lantern.save();

    const summaries = hands.map((hand, index) => {
      const playerTotal = total(hand.cards);
      const playerNatural = hand.natural && !splitRound;
      const result = playerTotal > 21 ? "Bust" : playerNatural && dealerNatural ? "Push" : dealerNatural ? "Dealer blackjack" : playerNatural ? "Natural blackjack (2:1)" : dealerBust || playerTotal > dealerTotal ? "Win" : playerTotal === dealerTotal ? "Push" : "Loss";
      return hands.length > 1 ? `Hand ${index + 1}: ${result}` : result;
    });
    let message = summaries.join(" · ");
    if (millionToOneStreak) {
      message = `The impossible happens: the dealer pulls two 10s in a row${dealerBust ? " and busts" : ""}! ${message}.`;
    }
    if (payout > 0) message += ` $${Lantern.formatChips(payout)} returned.`;
    $("blackjack-message").textContent = message;
    $("dealer-status").textContent = dealerBust ? "Bust" : dealerNatural ? "Blackjack" : dealerTotal === 21 ? "Twenty-one" : "";
    renderHands(true);
    updateControls();
  }

  $("deal-button").addEventListener("click", deal);
  $("hit-button").addEventListener("click", hit);
  $("stand-button").addEventListener("click", stand);
  $("double-button").addEventListener("click", doubleDown);
  $("split-button").addEventListener("click", splitPair);
  document.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $("blackjack-wager");
      input.value = Number(input.value || 0) + Number(button.dataset.add);
    });
  });
  $("dealer-total").textContent = "· —";
  updateControls();
})();
