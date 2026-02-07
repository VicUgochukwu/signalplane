// Objection Tracker: Smart Fetcher Router
// Routes to appropriate fetcher based on source type and fetch_method

const source = $input.first().json;
const sourceId = source.id;
const sourceName = source.source_name;
const sourceType = source.source_type;
const fetchMethod = source.fetch_method || 'manual';
const fetchConfig = source.fetch_config || {};
const urlPattern = source.url_pattern;
const apiEndpoint = source.api_endpoint;

// Helper: Create standardized item structure
function createItem(data) {
  return {
    external_id: data.external_id || `${sourceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    raw_text: data.raw_text || data.text || data.content || '',
    source_url: data.source_url || data.url || null,
    source_author: data.source_author || data.author || null,
    source_date: data.source_date || data.date || data.created_at || new Date().toISOString(),
    meta: data.meta || {}
  };
}

// Route based on fetch_method
let items = [];
let fetchError = null;

try {
  switch (fetchMethod) {

    case 'webhook':
    case 'manual':
      // Manual/webhook items are ingested via separate webhook workflow
      // This scheduled run just checks for any pending items in a staging table
      // For now, return empty - items come through webhook
      items = [];
      break;

    case 'reddit_api':
      // Reddit API fetching - handled by dedicated Reddit node
      // Pass through to Reddit fetcher
      return [{
        json: {
          source_id: sourceId,
          source_name: sourceName,
          source_type: sourceType,
          fetch_method: 'reddit_api',
          subreddit: fetchConfig.subreddit || urlPattern?.match(/r\/(\w+)/)?.[1] || 'sales',
          search_terms: fetchConfig.search_terms || ['objection', 'concern', 'problem', 'issue', 'complaint'],
          limit: fetchConfig.limit || 25,
          time_filter: fetchConfig.time_filter || 'week',
          _route: 'reddit'
        }
      }];

    case 'apify':
      // Apify scraping - handled by dedicated Apify node
      return [{
        json: {
          source_id: sourceId,
          source_name: sourceName,
          source_type: sourceType,
          fetch_method: 'apify',
          actor_id: fetchConfig.actor_id || 'apify/web-scraper',
          start_urls: fetchConfig.start_urls || [urlPattern],
          max_items: fetchConfig.max_items || 50,
          _route: 'apify'
        }
      }];

    case 'rss':
      // RSS feed fetching
      return [{
        json: {
          source_id: sourceId,
          source_name: sourceName,
          source_type: sourceType,
          fetch_method: 'rss',
          feed_url: apiEndpoint || urlPattern,
          _route: 'rss'
        }
      }];

    case 'csv_import':
      // CSV imports come through separate import workflow
      items = [];
      break;

    default:
      // Unknown fetch method - skip
      items = [];
  }
} catch (error) {
  fetchError = error.message;
  items = [];
}

// Return standardized structure
return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    fetch_method: fetchMethod,
    items: items,
    fetch_error: fetchError,
    _route: 'direct'
  }
}];
