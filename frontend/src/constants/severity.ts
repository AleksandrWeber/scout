import { CSSProperties } from 'react';
import { FindingSeverity } from '../types';

export const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  HIGH: '#dc2626',
  MEDIUM: '#ca8a04',
  LOW: '#2563eb'
};

export const SEVERITY_ORDER: FindingSeverity[] = ['HIGH', 'MEDIUM', 'LOW'];

export const normalizeSeverity = (value: string | undefined | null): FindingSeverity => {
  const normalized = value?.toString().trim().toUpperCase() || 'LOW';

  if (normalized === 'CRITICAL' || normalized === 'HIGH') {
    return 'HIGH';
  }

  if (normalized === 'MODERATE' || normalized === 'MEDIUM') {
    return 'MEDIUM';
  }

  return 'LOW';
};

export const getSeverityBadgeStyle = (severity: FindingSeverity): CSSProperties => ({
  fontSize: 12,
  fontWeight: 700,
  color: SEVERITY_COLORS[severity],
  border: `1px solid ${SEVERITY_COLORS[severity]}`,
  borderRadius: 999,
  padding: '2px 8px',
  display: 'inline-block',
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
});
