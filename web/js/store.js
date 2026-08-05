const STORAGE_KEY = "ops-manual-v1";

export function priceKey(packageId, venueId, day) {
  return `${packageId}|${venueId}|${day == null ? "_" : day}`;
}

function deepClone(obj) {
  return structuredClone(obj);
}

function emptyOverrides(seedVersion = 1) {
  return {
    seedVersion,
    updatedAt: null,
    services: {},
    venues: {},
    fees: {},
    guestAddOn: {},
    packagePrices: {},
    packageInclusions: {},
    packageMeta: {},
    customPackages: [],
    removedCustomPackageIds: [],
  };
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverrides();
    const parsed = JSON.parse(raw);
    return { ...emptyOverrides(parsed.seedVersion), ...parsed };
  } catch {
    return emptyOverrides();
  }
}

function saveOverrides(overrides) {
  overrides.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function mergeCatalog(seed, overrides) {
  const catalog = deepClone(seed);

  if (overrides.fees && typeof overrides.fees === "object") {
    Object.assign(catalog.fees, overrides.fees);
  }

  if (overrides.guestAddOn && typeof overrides.guestAddOn === "object") {
    for (const [k, v] of Object.entries(overrides.guestAddOn)) {
      catalog.guestAddOn[k] = { ...(catalog.guestAddOn[k] || {}), ...v };
    }
  }

  if (overrides.venues && typeof overrides.venues === "object") {
    for (const [id, patch] of Object.entries(overrides.venues)) {
      const venue = catalog.venues.find((v) => v.id === id);
      if (venue) Object.assign(venue, patch);
    }
  }

  if (overrides.services && typeof overrides.services === "object") {
    for (const [id, patch] of Object.entries(overrides.services)) {
      const svc = catalog.services.find((s) => s.id === id);
      if (!svc) continue;
      const allowed = [
        "amount",
        "amountSecondary",
        "pricingType",
        "pricingTypeSecondary",
        "unit",
        "unitSecondary",
        "notes",
        "name",
      ];
      for (const key of allowed) {
        if (patch[key] !== undefined) svc[key] = patch[key];
      }
    }
  }

  if (overrides.packageMeta && typeof overrides.packageMeta === "object") {
    for (const [id, patch] of Object.entries(overrides.packageMeta)) {
      const pkg = catalog.packages.find((p) => p.id === id);
      if (pkg && patch.name) pkg.name = patch.name;
      if (pkg && patch.description) pkg.description = patch.description;
    }
  }

  if (overrides.packageInclusions && typeof overrides.packageInclusions === "object") {
    for (const [id, list] of Object.entries(overrides.packageInclusions)) {
      const pkg = catalog.packages.find((p) => p.id === id);
      if (pkg && Array.isArray(list)) pkg.inclusionServiceIds = [...list];
    }
  }

  if (Array.isArray(overrides.customPackages)) {
    for (const custom of overrides.customPackages) {
      if (overrides.removedCustomPackageIds?.includes(custom.id)) continue;
      if (!catalog.packages.some((p) => p.id === custom.id)) {
        catalog.packages.push(deepClone(custom));
      }
    }
  }

  if (overrides.packagePrices && typeof overrides.packagePrices === "object") {
    for (const [key, patch] of Object.entries(overrides.packagePrices)) {
      const [packageId, venueId, dayRaw] = key.split("|");
      const day = dayRaw === "_" ? null : dayRaw;
      const pkg = catalog.packages.find((p) => p.id === packageId);
      if (pkg && !pkg.venueIds.includes(venueId)) continue;

      let row = catalog.packagePrices.find(
        (r) => r.packageId === packageId && r.venueId === venueId && (r.day ?? null) === day
      );
      if (!row) {
        row = { packageId, venueId, day, status: "available", price: null };
        catalog.packagePrices.push(row);
      }
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.price !== undefined) row.price = patch.price;
    }
  }

  return catalog;
}

