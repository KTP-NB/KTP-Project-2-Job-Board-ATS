'use client';

import {
  CAREER_CATEGORIES,
  CAREER_CATEGORY_GROUPS,
  JOB_EMPLOYMENT_TYPES,
  JOBS_PER_PAGE_OPTIONS,
} from '@/lib/job-board/constants';

export default function JobFilters({ query, filters, perPage, onQueryChange, onPerPageChange }) {
  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))]">
      <input
        value={query.search}
        onChange={(event) => onQueryChange({ search: event.target.value })}
        placeholder="Search title, company, keywords"
        className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-200/60"
      />
      <Select
        label="Category"
        value={query.category}
        onChange={(value) => onQueryChange({ category: value })}
        options={mergeOptions(CAREER_CATEGORIES, filters.categories)}
        groups={CAREER_CATEGORY_GROUPS}
      />
      <Select label="Role Type" value={query.employmentType} onChange={(value) => onQueryChange({ employmentType: value })} options={mergeOptions(JOB_EMPLOYMENT_TYPES, filters.employmentTypes)} />
      <Select
        label="H1B"
        value={query.h1bStatus}
        onChange={(value) => onQueryChange({ h1bStatus: value })}
        options={mergeOptions(['h1b_friendly', 'explicit_h1b_sponsor', 'likely_h1b_sponsor'], filters.h1bStatuses)}
      />
      <Select label="Workplace" value={query.workplaceType} onChange={(value) => onQueryChange({ workplaceType: value })} options={filters.workplaceTypes || []} />
      <Select label="Company" value={query.company} onChange={(value) => onQueryChange({ company: value })} options={filters.companies || []} />
      <select
        value={perPage}
        onChange={(event) => onPerPageChange(Number(event.target.value))}
        className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none focus:border-blue-200/60"
      >
        {JOBS_PER_PAGE_OPTIONS.map((option) => (
          <option key={option} value={option}>{option} per page</option>
        ))}
      </select>
      <label className="flex items-center gap-3 rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm font-bold text-blue-50 lg:col-span-full">
        <input
          type="checkbox"
          checked={query.postedToday}
          onChange={(event) => onQueryChange({ postedToday: event.target.checked })}
        />
        Posted today
      </label>
    </div>
  );
}

function Select({ label, value, onChange, options, groups }) {
  const optionSet = new Set(options);
  const groupedOptions = groups
    ?.map((group) => ({
      ...group,
      categories: group.categories.filter((category) => optionSet.has(category)),
    }))
    .filter((group) => group.categories.length);
  const groupedValues = new Set(groupedOptions?.flatMap((group) => group.categories) || []);
  const ungroupedOptions = options.filter((option) => !groupedValues.has(option));

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none focus:border-blue-200/60"
      aria-label={label}
    >
      <option value="">{label}</option>
      {groupedOptions?.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.categories.map((option) => (
            <option key={option} value={option}>{formatOption(option)}</option>
          ))}
        </optgroup>
      ))}
      {ungroupedOptions.map((option) => (
        <option key={option} value={option}>{formatOption(option)}</option>
      ))}
    </select>
  );
}

function formatOption(value) {
  const labels = {
    h1b_friendly: 'H1B Friendly',
    explicit_h1b_sponsor: 'Explicit H1B',
    likely_h1b_sponsor: 'Likely H1B',
  };
  if (labels[value]) return labels[value];
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mergeOptions(defaultOptions, availableOptions = []) {
  return [...new Set([...(defaultOptions || []), ...(availableOptions || [])].filter(Boolean))];
}
