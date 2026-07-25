'use client';

import { JOBS_PER_PAGE_OPTIONS } from '@/lib/job-board/constants';

export default function JobFilters({ query, filters, perPage, onQueryChange, onPerPageChange }) {
  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
      <input
        value={query.search}
        onChange={(event) => onQueryChange({ search: event.target.value })}
        placeholder="Search title, company, keywords"
        className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-200/60"
      />
      <Select label="Category" value={query.category} onChange={(value) => onQueryChange({ category: value })} options={filters.categories || []} />
      <Select label="Type" value={query.employmentType} onChange={(value) => onQueryChange({ employmentType: value })} options={filters.employmentTypes || []} />
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

function Select({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm text-white outline-none focus:border-blue-200/60"
      aria-label={label}
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>{formatOption(option)}</option>
      ))}
    </select>
  );
}

function formatOption(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
