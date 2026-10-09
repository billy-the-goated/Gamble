(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const symbols = [
    { icon: "🍒", label: "Cherries", multiplier: 5 },
    { icon: "🏮", label: "Lanterns", multiplier: 12 },
    { icon: "⭐", label: "Golden stars", multiplier: 50 }
  ];
  const canvas = $("scratch-canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let ticket = null;
  let scratching = false;
  let scratched = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (ticket && !ticket.revealed) paintCover();
  }

  function paintCover() {
    const rect = canvas.getBoundingClientRect();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#a38a53";
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "rgba(39,31,20,.27)";
    context.lineWidth = 1;
    for (let x = -rect.height; x < rect.width + rect.height; x += 11) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + rect.height, rect.height);
      context.stroke();
    }
    context.fillStyle = "rgba(42,31,15,.72)";
    context.font = "10px 'DM Mono', monospace";
    context.textAlign = "center";
    context.fillText("✦   SCRATCH HERE   ✦", rect.width / 2, rect.height / 2 + 4);
  }

  function revealTicket() {
    if (!ticket || ticket.revealed) return;
    ticket.revealed = true;
    context.globalCompositeOperation = "destination-out";
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";
    const result = $("ticket-result");
    result.replaceChildren();
    const symbolsLine = document.createElement("strong");
    symbolsLine.textContent = ticket.icons.join("   ");
    const resultText = document.createElement("span");
    resultText.textContent = ticket.prize ? `${ticket.label} · ${ticket.prize} chips` : "No match this time — better luck on the next one";
    result.append(symbolsLine, resultText);

    Lantern.stats.played++;
    if (ticket.prize) {
      Lantern.stats.won++;
      Lantern.setBalance(Lantern.balance + ticket.prize);
      $("scratch-message").textContent = `A winner! ${ticket.prize} chips go straight to your purse.`;
    } else {
      $("scratch-message").textContent = "No prize on this ticket. There's always another.";
    }
    Lantern.save();
    $("buy-ticket").disabled = false;
    $("reveal-ticket").disabled = true;
    $("ticket-placeholder").hidden = false;
    $("ticket-placeholder").innerHTML = "<strong>✦ &nbsp; REVEALED &nbsp; ✦</strong><span>BUY ANOTHER TICKET</span>";
  }

  function buyTicket() {
    if (ticket && !ticket.revealed) {
      Lantern.showToast("Scratch or reveal your current ticket first.");
      return;
    }
    if (Lantern.balance < 10) {
      Lantern.showToast("You need 10 chips to buy a ticket.");
      return;
    }
    Lantern.setBalance(Lantern.balance - 10);
    const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const isWin = Math.random() < 0.35;
    const icons = isWin
      ? [winningSymbol.icon, winningSymbol.icon, winningSymbol.icon]
      : [winningSymbol.icon, symbols[(symbols.indexOf(winningSymbol) + 1) % symbols.length].icon, symbols[(symbols.indexOf(winningSymbol) + 2) % symbols.length].icon];
    for (let i = icons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [icons[i], icons[j]] = [icons[j], icons[i]];
    }
    ticket = { icons, prize: isWin ? 10 * winningSymbol.multiplier : 0, label: isWin ? winningSymbol.label : "", revealed: false };
    $("ticket-result").replaceChildren();
    $("scratch-message").textContent = "Good luck. Rub the ticket to find out.";
    $("buy-ticket").disabled = true;
    $("reveal-ticket").disabled = false;
    $("ticket-placeholder").hidden = true;
    canvas.style.display = "block";
    resize();
    paintCover();
  }

  function scratchAt(event) {
    if (!ticket || ticket.revealed || !scratching) return;
    const rect = canvas.getBoundingClientRect();
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(event.clientX - rect.left, event.clientY - rect.top, 17, 0, Math.PI * 2);
    context.fill();
    scratched++;
    if (scratched < 7) return;
    scratched = 0;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < pixels.data.length; i += 16) {
      if (pixels.data[i] < 80) transparent++;
    }
    if (transparent / (pixels.data.length / 16) > 0.46) revealTicket();
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!ticket || ticket.revealed) return;
    scratching = true;
    canvas.setPointerCapture(event.pointerId);
    scratchAt(event);
  });
  canvas.addEventListener("pointermove", scratchAt);
  canvas.addEventListener("pointerup", () => { scratching = false; });
  canvas.addEventListener("pointercancel", () => { scratching = false; });
  window.addEventListener("resize", resize);
  $("buy-ticket").addEventListener("click", buyTicket);
  $("reveal-ticket").addEventListener("click", revealTicket);
  canvas.style.display = "none";
})();
