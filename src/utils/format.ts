export function formatCurrency(value?: number): string {
  const amount = Number(value ?? 0);
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getFirstName(name?: string, email?: string): string {
  const source = name?.trim() || email?.split('@')[0] || 'Employee';
  return source.split(/\s+/)[0];
}

export function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.split('@')[0] || 'E';
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
