export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value);
}

export function getHealthColor(soh: number): string {
  if (soh >= 90) return 'text-green-500';
  if (soh >= 80) return 'text-yellow-500';
  if (soh >= 70) return 'text-orange-500';
  return 'text-red-500';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-500';
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'info':
      return 'bg-blue-500/20 text-blue-500';
    default:
      return 'bg-dark-600 text-dark-400';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-500';
    case 'maintenance':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'retired':
    case 'recycled':
      return 'bg-red-500/20 text-red-500';
    default:
      return 'bg-dark-600 text-dark-400';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
