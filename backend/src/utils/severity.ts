export type NormalizedSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export const normalizeSeverity = (value: string | undefined | null): NormalizedSeverity => {
  const normalized = value?.toString().trim().toUpperCase() || 'LOW';

  if (normalized === 'CRITICAL' || normalized === 'HIGH') {
    return 'HIGH';
  }

  if (normalized === 'MODERATE' || normalized === 'MEDIUM') {
    return 'MEDIUM';
  }

  return 'LOW';
};
