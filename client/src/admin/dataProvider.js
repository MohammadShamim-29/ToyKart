import api from "../api";

/** Set VITE_ADMIN_DEBUG=true in `.env` (client) for dataProvider request/error logs in the browser console. */
const adminDebug = import.meta.env.VITE_ADMIN_DEBUG === "true";

function debugLog(op, payload) {
  if (adminDebug) {
    console.debug(`[ToyKart admin dataProvider] ${op}`, payload);
  }
}

function debugError(op, meta, err) {
  if (!adminDebug) return;
  console.error(`[ToyKart admin dataProvider] ${op} failed`, {
    ...meta,
    status: err.response?.status,
    data: err.response?.data,
    message: err.message
  });
}

async function withDebug(op, meta, promise) {
  try {
    const result = await promise;
    debugLog(op, { ...meta, ok: true });
    return result;
  } catch (err) {
    debugError(op, meta, err);
    throw err;
  }
}

const mapRecord = (record) => {
  if (!record) return record;
  const rawId = record._id ?? record.id;
  if (rawId == null || rawId === "") return record;
  return { ...record, id: String(rawId) };
};

function applyFilter(rows, filter) {
  if (!filter || Object.keys(filter).length === 0) return rows;
  return rows.filter((row) =>
    Object.entries(filter).every(([key, val]) => {
      if (val === undefined || val === "" || val === null) return true;
      if (key === "q" && val) {
        const terms = String(val)
          .toLowerCase()
          .split(/\s+/)
          .map((t) => t.trim())
          .filter(Boolean);
        const haystack = JSON.stringify(row).toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }
      return row[key] === val;
    })
  );
}

function applySort(rows, sort) {
  if (!sort?.field) return rows;
  const dir = sort.order === "ASC" ? 1 : -1;
  const { field } = sort;
  return [...rows].sort((a, b) => {
    let va = a[field];
    let vb = b[field];
    if (field === "category.name") {
      va = a.category?.name ?? "";
      vb = b.category?.name ?? "";
    }
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
}

function paginate(rows, pagination) {
  const { page = 1, perPage = 25 } = pagination || {};
  const total = rows.length;
  const start = Math.max(0, (page - 1) * perPage);
  const slice = rows.slice(start, start + perPage);
  return { slice, total };
}

const stripIds = (data) => {
  const { id, _id, ...rest } = data || {};
  return rest;
};

const buildListQuery = (params = {}) => {
  const query = {};
  const { filter, sort, pagination } = params;

  if (filter && typeof filter === "object") {
    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined || value === null || value === "") continue;
      query[key] = value;
    }
  }

  if (sort?.field) {
    query.sortField = sort.field;
    query.sortOrder = sort.order || "DESC";
  }

  if (pagination?.page != null) query.page = pagination.page;
  if (pagination?.perPage != null) query.perPage = pagination.perPage;

  return query;
};

const extractReferenceId = (val) => {
  if (val == null || val === "") return val;
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (val.id != null) return String(val.id);
    if (val._id != null) return String(val._id);
  }
  return val;
};

const normalizeProductForApi = (data) => {
  const tags =
    typeof data.tags === "string"
      ? data.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : Array.isArray(data.tags)
        ? data.tags
        : [];
  const raw = {
    ...stripIds(data),
    tags,
    category: extractReferenceId(data.category),
    gallery: Array.isArray(data.gallery)
      ? data.gallery.map((u) => String(u).trim()).filter(Boolean)
      : [],
    dimensionsCm: {
      length: Number(data.dimensionsCm?.length ?? 0) || 0,
      width: Number(data.dimensionsCm?.width ?? 0) || 0,
      height: Number(data.dimensionsCm?.height ?? 0) || 0
    },
    weightGrams: Number(data.weightGrams ?? 0) || 0
  };
  if (raw.image === "" || raw.image == null) {
    delete raw.image;
  }
  return raw;
};

const normalizeOrderForApi = (data) => {
  const raw = { ...stripIds(data) };

  [
    "orderItems",
    "shippingAddress",
    "statusHistory",
    "adminNotes",
    "orderNumber",
    "paymentStatus",
    "customerName",
    "customerEmail",
    "itemCount",
    "createdAt",
    "updatedAt",
    "user",
    "itemsPrice",
    "shippingPrice",
    "taxPrice",
    "totalPrice",
    "paymentMethod"
  ].forEach((field) => {
    delete raw[field];
  });

  if (raw.newRefundAmount !== undefined && raw.newRefundAmount !== null && raw.newRefundAmount !== "") {
    raw.refundAmount = Number(raw.newRefundAmount);
    raw.refundReason = String(raw.newRefundReason ?? "").trim();
  } else {
    delete raw.refundAmount;
    delete raw.refundReason;
  }
  delete raw.newRefundAmount;
  delete raw.newRefundReason;

  if (raw.fulfillment && typeof raw.fulfillment === "object") {
    raw.fulfillment = {
      carrier: String(raw.fulfillment.carrier ?? "").trim(),
      trackingNumber: String(raw.fulfillment.trackingNumber ?? "").trim(),
      shippedAt: raw.fulfillment.shippedAt || ""
    };
  }

  return raw;
};

