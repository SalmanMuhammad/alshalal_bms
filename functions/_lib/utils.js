export function isObjectId(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}

export function toObjectId(value) {
  if (!value) return value;
  return isObjectId(value) ? { $oid: value } : value;
}

export function normalizeObjectId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.$oid) return value.$oid;
    if (value._id) return normalizeObjectId(value._id);
  }
  return null;
}

export function normalizeValue(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === 'object') {
    if ('$oid' in value) return value.$oid;
    if ('$date' in value) {
      const dateValue = value.$date;
      if (typeof dateValue === 'string') return dateValue;
      if (typeof dateValue === 'object' && dateValue.$numberLong) {
        const ms = Number(dateValue.$numberLong);
        if (!Number.isNaN(ms)) return new Date(ms).toISOString();
      }
    }
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = normalizeValue(entry);
    }
    return out;
  }
  return value;
}

export function normalizeDoc(doc) {
  if (!doc) return doc;
  const normalized = normalizeValue(doc);
  if (normalized && normalized._id) {
    normalized._id = normalizeObjectId(normalized._id) || normalized._id;
  }
  if (normalized && normalized.employeeId) {
    normalized.employeeId = normalizeObjectId(normalized.employeeId) || normalized.employeeId;
  }
  return normalized;
}

export function getPathSegments(pathname) {
  return pathname.split('/').filter(Boolean);
}

export async function parseJsonBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

