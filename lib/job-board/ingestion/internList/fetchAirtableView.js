export class InternListFetchError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'InternListFetchError';
    this.status = details.status || null;
    this.code = details.code || null;
  }
}

export async function fetchInternListAirtableView(source, options = {}) {
  const fetcher = options.fetcher || fetch;
  const embedUrl = source.metadata?.airtableEmbedUrl || source.metadata?.airtable_embed_url;
  if (!embedUrl) {
    throw new InternListFetchError(`Intern List source ${source.sourceName} is missing an Airtable embed URL.`, { code: 'missing_embed_url' });
  }

  const embedResponse = await fetcher(embedUrl, { method: 'GET' });
  if (!embedResponse?.ok) {
    throw new InternListFetchError(`Airtable embed request failed with status ${embedResponse?.status || 'unknown'}.`, {
      status: embedResponse?.status,
      code: 'embed_fetch_failed',
    });
  }

  const embedHtml = await embedResponse.text();
  const sharedViewPath = extractSharedViewDataPath(embedHtml);
  const applicationId = extractApplicationId(embedHtml) || parseAirtableApplicationId(embedUrl);
  if (!sharedViewPath || !applicationId) {
    throw new InternListFetchError(`Airtable embed did not expose shared-view data for ${source.sourceName}.`, {
      code: 'missing_shared_view_data',
    });
  }

  const dataUrl = new URL(sharedViewPath, 'https://airtable.com').toString();
  const dataResponse = await fetcher(dataUrl, {
    method: 'GET',
    headers: {
      'x-airtable-application-id': applicationId,
      'X-Requested-With': 'XMLHttpRequest',
      'x-airtable-inter-service-client': 'webClient',
      'x-time-zone': options.timeZone || 'America/New_York',
      'x-user-locale': 'en',
    },
  });

  if (!dataResponse?.ok) {
    throw new InternListFetchError(`Airtable shared-view data request failed with status ${dataResponse?.status || 'unknown'}.`, {
      status: dataResponse?.status,
      code: 'shared_view_fetch_failed',
    });
  }

  const payload = await dataResponse.json();
  if (payload?.msg !== 'SUCCESS' || !payload?.data?.table?.rows) {
    throw new InternListFetchError(`Airtable shared-view data was not in the expected format for ${source.sourceName}.`, {
      code: 'invalid_shared_view_payload',
    });
  }

  return {
    payload,
    applicationId,
    sharedViewUrl: dataUrl,
    embedUrl,
  };
}

export function extractSharedViewDataPath(html) {
  const match = String(html || '').match(/urlWithParams:\s*"([^"]+)"/);
  if (!match) return null;
  return match[1].replaceAll('\\u002F', '/').replaceAll('&amp;', '&');
}

export function extractApplicationId(html) {
  const headerMatch = String(html || '').match(/"x-airtable-application-id":"([^"]+)"/);
  if (headerMatch) return headerMatch[1];
  const initMatch = String(html || '').match(/"singleApplicationId":"([^"]+)"/);
  if (initMatch) return initMatch[1];
  return null;
}

function parseAirtableApplicationId(embedUrl) {
  const match = String(embedUrl || '').match(/\/embed\/(app[^/]+)/);
  return match?.[1] || null;
}
