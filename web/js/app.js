import { createStore } from "./store.js";
import {
  renderBabyShower,
  renderEditar,
  renderHome,
  renderNotFound,
  renderPaqueteDetalle,
  renderPaquetes,
  renderPersonal,
  renderPoliticas,
  renderSalones,
  renderServicios,
} from "./views/pages.js";

const store = createStore();
const appRoot = () => document.getElementById("app-content");
const toastHost = () => document.getElementById("toast-host");

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  toastHost().appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function parseRoute() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [pathPart, qs] = raw.split("?");
  const path = pathPart || "/";
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  const parts = path.split("/").filter(Boolean);
  return { path, parts, query };
}

function setActiveNav(path) {
  const section = partsToSection(path);
  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.classList.toggle("is-active", a.getAttribute("data-nav") === section);
  });
}

function partsToSection(path) {
  if (path === "/" || path === "") return "home";
  if (path.startsWith("/salones")) return "salones";
  if (path.startsWith("/paquetes")) return "paquetes";
  if (path.startsWith("/baby-shower")) return "baby-shower";
  if (path.startsWith("/servicios")) return "servicios";
  if (path.startsWith("/personal")) return "personal";
  if (path.startsWith("/politicas")) return "politicas";
  if (path.startsWith("/editar")) return "editar";
  return "";
}

function render() {
  const state = store.getState();
  if (!state.catalog) return;

  const { path, parts, query } = parseRoute();
  setActiveNav(path.startsWith("/") ? path : `/${path}`);
  updateChrome(state);

  let html;
  if (path === "/" || path === "") {
    html = renderHome(state);
  } else if (path === "/salones") {
    html = renderSalones(state);
  } else if (path === "/paquetes") {
    html = renderPaquetes(state, query);
  } else if (parts[0] === "paquetes" && parts[1]) {
    html = renderPaqueteDetalle(state, parts[1], query);
  } else if (path === "/baby-shower") {
    html = renderBabyShower(state);
  } else if (path === "/servicios") {
    html = renderServicios(state);
  } else if (path === "/personal") {
    html = renderPersonal(state);
  } else if (path === "/politicas") {
    html = renderPoliticas(state);
  } else if (path === "/editar") {
    html = renderEditar(state);
  } else {
    html = renderNotFound();
  }

  appRoot().innerHTML = html;

  // fill export box if present
  const exportBox = document.getElementById("export-box");
  if (exportBox) exportBox.value = store.exportOverrides();

  closeSidebar();
}

function updateChrome(state) {
  const editToggle = document.getElementById("edit-toggle");
  const editLabel = document.getElementById("edit-label");
  const badge = document.getElementById("override-badge");
  const params = new URLSearchParams(location.search);
  const forcedReadOnly = params.get("edit") === "0";

  if (editToggle) {
    editToggle.checked = state.editMode;
    editToggle.disabled = forcedReadOnly;
  }
  if (editLabel) {
    editLabel.textContent = forcedReadOnly
      ? "Solo lectura"
      : state.editMode
        ? "Modo edición"
        : "Solo lectura";
  }
  if (badge) {
    if (state.overrideCount > 0) {
      badge.hidden = false;
      badge.textContent = `${state.overrideCount} local`;
    } else {
      badge.hidden = true;
    }
  }

  const editNav = document.querySelector('[data-nav="editar"]');
  if (editNav) editNav.style.display = state.editMode || !forcedReadOnly ? "" : "none";
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("is-open");
  document.getElementById("sidebar-backdrop")?.classList.remove("is-open");
}

function openSidebar() {
  document.getElementById("sidebar")?.classList.add("is-open");
  document.getElementById("sidebar-backdrop")?.classList.add("is-open");
}

