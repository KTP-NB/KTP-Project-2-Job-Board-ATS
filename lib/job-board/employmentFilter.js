export function applyEmploymentTypeFilter(query, employmentType) {
  if (!employmentType) return query;
  if (employmentType === 'co_op') {
    return query.or('employment_type.eq.co_op,title.ilike.%co-op%,title.ilike.%coop%');
  }
  if (employmentType === 'apprenticeship') {
    return query.or('employment_type.eq.apprenticeship,title.ilike.%apprentice%,title.ilike.%apprenticeship%');
  }
  if (employmentType === 'internship') {
    return query.eq('employment_type', 'internship')
      .not('title', 'ilike', '%co-op%')
      .not('title', 'ilike', '%coop%')
      .not('title', 'ilike', '%apprentice%')
      .not('title', 'ilike', '%apprenticeship%');
  }
  return query.eq('employment_type', employmentType);
}
