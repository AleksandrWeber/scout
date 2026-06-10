import { FindingsFilters, GroupByOption } from '../utils/findings-filters';
import { FindingSeverity } from '../types';

interface Props {
  filters: FindingsFilters;
  categories: string[];
  filteredCount: number;
  totalCount: number;
  onChange: (next: FindingsFilters) => void;
}

const groupOptions: Array<{ value: GroupByOption; label: string }> = [
  { value: 'severity', label: 'Severity' },
  { value: 'category', label: 'Category' },
  { value: 'file', label: 'File' },
  { value: 'none', label: 'None' }
];

const FindingsToolbar = ({ filters, categories, filteredCount, totalCount, onChange }: Props) => {
  const update = (patch: Partial<FindingsFilters>) => onChange({ ...filters, ...patch });

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        display: 'grid',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <strong>Findings explorer</strong>
        <span style={{ color: '#6b7280' }}>
          Showing {filteredCount} of {totalCount}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Search</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Search file, category, description…"
            onChange={(event) => update({ search: event.target.value })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Severity</span>
          <select
            value={filters.severity}
            onChange={(event) => update({ severity: event.target.value as FindingsFilters['severity'] })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            <option value="ALL">All severities</option>
            {(['HIGH', 'MEDIUM', 'LOW'] as FindingSeverity[]).map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Category</span>
          <select
            value={filters.category}
            onChange={(event) => update({ category: event.target.value })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: '#374151' }}>Group by</span>
          <select
            value={filters.groupBy}
            onChange={(event) => update({ groupBy: event.target.value as GroupByOption })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default FindingsToolbar;
