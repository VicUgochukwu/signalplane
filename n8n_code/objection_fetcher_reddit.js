// Objection Tracker: Reddit Fetcher
// Fetches posts and comments from specified subreddits matching objection keywords

const input = $input.first().json;
const sourceId = input.source_id;
const sourceName = input.source_name;
const sourceType = input.source_type;
const subreddit = input.subreddit || 'sales';
const searchTerms = input.search_terms || ['objection', 'concern', 'problem', 'issue'];
const limit = input.limit || 25;
const timeFilter = input.time_filter || 'week';

// Build Reddit search query
// Combine terms with OR and add context terms
const queryTerms = [
  ...searchTerms,
  'customer complaint',
  'buyer hesitation',
  'deal lost',
  'pricing concern',
  'too expensive',
  'not ready',
  'competitor better'
];

const searchQuery = queryTerms.slice(0, 5).join(' OR ');

// Reddit API endpoint (via oauth or public JSON endpoint)
// Using public JSON endpoint for simplicity - no auth required
const redditUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=on&sort=new&t=${timeFilter}&limit=${limit}`;

// This will be called via HTTP Request node
// Return the URL and metadata for the HTTP node to fetch
return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    reddit_url: redditUrl,
    subreddit: subreddit,
    search_query: searchQuery,
    _action: 'fetch_reddit'
  }
}];
