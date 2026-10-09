(() => {
  "use strict";

  const bundles = {
    pocket: { name: "Pocketful", chips: 2500, price: "€1.99" },
    evening: { name: "Long Evening", chips: 7500, price: "€4.99" },
    highroller: { name: "High Roller", chips: 18000, price: "€9.99" }
  };
  const $ = (id) => document.getElementById(id);
  let selectedBundle = null;
  let processing = false;

  function updateOrder() {
    const bundle = selectedBundle ? bundles[selectedBundle] : null;
    $("order-summary").replaceChildren();
    const detail = document.createElement("span");
    detail.textContent = bundle ? `${bundle.name} · ${bundle.chips.toLocaleString()} chips` : "Select a bundle above";
    const price = document.createElement("strong");
    price.textContent = bundle ? `${bundle.price} · simulated` : "—";
    $("order-summary").append(detail, price);
    $("checkout-total").lastElementChild.textContent = bundle ? `${bundle.price} · NO CHARGE` : "—";
    $("place-order").disabled = !bundle || !$("demo-consent").checked || processing;
  }

  document.querySelectorAll(".bundle").forEach((button) => {
    button.addEventListener("click", () => {
      selectedBundle = button.dataset.bundle;
      document.querySelectorAll(".bundle").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
      updateOrder();
    });
  });
  $("demo-consent").addEventListener("change", updateOrder);

  $("place-order").addEventListener("click", () => {
    if (processing || !selectedBundle || !$("demo-consent").checked) return;
    processing = true;
    $("place-order").disabled = true;
    $("checkout-content").hidden = true;
    $("checkout-processing").hidden = false;
    const attemptNumber = `LL-${Math.floor(100000 + Math.random() * 900000)}`;
    const bundle = bundles[selectedBundle];
    const delay = 2200 + Math.floor(Math.random() * 1201);
    const failed = Math.random() < 0.12;

    $("processing-title").textContent = "Reviewing your order…";
    $("processing-description").textContent = `${bundle.name} · ${bundle.chips.toLocaleString()} demo chips · ${bundle.price} simulated`;
    setProcessingStep("order", "current", "Checking");
    setProcessingStep("auth", "", "Waiting");
    setProcessingStep("ledger", "", "Waiting");
    window.setTimeout(() => {
      setProcessingStep("order", "complete", "Complete");
      setProcessingStep("auth", "current", "Requesting");
      $("processing-title").textContent = "Requesting demo authorization…";
      $("processing-description").textContent = "Sending a fictional authorization request to the local demo clearing house.";
    }, 650);
    window.setTimeout(() => {
      if (failed) {
        setProcessingStep("auth", "failed", "Declined");
        $("processing-title").textContent = "Authorization not approved.";
        $("processing-description").textContent = "The simulated clearing house declined this demo attempt.";
      } else {
        setProcessingStep("auth", "complete", "Approved");
        setProcessingStep("ledger", "current", "Posting");
        $("processing-title").textContent = "Posting to the house ledger…";
        $("processing-description").textContent = "Demo authorization approved. Updating your browser-only chip balance.";
      }
    }, 1450);

    window.setTimeout(() => {
      $("checkout-processing").hidden = true;
      processing = false;
      const completedAt = new Date();
      const timestamp = completedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
      if (failed) {
        setProcessingStep("auth", "failed", "Declined");
        $("attempt-number").textContent = attemptNumber;
        $("failed-bundle").textContent = `${bundle.name} · ${bundle.chips.toLocaleString()} chips`;
        $("failed-total").textContent = `${bundle.price} · simulated`;
        $("attempt-time").textContent = timestamp;
        $("failure-balance").textContent = `${Lantern.formatChips(Lantern.balance)} chips`;
        $("failure-message").textContent = "The simulated authorization was declined. No charge was made, and no chips were added.";
        $("purchase-failure").hidden = false;
        return;
      }

      setProcessingStep("ledger", "complete", "Posted");
      Lantern.setBalance(Lantern.balance + bundle.chips);
      $("receipt-balance").textContent = `${Lantern.formatChips(Lantern.balance)} chips`;
      $("purchase-confirmation").textContent = `${bundle.chips.toLocaleString()} play chips from your ${bundle.name} bundle have been added to your purse.`;
      $("order-number").textContent = attemptNumber;
      $("confirmation-time").textContent = timestamp;
      $("receipt-bundle").textContent = `${bundle.name} · ${bundle.chips.toLocaleString()} chips`;
      $("receipt-total").textContent = `${bundle.price} · simulated · no charge`;
      $("authorization-code").textContent = `DEMO-${Math.floor(10000000 + Math.random() * 90000000)}`;
      $("purchase-result").hidden = false;
    }, delay);
  });

  function setProcessingStep(step, state, label) {
    const row = $(`processing-step-${step}`);
    row.classList.remove("current", "complete", "failed");
    if (state) row.classList.add(state);
    row.lastElementChild.textContent = label;
  }

  $("retry-purchase").addEventListener("click", () => {
    $("purchase-failure").hidden = true;
    $("checkout-content").hidden = false;
    updateOrder();
  });
  $("return-to-order").addEventListener("click", () => {
    $("purchase-failure").hidden = true;
    $("checkout-content").hidden = false;
    selectedBundle = null;
    document.querySelectorAll(".bundle").forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
    updateOrder();
  });

  updateOrder();
})();
