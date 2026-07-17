export const mockCareerJobs = [
  {
    id: 'northstar-software-engineer-intern-2027',
    company: 'Northstar Labs',
    title: 'Software Engineer Intern',
    department: 'Engineering',
    location: 'New York, NY',
    workplaceType: 'hybrid',
    employmentType: 'internship',
    salaryRange: '$38 - $48/hour',
    postedAt: '2026-07-01T13:00:00.000Z',
    source: 'mock-careers',
    applyUrl: '/mock-careers/jobs/northstar-software-engineer-intern-2027',
    summary: 'Build internal tools and customer-facing product features with a senior engineering mentor.',
    responsibilities: [
      'Ship full-stack features in a modern React and Node environment.',
      'Write tests for critical product workflows.',
      'Partner with product managers and designers on user-facing improvements.',
    ],
    qualifications: [
      'Experience with JavaScript, React, or a similar frontend framework.',
      'Comfort with data structures, APIs, and relational databases.',
      'Interest in product engineering and collaborative code review.',
    ],
    benefits: [
      'Mentorship from senior engineers.',
      'Intern demo day with engineering leadership.',
      'Hybrid office schedule near transit.',
    ],
  },
  {
    id: 'summit-data-analyst-intern-2027',
    company: 'Summit Financial',
    title: 'Data Analyst Intern',
    department: 'Analytics',
    location: 'Jersey City, NJ',
    workplaceType: 'onsite',
    employmentType: 'internship',
    salaryRange: '$32 - $40/hour',
    postedAt: '2026-06-28T15:30:00.000Z',
    source: 'mock-careers',
    applyUrl: '/mock-careers/jobs/summit-data-analyst-intern-2027',
    summary: 'Analyze portfolio, customer, and operations data for business teams across a financial platform.',
    responsibilities: [
      'Build dashboards and recurring reports for business stakeholders.',
      'Clean and transform large datasets for analysis.',
      'Present insights with clear visuals and written recommendations.',
    ],
    qualifications: [
      'Experience with SQL and spreadsheets.',
      'Familiarity with Python, R, Tableau, Power BI, or similar tools.',
      'Strong written communication and attention to detail.',
    ],
    benefits: [
      'Training sessions with analytics leaders.',
      'Exposure to financial services data workflows.',
      'Networking with intern cohorts across teams.',
    ],
  },
  {
    id: 'atlas-product-manager-intern-2027',
    company: 'Atlas Health',
    title: 'Associate Product Manager Intern',
    department: 'Product',
    location: 'Remote',
    workplaceType: 'remote',
    employmentType: 'internship',
    salaryRange: '$35 - $45/hour',
    postedAt: '2026-06-23T17:45:00.000Z',
    source: 'mock-careers',
    applyUrl: '/mock-careers/jobs/atlas-product-manager-intern-2027',
    summary: 'Help shape workflow software used by healthcare operations teams.',
    responsibilities: [
      'Write product requirements for focused workflow improvements.',
      'Interview internal users and summarize product opportunities.',
      'Coordinate launch readiness with engineering, design, and support.',
    ],
    qualifications: [
      'Interest in healthcare technology and user-centered product development.',
      'Experience leading projects in a technical or analytical setting.',
      'Ability to turn ambiguous feedback into clear product decisions.',
    ],
    benefits: [
      'Remote-first internship programming.',
      'Product mentorship and roadmap reviews.',
      'Access to customer research sessions.',
    ],
  },
  {
    id: 'bridgewater-cybersecurity-coop-2027',
    company: 'Bridgewater Cloud',
    title: 'Cybersecurity Co-op',
    department: 'Security',
    location: 'Philadelphia, PA',
    workplaceType: 'hybrid',
    employmentType: 'co_op',
    salaryRange: '$34 - $44/hour',
    postedAt: '2026-06-18T14:15:00.000Z',
    source: 'mock-careers',
    applyUrl: '/mock-careers/jobs/bridgewater-cybersecurity-coop-2027',
    summary: 'Support threat detection, vulnerability management, and security automation projects.',
    responsibilities: [
      'Triage security alerts and document investigation notes.',
      'Improve internal scripts for detection and reporting workflows.',
      'Assist with vulnerability review and remediation tracking.',
    ],
    qualifications: [
      'Coursework or projects in networking, security, or systems.',
      'Familiarity with Linux, scripting, and cloud concepts.',
      'Curiosity about defensive security operations.',
    ],
    benefits: [
      'Rotations across security engineering and operations.',
      'Cloud certification reimbursement.',
      'Hands-on security tooling experience.',
    ],
  },
];

export function listMockCareerJobs() {
  return [...mockCareerJobs].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
}

export function getMockCareerJob(id) {
  return mockCareerJobs.find((job) => job.id === id) || null;
}

export function getMockCareerJobsResponse() {
  return {
    jobs: listMockCareerJobs(),
    count: mockCareerJobs.length,
    source: 'mock-careers',
  };
}
