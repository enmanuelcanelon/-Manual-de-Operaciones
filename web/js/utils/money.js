/** Round half-up to cents. */
export function roundMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  return Math.round(Number(n) * 100) / 100;
}

export function formatMoney(amount, { showCents = "auto" } = {}) {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  const cents = showCents === true || (showCents === "auto" && Math.abs(n % 1) > 1e-9);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);
}

export function formatServicePrice(service) {
  if (!service) return "—";
  if (service.pricingType === "included") return "Incluido";
  if (service.pricingType === "derived") return "Según salón";
  if (service.amount == null) return "—";

  let primary = formatMoney(service.amount);
  if (service.pricingType === "additive") primary = `+${primary}`;
  if (service.pricingType === "per_person" || service.unit === "persona") {
    primary = `${primary} / persona`;
  } else if (service.unit === "botella") {
    primary = `${primary} / botella`;
  }

  if (service.servesPeople) {
    return `${primary} (${service.servesPeople} personas)`;
  }

  if (service.amountSecondary != null) {
    let secondary = formatMoney(service.amountSecondary);
    if (service.pricingTypeSecondary === "per_person" || service.unitSecondary === "persona") {
      secondary = `${secondary} / persona`;
    }
    return `${primary} · o ${secondary}`;
  }
  return primary;
}
