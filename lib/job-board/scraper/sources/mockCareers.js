export const mockCareersAdapter = {
  source: 'mock-careers',
  async fetchJobs({ url, fetcher = fetch }) {
    if (!url) throw new Error('Mock Careers URL is required.');

    const response = await fetcher(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Mock Careers request failed with ${response.status}`);
    }

    const body = await response.json();
    return Array.isArray(body?.jobs) ? body.jobs : [];
  },
};
