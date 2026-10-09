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

    window.setTimeout(() => {
      const bundle = bundles[selectedBundle];
      Lantern.setBalance(Lantern.balance + bundle.chips);
      $("receipt-balance").textContent = `${Lantern.formatChips(Lantern.balance)} chips`;
      $("purchase-confirmation").textContent = `${bundle.chips.toLocaleString()} play chips from your ${bundle.name} bundle have been added to your purse.`;
      $("order-number").textContent = `LL-${Math.floor(100000 + Math.random() * 900000)}`;
      $("checkout-processing").hidden = true;
      $("purchase-result").hidden = false;
      processing = false;
    }, 1100);
  });

  updateOrder();
})();
