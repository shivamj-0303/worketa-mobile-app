export function getBusinessDate(date = new Date()): string {
  const value = new Date(date);
  if (value.getHours() < 3) value.setDate(value.getDate() - 1);
  return formatDate(value);
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDisplayDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(date: Date): string {
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isDoubleRequestWindow(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 17 || hour < 2;
}