function countOverrides(overrides) {
  let n = 0;
  n += Object.keys(overrides.services || {}).length;
  n += Object.keys(overrides.venues || {}).length;
  n += Object.keys(overrides.fees || {}).length;
  n += Object.keys(overrides.guestAddOn || {}).length;
  n += Object.keys(overrides.packagePrices || {}).length;
  n += Object.keys(overrides.packageInclusions || {}).length;
  n += Object.keys(overrides.packageMeta || {}).length;
  n += (overrides.customPackages || []).length;
  n += (overrides.removedCustomPackageIds || []).length;
  return n;
}

export function createStore() {
  let seed = null;
  let overrides = emptyOverrides();
  let catalog = null;
  let editMode = true;
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) fn(getState());
  }

  function recompute() {
    catalog = mergeCatalog(seed, overrides);
  }

  function getState() {
    return {
      seed,
      catalog,
      overrides,
      editMode,
      overrideCount: countOverrides(overrides),
    };
  }

  function persist() {
    saveOverrides(overrides);
    recompute();
    notify();
  }

  return {
    async init() {
      const res = await fetch("./data/seed.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar seed.json");
      seed = await res.json();
      overrides = loadOverrides();
      if (overrides.seedVersion !== seed.version) {
        overrides.seedVersion = seed.version;
      }
      const params = new URLSearchParams(location.search);
      if (params.get("edit") === "0") editMode = false;
      recompute();
      notify();
      return getState();
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getState,

    setEditMode(on) {
      const params = new URLSearchParams(location.search);
      if (params.get("edit") === "0") {
        editMode = false;
      } else {
        editMode = !!on;
      }
      notify();
    },

    getService(id) {
      return catalog?.services.find((s) => s.id === id) || null;
    },

    getPackage(id) {
      return catalog?.packages.find((p) => p.id === id) || null;
    },

    getPackagePrice(packageId, venueId, day) {
      const d = day ?? null;
      return (
        catalog?.packagePrices.find(
          (r) => r.packageId === packageId && r.venueId === venueId && (r.day ?? null) === d
        ) || null
      );
    },

    updateServicePrice(serviceId, patch) {
      if (!editMode) return;
      const current = overrides.services[serviceId] || {};
      overrides.services[serviceId] = { ...current, ...patch };
      // drop empty
      if (Object.keys(overrides.services[serviceId]).length === 0) {
        delete overrides.services[serviceId];
      }
      persist();
    },

    updateVenue(venueId, patch) {
      if (!editMode) return;
      overrides.venues[venueId] = { ...(overrides.venues[venueId] || {}), ...patch };
      persist();
    },

    updateFees(patch) {
      if (!editMode) return;
      overrides.fees = { ...overrides.fees, ...patch };
      persist();
    },

    updateGuestAddOn(kind, patch) {
      if (!editMode) return;
      overrides.guestAddOn[kind] = { ...(overrides.guestAddOn[kind] || {}), ...patch };
      persist();
    },

    updatePackagePrice({ packageId, venueId, day, price, status }) {
      if (!editMode) return;
      const pkg = catalog.packages.find((p) => p.id === packageId);
      if (!pkg) throw new Error("Paquete no encontrado");
      if (!pkg.venueIds.includes(venueId)) {
        throw new Error("Este paquete no aplica a ese salón");
      }
      let nextStatus = status;
      let nextPrice = price;
      if (nextStatus === "not_sold") nextPrice = null;
      if (nextStatus === "available" && (nextPrice == null || nextPrice < 0)) {
        throw new Error("Precio requerido para marcar como disponible");
      }
      const key = priceKey(packageId, venueId, day);
      overrides.packagePrices[key] = {
        ...(overrides.packagePrices[key] || {}),
        ...(nextPrice !== undefined ? { price: nextPrice } : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      };
      persist();
    },

    setPackageInclusions(packageId, inclusionServiceIds) {
      if (!editMode) return;
      overrides.packageInclusions[packageId] = [...inclusionServiceIds];
      persist();
    },

    addInclusion(packageId, serviceId) {
      if (!editMode) return;
      const pkg = this.getPackage(packageId);
      if (!pkg) return;
      if (pkg.inclusionServiceIds.includes(serviceId)) return;
      this.setPackageInclusions(packageId, [...pkg.inclusionServiceIds, serviceId]);
    },

    removeInclusion(packageId, serviceId) {
      if (!editMode) return;
      const pkg = this.getPackage(packageId);
      if (!pkg) return;
      this.setPackageInclusions(
        packageId,
        pkg.inclusionServiceIds.filter((id) => id !== serviceId)
      );
    },

    restorePackageInclusions(packageId) {
      if (!editMode) return;
      delete overrides.packageInclusions[packageId];
      persist();
    },

    restoreServicePrice(serviceId) {
      if (!editMode) return;
      delete overrides.services[serviceId];
      persist();
    },

    restorePackagePrice(packageId, venueId, day) {
      if (!editMode) return;
      delete overrides.packagePrices[priceKey(packageId, venueId, day)];
      persist();
    },

    duplicatePackage(originPackageId, name) {
      if (!editMode) return null;
      const origin = this.getPackage(originPackageId);
      if (!origin) return null;
      const id = `custom_${Date.now().toString(36)}`;
      const custom = {
        id,
        name: name || `${origin.name} (custom)`,
        family: "custom",
        originPackageId,
        tierOrder: 100 + (overrides.customPackages?.length || 0),
        venueIds: [...origin.venueIds],
        isCompletePackage: origin.isCompletePackage,
        description: `Variante de ${origin.name}`,
        inclusionServiceIds: [...origin.inclusionServiceIds],
      };
      overrides.customPackages = [...(overrides.customPackages || []), custom];
      overrides.removedCustomPackageIds = (overrides.removedCustomPackageIds || []).filter(
        (x) => x !== id
      );
      persist();
      return id;
    },

    removeCustomPackage(packageId) {
      if (!editMode) return;
      overrides.customPackages = (overrides.customPackages || []).filter((p) => p.id !== packageId);
      overrides.removedCustomPackageIds = [
        ...new Set([...(overrides.removedCustomPackageIds || []), packageId]),
      ];
      delete overrides.packageInclusions[packageId];
      // strip related price overrides
      for (const key of Object.keys(overrides.packagePrices || {})) {
        if (key.startsWith(`${packageId}|`)) delete overrides.packagePrices[key];
      }
      persist();
    },

    resetAllOverrides() {
      if (!editMode) return;
      overrides = emptyOverrides(seed?.version || 1);
      persist();
    },

    exportOverrides() {
      return JSON.stringify(overrides, null, 2);
    },

    importOverrides(jsonText, mode = "replace") {
      if (!editMode) return;
      const data = JSON.parse(jsonText);
      if (!data || typeof data !== "object") throw new Error("JSON inválido");
      const allowed = [
        "seedVersion",
        "updatedAt",
        "services",
        "venues",
        "fees",
        "guestAddOn",
        "packagePrices",
        "packageInclusions",
        "packageMeta",
        "customPackages",
        "removedCustomPackageIds",
      ];
      const clean = emptyOverrides(seed?.version || 1);
      for (const key of allowed) {
        if (data[key] !== undefined) clean[key] = data[key];
      }
      clean.seedVersion = seed?.version || 1;
      if (mode === "merge") {
        overrides = {
          ...overrides,
          services: { ...overrides.services, ...clean.services },
          venues: { ...overrides.venues, ...clean.venues },
          fees: { ...overrides.fees, ...clean.fees },
          guestAddOn: { ...overrides.guestAddOn, ...clean.guestAddOn },
          packagePrices: { ...overrides.packagePrices, ...clean.packagePrices },
          packageInclusions: {
            ...overrides.packageInclusions,
            ...clean.packageInclusions,
          },
          packageMeta: { ...overrides.packageMeta, ...clean.packageMeta },
          customPackages: [
            ...(overrides.customPackages || []),
            ...(clean.customPackages || []).filter(
              (c) => !(overrides.customPackages || []).some((x) => x.id === c.id)
            ),
          ],
          removedCustomPackageIds: [
            ...new Set([
              ...(overrides.removedCustomPackageIds || []),
              ...(clean.removedCustomPackageIds || []),
            ]),
          ],
        };
      } else {
        overrides = clean;
      }
      persist();
    },
  };
}
