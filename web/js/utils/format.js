export const DAY_LABELS_ES = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export const DAY_ORDER = ["friday", "saturday", "sunday"];

export const CATEGORY_LABELS = {
  entretenimiento: "Entretenimiento",
  decoracion: "Decoración",
  catering: "Catering",
  bar: "Bar y bebidas",
  foto: "Foto y video",
  personal: "Personal",
  salon: "Salón / logística",
  extras: "Extras",
};

export const ROLE_LABELS = {
  coordinador: "Coordinador",
  bartender: "Bartender",
  cocina: "Cocina",
  mesero: "Mesero / Server",
};

export const TIER_BADGE = {
  gold: "gold",
  platino: "platino",
  diamante: "diamante",
  deluxe: "deluxe",
  bs_basico: "accent",
  bs_completo: "ok",
};

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function dayLabel(day) {
  if (day == null) return "Cualquier día";
  return DAY_LABELS_ES[day] || day;
}

export function venueLabel(venues, id) {
  return venues.find((v) => v.id === id)?.name || id;
}

export function statusLabel(status) {
  if (status === "available") return "Disponible";
  if (status === "not_sold") return "No se vende";
  if (status === "unavailable_venue") return "No aplica";
  return status || "—";
}