const mapOneForForm = (resource, raw) => {
  const base = mapRecord(raw);
  if (resource === "products" && raw?.category && typeof raw.category === "object" && raw.category._id) {
    return { ...base, category: String(raw.category._id) };
  }
  if (resource === "shipping-districts" && raw?.country && typeof raw.country === "object" && raw.country._id) {
    return { ...base, country: String(raw.country._id) };
  }
  return base;
};

const unwrapDelete = (data) => data.category || data.product || data;

/** Normalize ids for REST URLs — react-admin sometimes passes objects in id arrays ([object Object] crash on server). */
function coerceRestId(id) {
  if (id == null || id === "") return "";
  if (typeof id === "object") {
    const v = id.id ?? id._id;
    return v != null && v !== "" ? String(v) : "";
  }
  const s = String(id);
  return s === "[object Object]" ? "" : s;
}

export const dataProvider = {
  getList: async (resource, params) => {
    const { data } = await withDebug(
      "getList",
      { resource, params },
      api.get(`/admin/${resource}`, { params: buildListQuery(params) })
    );
    let rows = Array.isArray(data) ? data : [];
    rows = applyFilter(rows, params.filter);
    rows = applySort(rows, params.sort);
    const { slice, total } = paginate(rows, params.pagination);
    return { data: slice.map((r) => mapRecord(r)), total };
  },

  getOne: async (resource, params) => {
    const id = coerceRestId(params.id);
    const { data } = await withDebug(
      "getOne",
      { resource, id },
      api.get(`/admin/${resource}/${encodeURIComponent(id)}`)
    );
    return { data: mapOneForForm(resource, data) };
  },

  getMany: async (resource, params) => {
    const ids = [...new Set((params.ids || []).map(coerceRestId).filter(Boolean))];
    const results = await Promise.all(
      ids.map((id) =>
        withDebug("getMany item", { resource, id }, api.get(`/admin/${resource}/${encodeURIComponent(id)}`))
      )
    );
    return { data: results.map((r) => mapOneForForm(resource, r.data)) };
  },

  getManyReference: async (resource, params) => {
    const { data } = await withDebug("getManyReference", { resource, params }, api.get(`/admin/${resource}`));
    let rows = Array.isArray(data) ? data : [];
    const id = coerceRestId(params.id);
    rows = rows.filter((row) => {
      const ref = row[params.target];
      if (ref == null) return false;
      if (typeof ref === "object" && ref._id) return String(ref._id) === id;
      return String(ref) === id;
    });
    rows = applySort(rows, params.sort);
    const { slice, total } = paginate(rows, params.pagination);
    return { data: slice.map((r) => mapRecord(r)), total };
  },

  create: async (resource, params) => {
    const body =
      resource === "products"
        ? normalizeProductForApi(params.data)
        : resource === "orders"
          ? normalizeOrderForApi(params.data)
          : stripIds(params.data);
    const { data } = await withDebug("create", { resource }, api.post(`/admin/${resource}`, body));
    return { data: mapRecord(data) };
  },

  update: async (resource, params) => {
    const id = coerceRestId(params.id);
    const body =
      resource === "products"
        ? normalizeProductForApi(params.data)
        : resource === "orders"
          ? normalizeOrderForApi(params.data)
          : stripIds(params.data);
    const { data } = await withDebug(
      "update",
      { resource, id },
      api.put(`/admin/${resource}/${encodeURIComponent(id)}`, body)
    );
    return { data: mapRecord(data) };
  },

  updateMany: async (resource, params) => {
    const ids = [...new Set((params.ids || []).map(coerceRestId).filter(Boolean))];
    const body =
      resource === "products"
        ? normalizeProductForApi(params.data)
        : resource === "orders"
          ? normalizeOrderForApi(params.data)
          : stripIds(params.data);
    await Promise.all(
      ids.map((id) =>
        withDebug("updateMany", { resource, id }, api.put(`/admin/${resource}/${encodeURIComponent(id)}`, body))
      )
    );
    return { data: ids };
  },

  delete: async (resource, params) => {
    const id = coerceRestId(params.id);
    const { data } = await withDebug(
      "delete",
      { resource, id },
      api.delete(`/admin/${resource}/${encodeURIComponent(id)}`)
    );
    const record = unwrapDelete(data);
    return { data: mapRecord(record) };
  },

  deleteMany: async (resource, params) => {
    const ids = [...new Set((params.ids || []).map(coerceRestId).filter(Boolean))];
    await Promise.all(
      ids.map((id) =>
        withDebug("deleteMany", { resource, id }, api.delete(`/admin/${resource}/${encodeURIComponent(id)}`))
      )
    );
    return { data: ids };
  }
};
