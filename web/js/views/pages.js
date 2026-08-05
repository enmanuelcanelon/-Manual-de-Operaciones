import { formatMoney, formatServicePrice } from "../utils/money.js";
import {
  CATEGORY_LABELS,
  DAY_LABELS_ES,
  DAY_ORDER,
  ROLE_LABELS,
  TIER_BADGE,
  dayLabel,
  escapeHtml,
  statusLabel,
  venueLabel,
} from "../utils/format.js";

function badge(text, kind = "") {
  const cls = kind ? `badge badge--${kind}` : "badge";
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

function callout(title, text, kind = "info", icon = "ℹ️") {
  return `
    <div class="callout callout--${kind}">
      <div class="callout__icon" aria-hidden="true">${icon}</div>
      <div class="callout__body">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(text)}</p>
      </div>
    </div>`;
}

function pageHeader(title, subtitle) {
  return `
    <header class="page-header">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    </header>`;
}

function tierBadge(pkg) {
  const kind = TIER_BADGE[pkg.id] || (pkg.family === "custom" ? "accent" : "");
  return badge(pkg.name, kind);
}

function serviceName(catalog, id) {
  return catalog.services.find((s) => s.id === id)?.name || id;
}

function priceDisplay(row) {
  if (!row) return `<span class="price-cell is-na">—</span>`;
  if (row.status === "not_sold") return `<span class="price-cell is-na">No se vende</span>`;
  if (row.status === "unavailable_venue") return `<span class="price-cell is-na">No aplica</span>`;
  return `<span class="price-cell num">${escapeHtml(formatMoney(row.price))}</span>`;
}

function inclusionList(catalog, pkg, { editMode, packageId }) {
  const items = pkg.inclusionServiceIds
    .map((id) => {
      const name = serviceName(catalog, id);
      const removeBtn = editMode
        ? `<button type="button" class="btn btn--sm btn--ghost" data-action="remove-inclusion" data-package="${escapeHtml(packageId)}" data-service="${escapeHtml(id)}" title="Quitar">✕</button>`
        : "";
      return `<li><span><span class="check">✓</span>${escapeHtml(name)}</span>${removeBtn}</li>`;
    })
    .join("");
  return `<ul class="inclusion-list">${items || '<li class="faint">Sin inclusiones</li>'}</ul>`;
}

function addServicePicker(catalog, pkg) {
  const included = new Set(pkg.inclusionServiceIds);
  const options = catalog.services
    .filter((s) => !included.has(s.id))
    .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`)
    .join("");
  return `
    <div class="row" style="margin-top:1rem">
      <label class="field" style="flex:1;margin:0">
        <span class="sr-only">Agregar servicio</span>
        <select data-add-service-for="${escapeHtml(pkg.id)}">
          <option value="">+ Agregar servicio al paquete…</option>
          ${options}
        </select>
      </label>
      <button type="button" class="btn btn--secondary" data-action="add-inclusion" data-package="${escapeHtml(pkg.id)}">Agregar</button>
    </div>`;
}

/* ========== HOME ========== */
export function renderHome(state) {
  const { catalog, editMode, overrideCount } = state;
  const fees = catalog.fees;
  const guest = catalog.guestAddOn;

  return `
    ${pageHeader(
      "Manual de Operaciones",
      "Todo lo que necesitas para cotizar y operar: salones, paquetes, precios y políticas en un solo lugar."
    )}

    <div class="stack">
      ${
        overrideCount > 0
          ? callout(
              "Borradores locales activos",
              `Hay ${overrideCount} cambio(s) en este navegador. No son la tarifa oficial hasta exportarlos al seed. Ve a Edición / Backup para exportar o restaurar.`,
              "warn",
              "✎"
            )
          : callout(
              "Catálogo oficial",
              "Estás viendo los precios del seed. Activa Modo edición solo en la máquina del gerente para borradores.",
              "ok",
              "✓"
            )
      }

      ${callout(
        `Service Fee ${fees.serviceFeePercent}% + Tax ${fees.taxPercent}%`,
        `${fees.notes} Son negociables solo con criterio comercial (ver Políticas).`,
        "info",
        "%"
      )}

      ${callout(
        "No negociable",
        "El precio por hora del salón (mínimo 4 horas) es estrictamente no negociable. Los sábados no son negociables en ningún paquete ni salón.",
        "danger",
        "⛔"
      )}

      <section class="section">
        <h2>Accesos rápidos</h2>
        <div class="quick-links">
          <a class="quick-link" href="#/paquetes"><strong>Paquetes</strong><span>Gold → Deluxe por día</span></a>
          <a class="quick-link" href="#/baby-shower"><strong>Baby Shower</strong><span>Básico y Completo</span></a>
          <a class="quick-link" href="#/servicios"><strong>A la carta</strong><span>Servicios y extras</span></a>
          <a class="quick-link" href="#/salones"><strong>Salones</strong><span>Capacidad y $/hr</span></a>
          <a class="quick-link" href="#/personal"><strong>Personal</strong><span>Escalones 4 / 6 / 8</span></a>
          <a class="quick-link" href="#/politicas"><strong>Políticas</strong><span>Descuentos e intercambios</span></a>
          ${editMode ? `<a class="quick-link" href="#/editar"><strong>Edición</strong><span>Exportar / restaurar</span></a>` : ""}
        </div>
      </section>

      <section class="section">
        <h2>Invitado adicional</h2>
        <div class="grid-2">
          <div class="card">
            <div class="card__meta">${badge("Baby Shower", "accent")}</div>
            <div class="card__price num">${formatMoney(guest.babyShower.min)} – ${formatMoney(guest.babyShower.max)} <small>/ persona</small></div>
            ${
              editMode
                ? `<div class="row">
                    <label class="field" style="margin:0"><span>Mín</span><input type="number" min="0" step="1" data-guest="babyShower" data-field="min" value="${guest.babyShower.min}"></label>
                    <label class="field" style="margin:0"><span>Máx</span><input type="number" min="0" step="1" data-guest="babyShower" data-field="max" value="${guest.babyShower.max}"></label>
                    <button type="button" class="btn btn--sm btn--primary" data-action="save-guest" data-kind="babyShower">Guardar</button>
                  </div>`
                : ""
            }
          </div>
          <div class="card">
            <div class="card__meta">${badge("Otros paquetes", "platino")}</div>
            <div class="card__price num">${formatMoney(guest.otherPackages.min)} – ${formatMoney(guest.otherPackages.max)} <small>/ persona</small></div>
            ${
              editMode
                ? `<div class="row">
                    <label class="field" style="margin:0"><span>Mín</span><input type="number" min="0" step="1" data-guest="otherPackages" data-field="min" value="${guest.otherPackages.min}"></label>
                    <label class="field" style="margin:0"><span>Máx</span><input type="number" min="0" step="1" data-guest="otherPackages" data-field="max" value="${guest.otherPackages.max}"></label>
                    <button type="button" class="btn btn--sm btn--primary" data-action="save-guest" data-kind="otherPackages">Guardar</button>
                  </div>`
                : ""
            }
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Escala de paquetes</h2>
        <div class="ladder">
          ${catalog.packages
            .filter((p) => p.family === "event")
            .sort((a, b) => a.tierOrder - b.tierOrder)
            .map(
              (p) => `
              <div class="ladder-step">
                <div class="card card--soft">
                  <div class="row-between">
                    <div>
                      ${tierBadge(p)}
                      <p class="small" style="margin:0.4rem 0 0">${escapeHtml(p.description)}</p>
                    </div>
                    <a class="btn btn--sm btn--secondary" href="#/paquetes/${escapeHtml(p.id)}">Ver</a>
                  </div>
                </div>
              </div>`
            )
            .join("")}
        </div>
      </section>
    </div>`;
}

/* ========== SALONES ========== */
export function renderSalones(state) {
  const { catalog, editMode } = state;
  const sch = catalog.schedules;

  return `
    ${pageHeader("Salones y disponibilidad", "Capacidad, tarifas por hora y ventanas de venta.")}

    <div class="stack">
      ${callout(
        "Capacidad vs personal",
        catalog.contentNotes.find((n) => n.id === "capacity_vs_staffing")?.text || "",
        "warn",
        "!"
      )}

      <div class="grid-2">
        ${catalog.venues
          .map((v) => {
            return `
            <article class="card">
              <div class="card__meta">
                ${badge(v.locationNote || "Venue", "accent")}
                ${badge(`Máx. ${v.capacityMax} pax`, "warn")}
              </div>
              <h2 class="card__title">${escapeHtml(v.name)}</h2>
              <div class="grid-2" style="gap:0.75rem">
                <div class="stat">
                  <strong class="num">${
                    editMode
                      ? `<input class="inline-edit" style="width:5.5rem;border:1px solid var(--border-strong);border-radius:6px;padding:0.25rem 0.4rem" type="number" min="0" data-venue-field="hourlyRate" data-venue="${v.id}" value="${v.hourlyRate}">`
                      : formatMoney(v.hourlyRate)
                  }</strong>
                  <span>/ hora (mín. ${v.minHours} h)</span>
                </div>
                <div class="stat">
                  <strong class="num">${
                    editMode
                      ? `<input style="width:5.5rem;border:1px solid var(--border-strong);border-radius:6px;padding:0.25rem 0.4rem" type="number" min="0" data-venue-field="extraHourWithPackage" data-venue="${v.id}" value="${v.extraHourWithPackage}">`
                      : formatMoney(v.extraHourWithPackage)
                  }</strong>
                  <span>Hora extra con paquete</span>
                </div>
                <div class="stat">
                  <strong class="num">${
                    editMode
                      ? `<input style="width:5.5rem;border:1px solid var(--border-strong);border-radius:6px;padding:0.25rem 0.4rem" type="number" min="0" data-venue-field="extraHourWithoutPackage" data-venue="${v.id}" value="${v.extraHourWithoutPackage}">`
                      : formatMoney(v.extraHourWithoutPackage)
                  }</strong>
                  <span>Hora extra sin paquete</span>
                </div>
                <div class="stat">
                  <strong class="num">${v.capacityMax}</strong>
                  <span>Capacidad máxima</span>
                </div>
              </div>
              ${
                editMode
                  ? `<div style="margin-top:0.75rem"><button type="button" class="btn btn--sm btn--primary" data-action="save-venue" data-venue="${v.id}">Guardar tarifas</button></div>`
                  : ""
              }
              ${badge("No negociable $/hr", "danger")}
            </article>`;
          })
          .join("")}
      </div>

      <section class="section">
        <h2>Venta por hora (general)</h2>
        <div class="card">
          <p><strong>Días:</strong> ${sch.generalHourlySale.days.map((d) => DAY_LABELS_ES[d] || d).join(", ")}</p>
          <p><strong>Ventana:</strong> ${escapeHtml(sch.generalHourlySale.window)}</p>
          <p class="small">${escapeHtml(sch.generalHourlySale.notes)}</p>
        </div>
      </section>

      <section class="section">
        <h2>Horarios de paquetes (cualquier salón)</h2>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Día</th><th>Ventanas</th></tr></thead>
            <tbody>
              ${Object.entries(sch.packageByDay || sch.revolutionByDay || {})
                .map(([day, windows]) => {
                  const w =
                    windows[0] === "any"
                      ? "Cualquier hora"
                      : windows.join(" · ");
                  return `<tr><td>${escapeHtml(dayLabel(day))}</td><td>${escapeHtml(w)}</td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
}

/* ========== PAQUETES LIST ========== */
export function renderPaquetes(state, query = {}) {
  const { catalog, editMode } = state;
  const venue = query.venue || "diamond";
  const day = query.day || "friday";
  const eventPkgs = catalog.packages
    .filter((p) => p.family === "event" || p.family === "custom")
    .filter((p) => p.venueIds.includes(venue))
    .sort((a, b) => a.tierOrder - b.tierOrder);

  const matrixRows = ["gold", "platino", "diamante", "deluxe"].filter((id) =>
    catalog.packages.some((p) => p.id === id && p.venueIds.includes(venue))
  );

  return `
    ${pageHeader("Paquetes de evento", "Vista por salón y día. Abre cada paquete para ver y editar inclusiones.")}

    <div class="filters">
      <label>Salón
        <select data-filter="venue">
          ${catalog.venues
            .map(
              (v) =>
                `<option value="${v.id}" ${v.id === venue ? "selected" : ""}>${escapeHtml(v.name)}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Día
        <select data-filter="day">
          ${DAY_ORDER.map(
            (d) =>
              `<option value="${d}" ${d === day ? "selected" : ""}>${dayLabel(d)}</option>`
          ).join("")}
        </select>
      </label>
      ${editMode ? `<span class="edit-hint">Modo edición</span>` : ""}
    </div>

    <section class="section">
      <h2>Matriz de precios — ${escapeHtml(venueLabel(catalog.venues, venue))}</h2>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Paquete</th>
              ${DAY_ORDER.map((d) => `<th>${dayLabel(d)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${matrixRows
              .map((pid) => {
                const pkg = catalog.packages.find((p) => p.id === pid);
                return `<tr>
                  <td>${tierBadge(pkg)} <a href="#/paquetes/${pid}?venue=${venue}&day=${day}">detalle</a></td>
                  ${DAY_ORDER.map((d) => {
                    const row = catalog.packagePrices.find(
                      (r) => r.packageId === pid && r.venueId === venue && r.day === d
                    );
                    return `<td>${priceDisplay(row)}</td>`;
                  }).join("")}
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="tiny faint" style="margin-top:0.5rem">+${catalog.fees.serviceFeePercent}% Service Fee y +${catalog.fees.taxPercent}% Tax se aplican por defecto a toda cotización de paquete.</p>
      ${callout(
        "Sábados no negociables",
        "En ningún paquete ni salón se negocia el sábado (precio, descuentos ni condiciones).",
        "danger",
        "⛔"
      )}
    </section>

    <section class="section">
      <h2>Paquetes — ${dayLabel(day)} ${day === "saturday" ? badge("No negociable", "danger") : ""}</h2>
      <div class="grid-auto">
        ${eventPkgs
          .map((pkg) => {
            const row = catalog.packagePrices.find(
              (r) => r.packageId === pkg.id && r.venueId === venue && r.day === day
            );
            const priceHtml =
              row?.status === "available"
                ? `<div class="card__price num">${formatMoney(row.price)}</div>`
                : `<div class="card__price" style="font-size:1.1rem;color:var(--text-faint)">${statusLabel(row?.status || "not_sold")}</div>`;
            return `
              <a class="card card--clickable" href="#/paquetes/${escapeHtml(pkg.id)}?venue=${venue}&day=${day}">
                <div class="card__meta">${tierBadge(pkg)} ${badge(`${pkg.inclusionServiceIds.length} servicios`)}</div>
                <h3 class="card__title">${escapeHtml(pkg.name)}</h3>
                ${priceHtml}
                <p class="small" style="margin:0">${escapeHtml(pkg.description || "")}</p>
              </a>`;
          })
          .join("")}
      </div>
    </section>

    <p class="small muted">Invitado adicional (otros paquetes): <strong class="num">${formatMoney(catalog.guestAddOn.otherPackages.min)} – ${formatMoney(catalog.guestAddOn.otherPackages.max)}</strong> / persona</p>
  `;
}

/* ========== PACKAGE DETAIL ========== */
export function renderPaqueteDetalle(state, packageId, query = {}) {
  const { catalog, editMode } = state;
  const pkg = catalog.packages.find((p) => p.id === packageId);
  if (!pkg) {
    return `${pageHeader("Paquete no encontrado")}<p><a href="#/paquetes">← Volver</a></p>`;
  }

  const venue = query.venue || pkg.venueIds[0];
  const day = pkg.family === "baby_shower" ? null : query.day || "friday";
  const row = catalog.packagePrices.find(
    (r) => r.packageId === pkg.id && r.venueId === venue && (r.day ?? null) === (day ?? null)
  );

  const venueOptions = pkg.venueIds
    .map(
      (id) =>
        `<option value="${id}" ${id === venue ? "selected" : ""}>${escapeHtml(venueLabel(catalog.venues, id))}</option>`
    )
    .join("");

  const daySelect =
    pkg.family === "baby_shower"
      ? ""
      : `<label>Día
          <select data-detail-filter="day">
            ${DAY_ORDER.map(
              (d) => `<option value="${d}" ${d === day ? "selected" : ""}>${dayLabel(d)}</option>`
            ).join("")}
          </select>
        </label>`;

  const priceBlock =
    row?.status === "available"
      ? `<div class="pkg-hero__price num">${formatMoney(row.price)}</div>`
      : `<div class="pkg-hero__price" style="font-size:1.4rem;color:var(--text-faint)">${statusLabel(row?.status)}</div>`;

  const guest =
    pkg.family === "baby_shower"
      ? catalog.guestAddOn.babyShower
      : catalog.guestAddOn.otherPackages;

  return `
    <p class="small"><a href="${pkg.family === "baby_shower" ? "#/baby-shower" : "#/paquetes"}">← Volver</a></p>
    ${pageHeader(pkg.name, pkg.description)}

    <div class="filters">
      <label>Salón
        <select data-detail-filter="venue">${venueOptions}</select>
      </label>
      ${daySelect}
      ${editMode ? `<span class="edit-hint">Editable</span>` : ""}
    </div>

    <div class="stack">
      <div class="card pkg-hero">
        <div class="card__meta">
          ${tierBadge(pkg)}
          ${pkg.venueIds.map((id) => badge(venueLabel(catalog.venues, id))).join("")}
          ${badge(`+${catalog.fees.serviceFeePercent}% fee`)}
          ${badge(`+${catalog.fees.taxPercent}% tax`)}
          ${pkg.isCompletePackage ? badge("Paquete completo", "ok") : badge("No es paquete completo", "warn")}
          ${day === "saturday" ? badge("Sábado no negociable", "danger") : ""}
        </div>
        ${priceBlock}
        ${
          day === "saturday"
            ? callout(
                "Sábado no negociable",
                "Este día no admite negociación de precio, descuentos ni condiciones en ningún paquete ni salón.",
                "danger",
                "⛔"
              )
            : ""
        }
        <p class="small muted" style="margin:0">Base del paquete. Los cargos 18% + 7% se aplican por defecto al cotizar.</p>

        ${
          editMode && pkg.venueIds.includes(venue)
            ? `<div class="row" style="margin-top:0.75rem">
                <label class="field" style="margin:0">
                  <span>Precio</span>
                  <input type="number" min="0" step="1" data-pkg-price-input value="${row?.price ?? ""}" ${row?.status === "not_sold" ? "disabled" : ""}>
                </label>
                <label class="field" style="margin:0">
                  <span>Estado</span>
                  <select data-pkg-status-input>
                    <option value="available" ${row?.status === "available" ? "selected" : ""}>Disponible</option>
                    <option value="not_sold" ${row?.status === "not_sold" ? "selected" : ""}>No se vende</option>
                  </select>
                </label>
                <button type="button" class="btn btn--primary btn--sm" data-action="save-pkg-price"
                  data-package="${escapeHtml(pkg.id)}" data-venue="${escapeHtml(venue)}" data-day="${day == null ? "" : day}">Guardar precio</button>
                <button type="button" class="btn btn--ghost btn--sm" data-action="restore-pkg-price"
                  data-package="${escapeHtml(pkg.id)}" data-venue="${escapeHtml(venue)}" data-day="${day == null ? "" : day}">Restaurar</button>
              </div>`
            : ""
        }
      </div>

      <div class="card">
        <div class="row-between">
          <h2 style="margin:0">Inclusiones</h2>
          ${
            editMode
              ? `<div class="row">
                  <button type="button" class="btn btn--sm btn--secondary" data-action="restore-inclusions" data-package="${escapeHtml(pkg.id)}">Restaurar defaults</button>
                  ${
                    pkg.family !== "custom"
                      ? `<button type="button" class="btn btn--sm btn--secondary" data-action="duplicate-package" data-package="${escapeHtml(pkg.id)}">Duplicar</button>`
                      : `<button type="button" class="btn btn--sm btn--danger" data-action="remove-custom" data-package="${escapeHtml(pkg.id)}">Eliminar custom</button>`
                  }
                </div>`
              : ""
          }
        </div>
        <div class="divider"></div>
        ${inclusionList(catalog, pkg, { editMode, packageId: pkg.id })}
        ${editMode ? addServicePicker(catalog, pkg) : ""}
      </div>

      <div class="card card--soft">
        <h3>Invitado adicional</h3>
        <p class="card__price num" style="font-size:1.3rem">${formatMoney(guest.min)} – ${formatMoney(guest.max)} <small>/ persona</small></p>
      </div>
    </div>`;
}

/* ========== BABY SHOWER ========== */
export function renderBabyShower(state) {
  const { catalog } = state;
  const bs = catalog.packages
    .filter((p) => p.family === "baby_shower")
    .sort((a, b) => a.tierOrder - b.tierOrder);
  const sch = catalog.schedules.babyShower;

  return `
    ${pageHeader("Baby Shower", "Paquetes, horarios y reglas de prioridad.")}

    <div class="stack">
      ${callout("Prioridad de sábados", sch.priorityRule, "warn", "📅")}

      <div class="card">
        <h2>Horarios</h2>
        <ul>
          <li><strong>Regular:</strong> ${escapeHtml(sch.regularWindow)}</li>
          <li><strong>Días:</strong> ${sch.allowedDays.map((d) => DAY_LABELS_ES[d] || d).join(", ")}</li>
          <li><strong>Sábado (excepción):</strong> ${escapeHtml(sch.saturdayException)}</li>
        </ul>
      </div>

      <div class="grid-2">
        ${bs
          .map((pkg) => {
            const prices = pkg.venueIds
              .map((vid) => {
                const row = catalog.packagePrices.find(
                  (r) => r.packageId === pkg.id && r.venueId === vid && r.day == null
                );
                return `<div class="stat"><strong class="num">${formatMoney(row?.price)}</strong><span>${escapeHtml(venueLabel(catalog.venues, vid))}</span></div>`;
              })
              .join("");
            return `
              <article class="card">
                <div class="card__meta">${tierBadge(pkg)} ${pkg.isCompletePackage ? badge("Completo", "ok") : badge("Básico")}</div>
                <h2 class="card__title">${escapeHtml(pkg.name)}</h2>
                <p class="small">${escapeHtml(pkg.description)}</p>
                <div class="grid-2" style="margin:0.75rem 0">${prices}</div>
                <p class="tiny faint">+${catalog.fees.serviceFeePercent}% fee + ${catalog.fees.taxPercent}% tax</p>
                <a class="btn btn--secondary btn--sm" href="#/paquetes/${escapeHtml(pkg.id)}">Ver inclusiones</a>
              </article>`;
          })
          .join("")}
      </div>

      <div class="card card--soft">
        <h3>Invitado adicional (Baby Shower)</h3>
        <p class="card__price num" style="font-size:1.3rem">${formatMoney(catalog.guestAddOn.babyShower.min)} – ${formatMoney(catalog.guestAddOn.babyShower.max)} <small>/ persona</small></p>
      </div>
    </div>`;
}

/* ========== SERVICIOS ========== */
export function renderServicios(state) {
  const { catalog, editMode } = state;
  const services = catalog.services.filter((s) => !s.packageOnly);
  const byCat = {};
  for (const s of services) {
    byCat[s.category] = byCat[s.category] || [];
    byCat[s.category].push(s);
  }

  return `
    ${pageHeader("Precios a la carta", "Servicios individuales para cotizar extras o armar a medida.")}

    ${Object.entries(byCat)
      .map(([cat, list]) => {
        return `
        <section class="service-cat section">
          <h2>${escapeHtml(CATEGORY_LABELS[cat] || cat)}</h2>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Precio</th>
                  <th>Notas</th>
                  ${editMode ? "<th></th>" : ""}
                </tr>
              </thead>
              <tbody>
                ${list
                  .map((s) => {
                    const venueBadges = (s.venueRestriction || [])
                      .map((v) => badge(v === "diamond" ? "Solo Diamond" : "Solo Revolution", "warn"))
                      .join(" ");
                    return `<tr>
                      <td>
                        <strong>${escapeHtml(s.name)}</strong>
                        ${venueBadges ? `<div style="margin-top:0.25rem">${venueBadges}</div>` : ""}
                      </td>
                      <td class="price-cell num" data-service-price="${escapeHtml(s.id)}">
                        ${
                          editMode
                            ? `<div class="inline-edit">
                                <input type="number" min="0" step="1" data-svc-amount="${escapeHtml(s.id)}" value="${s.amount ?? ""}" style="width:5.5rem">
                                ${s.unit === "botella" ? `<span class="tiny faint">/ botella</span>` : ""}
                                ${s.servesPeople ? `<span class="tiny faint">(${s.servesPeople} pax)</span>` : ""}
                              </div>`
                            : escapeHtml(formatServicePrice(s))
                        }
                      </td>
                      <td class="small muted">${escapeHtml(s.notes || "—")}</td>
                      ${
                        editMode
                          ? `<td>
                              <button type="button" class="btn btn--sm btn--primary" data-action="save-service" data-service="${escapeHtml(s.id)}">Guardar</button>
                              <button type="button" class="btn btn--sm btn--ghost" data-action="restore-service" data-service="${escapeHtml(s.id)}">↺</button>
                            </td>`
                          : ""
                      }
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>`;
      })
      .join("")}
  `;
}

/* ========== PERSONAL ========== */
export function renderPersonal(state) {
  const { catalog } = state;
  return `
    ${pageHeader("Esquema de personal", "Cuántas personas de staff llevar según el tamaño del evento.")}

    ${callout(
      "Nota de capacidad",
      catalog.contentNotes.find((n) => n.id === "capacity_vs_staffing")?.text || "",
      "warn",
      "!"
    )}

    ${callout(
      "Hueco 101–119 invitados",
      "No hay escalón definido entre 101 y 119. Recomendación provisional: usar el esquema de 100 personas hasta 119, salvo indicación de gerencia.",
      "info",
      "…"
    )}

    <div class="grid-auto">
      ${catalog.staffingTiers
        .map((t) => {
          const roles = Object.entries(t.roles)
            .map(
              ([k, n]) =>
                `<span class="badge">${n}× ${escapeHtml(ROLE_LABELS[k] || k)}</span>`
            )
            .join("");
          return `
            <article class="card">
              <div class="card__meta">${badge(`${t.totalStaff} staff`, "accent")}</div>
              <h2 class="card__title">${escapeHtml(t.label)}</h2>
              <p class="small muted">Invitados: ${t.guestMin}${t.guestMax !== t.guestMin ? `–${t.guestMax}` : ""}</p>
              <div class="role-pills">${roles}</div>
            </article>`;
        })
        .join("")}
    </div>`;
}

/* ========== POLITICAS ========== */
export function renderPoliticas(state) {
  const { catalog, editMode } = state;
  const p = catalog.policies;
  const fees = catalog.fees;

  return `
    ${pageHeader("Políticas de negociación", "Qué se puede ajustar, intercambiar o descontar — y qué no.")}

    <div class="stack">
      ${callout("Fees por defecto", p.negotiableFeesNote, "info", "%")}

      <div class="grid-2">
        <div class="card">
          <h2>Negociables</h2>
          <ul>${p.negotiable.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
          ${
            editMode
              ? `<div class="row">
                  <label class="field" style="margin:0"><span>Service Fee %</span>
                    <input type="number" min="0" max="100" step="1" data-fee="serviceFeePercent" value="${fees.serviceFeePercent}">
                  </label>
                  <label class="field" style="margin:0"><span>Tax %</span>
                    <input type="number" min="0" max="100" step="1" data-fee="taxPercent" value="${fees.taxPercent}">
                  </label>
                  <button type="button" class="btn btn--sm btn--primary" data-action="save-fees">Guardar fees</button>
                </div>`
              : `<p class="small">Actuales: <strong>${fees.serviceFeePercent}%</strong> service · <strong>${fees.taxPercent}%</strong> tax</p>`
          }
        </div>

        <div class="card">
          <h2>No negociables</h2>
          <ul>${p.nonNegotiable.map((x) => `<li><strong>${escapeHtml(x)}</strong></li>`).join("")}</ul>
          ${badge("Estricto", "danger")}
        </div>
      </div>

      <div class="card">
        <h2>Intercambios permitidos</h2>
        <ul>
          ${p.allowedSwaps
            .map((s) => {
              const from = serviceName(catalog, s.fromServiceId);
              const to = serviceName(catalog, s.toServiceId);
              return `<li><strong>${escapeHtml(from)}</strong> ↔ <strong>${escapeHtml(to)}</strong> — ${escapeHtml(s.note)}</li>`;
            })
            .join("")}
        </ul>
        <h3>Intercambio invitados ↔ servicios</h3>
        <ul>
          ${p.tradeExamples.map((t) => `<li>${escapeHtml(t.text)}</li>`).join("")}
        </ul>
      </div>

      <div class="card">
        <h2>Descuentos</h2>
        <p class="card__price num" style="font-size:1.35rem">${formatMoney(p.discount.min)} – ${formatMoney(p.discount.max)}</p>
        <p class="small">${escapeHtml(p.discount.note)}</p>
        ${p.discount.requiresCompletePackage ? badge("Solo paquete completo", "ok") : ""}
      </div>

      <div class="card card--soft">
        <h2>Invitado adicional</h2>
        <div class="grid-2">
          <div>
            <div class="tiny faint">Baby Shower</div>
            <strong class="num">${formatMoney(catalog.guestAddOn.babyShower.min)} – ${formatMoney(catalog.guestAddOn.babyShower.max)}</strong> / persona
          </div>
          <div>
            <div class="tiny faint">Otros paquetes</div>
            <strong class="num">${formatMoney(catalog.guestAddOn.otherPackages.min)} – ${formatMoney(catalog.guestAddOn.otherPackages.max)}</strong> / persona
          </div>
        </div>
      </div>
    </div>`;
}

/* ========== EDITAR / BACKUP ========== */
export function renderEditar(state) {
  const { editMode, overrideCount, overrides, catalog } = state;
  if (!editMode) {
    return `
      ${pageHeader("Edición desactivada", "Esta sesión está en solo lectura (?edit=0).")}
      ${callout("Solo lectura", "Abre el manual sin ?edit=0 en la máquina del gerente para editar borradores.", "warn", "🔒")}
    `;
  }

  return `
    ${pageHeader("Edición y backup", "Los cambios viven solo en este navegador hasta exportarlos.")}

    <div class="stack">
      ${callout(
        "Modelo de trabajo",
        "Floor staff: solo lectura. Gerente: edita aquí y exporta. Tarifas oficiales: actualizar web/data/seed.json en el repo.",
        "info",
        "👥"
      )}

      <div class="card">
        <div class="row-between">
          <div>
            <h2 style="margin:0">Estado local</h2>
            <p class="small" style="margin:0.35rem 0 0">${overrideCount} override(s) · seed v${state.seed?.version ?? catalog.version ?? 1}${overrides.updatedAt ? ` · actualizado ${escapeHtml(overrides.updatedAt)}` : ""}</p>
          </div>
          <button type="button" class="btn btn--danger" data-action="reset-all">Restaurar todo al seed</button>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h2>Exportar borrador</h2>
          <p class="small">Copia o descarga el JSON de cambios para respaldarlo o proponerlo al catálogo oficial.</p>
          <div class="row">
            <button type="button" class="btn btn--primary" data-action="export-download">Descargar JSON</button>
            <button type="button" class="btn btn--secondary" data-action="export-copy">Copiar</button>
          </div>
          <textarea id="export-box" class="field" style="width:100%;min-height:160px;margin-top:0.75rem;font-family:var(--mono);font-size:0.75rem;border:1px solid var(--border);border-radius:8px;padding:0.6rem" readonly></textarea>
        </div>
        <div class="card">
          <h2>Importar borrador</h2>
          <p class="small">Pega un JSON exportado. «Reemplazar» borra overrides actuales; «Fusionar» combina.</p>
          <textarea id="import-box" style="width:100%;min-height:160px;font-family:var(--mono);font-size:0.75rem;border:1px solid var(--border);border-radius:8px;padding:0.6rem" placeholder='{"services":{...}}'></textarea>
          <div class="row" style="margin-top:0.75rem">
            <button type="button" class="btn btn--primary" data-action="import-replace">Reemplazar</button>
            <button type="button" class="btn btn--secondary" data-action="import-merge">Fusionar</button>
          </div>
        </div>
      </div>

      <div class="card card--soft">
        <h2>Fees del catálogo efectivo</h2>
        <p>Service Fee: <strong>${catalog.fees.serviceFeePercent}%</strong> · Tax: <strong>${catalog.fees.taxPercent}%</strong></p>
        <p class="small muted">Edita fees en Políticas. Precios de servicios en A la carta. Inclusiones en el detalle de cada paquete.</p>
      </div>
    </div>`;
}

export function renderNotFound() {
  return `${pageHeader("Página no encontrada")}<p><a href="#/">Ir al inicio</a></p>`;
}
