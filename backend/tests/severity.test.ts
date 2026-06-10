import { normalizeSeverity } from '../src/utils/severity';

describe('normalizeSeverity', () => {
  it('maps moderate and medium to MEDIUM', () => {
    expect(normalizeSeverity('moderate')).toBe('MEDIUM');
    expect(normalizeSeverity('MODERATE')).toBe('MEDIUM');
    expect(normalizeSeverity('medium')).toBe('MEDIUM');
  });

  it('maps critical and high to HIGH', () => {
    expect(normalizeSeverity('critical')).toBe('HIGH');
    expect(normalizeSeverity('high')).toBe('HIGH');
  });

  it('maps low and unknown values to LOW', () => {
    expect(normalizeSeverity('low')).toBe('LOW');
    expect(normalizeSeverity('info')).toBe('LOW');
  });
});
