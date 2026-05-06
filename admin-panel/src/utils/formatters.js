export const MISSING = 'Não informado';

export function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  let normalized = value;
  if (typeof value === 'string') {
    const clean = value.trim();
    if (clean.includes(',')) {
      normalized = clean.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
      normalized = clean.replace(/\./g, '');
    } else {
      normalized = clean;
    }
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrency(value, missing = MISSING) {
  const parsed = toNumber(value);
  if (parsed === null) return missing;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parsed);
}

export function formatInteger(value, missing = MISSING) {
  const parsed = toNumber(value);
  if (parsed === null) return missing;
  return new Intl.NumberFormat('pt-BR').format(parsed);
}

export function formatPoints(value, missing = MISSING) {
  const parsed = toNumber(value);
  if (parsed === null) return missing;
  return `${new Intl.NumberFormat('pt-BR').format(parsed)} pontos`;
}

export function toDate(value) {
  if (!value) return null;
  try {
    const date = value.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function timestampToMillis(value) {
  return toDate(value)?.getTime() ?? 0;
}

export function formatDateTime(value, missing = MISSING) {
  const date = toDate(value);
  if (!date) return missing;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
