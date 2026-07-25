const CATEGORY_RULES = [
  {
    category: 'software_engineering',
    terms: ['software', 'engineer', 'developer', 'frontend', 'backend', 'full-stack', 'full stack', 'react', 'node'],
  },
  {
    category: 'data_analytics',
    terms: ['data', 'analyst', 'analytics', 'sql', 'dashboard', 'business intelligence', 'machine learning'],
  },
  {
    category: 'product',
    terms: ['product manager', 'associate product', 'roadmap', 'requirements', 'product'],
  },
  {
    category: 'cybersecurity',
    terms: ['security', 'cybersecurity', 'threat', 'vulnerability', 'soc', 'cloud security'],
  },
  {
    category: 'design',
    terms: ['design', 'ux', 'ui', 'user experience', 'visual'],
  },
  {
    category: 'business',
    terms: ['finance', 'operations', 'consulting', 'strategy', 'business'],
  },
];

export function categorizeJob(job) {
  const haystack = [
    job.title,
    job.company,
    job.department,
    job.description,
    ...(job.responsibilities || []),
    ...(job.qualifications || []),
  ].join(' ').toLowerCase();

  const match = CATEGORY_RULES.find((rule) => rule.terms.some((term) => haystack.includes(term)));
  return match?.category || 'other';
}

export function extractKeywords(job) {
  const text = [
    job.title,
    job.department,
    job.description,
    ...(job.responsibilities || []),
    ...(job.qualifications || []),
  ].join(' ').toLowerCase();

  const keywords = new Set();
  for (const rule of CATEGORY_RULES) {
    for (const term of rule.terms) {
      if (text.includes(term)) keywords.add(term);
    }
  }

  return [...keywords].sort();
}