function onClick(e) {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.getAttribute("data-action");

  try {
    switch (action) {
      case "save-service": {
        const id = t.getAttribute("data-service");
        const amountEl = document.querySelector(`[data-svc-amount="${id}"]`);
        const amount2El = document.querySelector(`[data-svc-amount2="${id}"]`);
        const patch = { amount: Number(amountEl.value) };
        if (amount2El) patch.amountSecondary = Number(amount2El.value);
        store.updateServicePrice(id, patch);
        toast("Precio de servicio guardado");
        break;
      }
      case "restore-service": {
        store.restoreServicePrice(t.getAttribute("data-service"));
        toast("Servicio restaurado al seed");
        break;
      }
      case "save-pkg-price": {
        const packageId = t.getAttribute("data-package");
        const venueId = t.getAttribute("data-venue");
        const dayAttr = t.getAttribute("data-day");
        const day = dayAttr === "" ? null : dayAttr;
        const priceInput = document.querySelector("[data-pkg-price-input]");
        const statusInput = document.querySelector("[data-pkg-status-input]");
        const status = statusInput.value;
        const price = status === "not_sold" ? null : Number(priceInput.value);
        store.updatePackagePrice({ packageId, venueId, day, price, status });
        toast("Precio de paquete guardado");
        break;
      }
      case "restore-pkg-price": {
        const dayAttr = t.getAttribute("data-day");
        store.restorePackagePrice(
          t.getAttribute("data-package"),
          t.getAttribute("data-venue"),
          dayAttr === "" ? null : dayAttr
        );
        toast("Precio restaurado");
        break;
      }
      case "remove-inclusion": {
        store.removeInclusion(t.getAttribute("data-package"), t.getAttribute("data-service"));
        toast("Servicio quitado del paquete");
        break;
      }
      case "add-inclusion": {
        const packageId = t.getAttribute("data-package");
        const select = document.querySelector(`[data-add-service-for="${packageId}"]`);
        if (!select?.value) {
          toast("Elige un servicio");
          return;
        }
        store.addInclusion(packageId, select.value);
        toast("Servicio agregado");
        break;
      }
      case "restore-inclusions": {
        if (confirm("¿Restaurar inclusiones del seed para este paquete?")) {
          store.restorePackageInclusions(t.getAttribute("data-package"));
          toast("Inclusiones restauradas");
        }
        break;
      }
      case "duplicate-package": {
        const name = prompt("Nombre de la variante:");
        if (!name) return;
        const id = store.duplicatePackage(t.getAttribute("data-package"), name);
        if (id) {
          toast("Paquete duplicado");
          location.hash = `#/paquetes/${id}`;
        }
        break;
      }
      case "remove-custom": {
        if (confirm("¿Eliminar este paquete custom?")) {
          store.removeCustomPackage(t.getAttribute("data-package"));
          toast("Paquete eliminado");
          location.hash = "#/paquetes";
        }
        break;
      }
      case "save-venue": {
        const venueId = t.getAttribute("data-venue");
        const fields = ["hourlyRate", "extraHourWithPackage", "extraHourWithoutPackage"];
        const patch = {};
        for (const f of fields) {
          const input = document.querySelector(`[data-venue-field="${f}"][data-venue="${venueId}"]`);
          if (input) patch[f] = Number(input.value);
        }
        store.updateVenue(venueId, patch);
        toast("Tarifas de salón guardadas");
        break;
      }
      case "save-fees": {
        const serviceFeePercent = Number(document.querySelector('[data-fee="serviceFeePercent"]').value);
        const taxPercent = Number(document.querySelector('[data-fee="taxPercent"]').value);
        store.updateFees({ serviceFeePercent, taxPercent });
        toast("Fees actualizados");
        break;
      }
      case "save-guest": {
        const kind = t.getAttribute("data-kind");
        const min = Number(document.querySelector(`[data-guest="${kind}"][data-field="min"]`).value);
        const max = Number(document.querySelector(`[data-guest="${kind}"][data-field="max"]`).value);
        store.updateGuestAddOn(kind, { min, max });
        toast("Rango de invitado adicional guardado");
        break;
      }
      case "reset-all": {
        if (confirm("¿Borrar TODOS los cambios locales y volver al seed?")) {
          store.resetAllOverrides();
          toast("Catálogo local restaurado");
        }
        break;
      }
      case "export-download": {
        const blob = new Blob([store.exportOverrides()], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `ops-manual-overrides-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast("Descarga lista");
        break;
      }
      case "export-copy": {
        navigator.clipboard.writeText(store.exportOverrides()).then(
          () => toast("Copiado al portapapeles"),
          () => toast("No se pudo copiar")
        );
        break;
      }
      case "import-replace":
      case "import-merge": {
        const text = document.getElementById("import-box")?.value || "";
        if (!text.trim()) {
          toast("Pega un JSON primero");
          return;
        }
        store.importOverrides(text, action === "import-merge" ? "merge" : "replace");
        toast(action === "import-merge" ? "Importación fusionada" : "Importación reemplazada");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(err);
    toast(err.message || "Error");
  }
}

function onChange(e) {
  const filter = e.target.getAttribute("data-filter");
  if (filter === "venue" || filter === "day") {
    const venue = document.querySelector('[data-filter="venue"]')?.value || "diamond";
    const day = document.querySelector('[data-filter="day"]')?.value || "friday";
    location.hash = `#/paquetes?venue=${venue}&day=${day}`;
    return;
  }

  const detail = e.target.getAttribute("data-detail-filter");
  if (detail === "venue" || detail === "day") {
    const { parts } = parseRoute();
    const pkgId = parts[1];
    const venue = document.querySelector('[data-detail-filter="venue"]')?.value;
    const dayEl = document.querySelector('[data-detail-filter="day"]');
    if (dayEl) {
      location.hash = `#/paquetes/${pkgId}?venue=${venue}&day=${dayEl.value}`;
    } else {
      location.hash = `#/paquetes/${pkgId}?venue=${venue}`;
    }
  }
}

async function main() {
  document.getElementById("menu-toggle")?.addEventListener("click", openSidebar);
  document.getElementById("sidebar-backdrop")?.addEventListener("click", closeSidebar);
  document.getElementById("edit-toggle")?.addEventListener("change", (e) => {
    store.setEditMode(e.target.checked);
    toast(e.target.checked ? "Modo edición activo" : "Solo lectura");
  });

  document.body.addEventListener("click", onClick);
  document.body.addEventListener("change", onChange);
  window.addEventListener("hashchange", render);

  store.subscribe(() => render());

  try {
    await store.init();
    if (!location.hash) location.hash = "#/";
    else render();
  } catch (err) {
    console.error(err);
    appRoot().innerHTML = `
      <div class="callout callout--danger">
        <div class="callout__body">
          <strong>No se pudo cargar el manual</strong>
          <p>Sirve la carpeta <code>web/</code> por HTTP (no abras el HTML con file://). Ejemplo: <code>python3 -m http.server 8080</code> dentro de <code>web/</code>.</p>
          <p class="small">${err.message}</p>
        </div>
      </div>`;
  }
}

main();
