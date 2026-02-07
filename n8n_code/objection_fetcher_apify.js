// Objection Tracker: Apify Fetcher
// Triggers Apify actors for G2/Capterra review scraping

const input = $input.first().json;
const sourceId = input.source_id;
const sourceName = input.source_name;
const sourceType = input.source_type;
const actorId = input.actor_id;
const startUrls = input.start_urls || [];
const maxItems = input.max_items || 50;

// Determine which Apify actor to use based on source
let actorConfig = {};

if (sourceName.toLowerCase().includes('g2')) {
  // G2 Reviews Scraper
  // Actor: "epctex/g2-scraper" or similar
  actorConfig = {
    actorId: actorId || 'epctex/g2-scraper',
    input: {
      startUrls: startUrls.map(url => ({ url })),
      maxItems: maxItems,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
      }
    }
  };
} else if (sourceName.toLowerCase().includes('capterra')) {
  // Capterra Reviews Scraper
  actorConfig = {
    actorId: actorId || 'apify/web-scraper',
    input: {
      startUrls: startUrls.map(url => ({ url })),
      maxRequestsPerCrawl: maxItems,
      pageFunction: `
        async function pageFunction(context) {
          const { $, request } = context;
          const reviews = [];

          $('.review-card, .review-item, [data-testid="review"]').each((i, el) => {
            const $el = $(el);
            reviews.push({
              text: $el.find('.review-text, .review-body, .review-content').text().trim(),
              rating: $el.find('.rating, .stars').text().trim(),
              author: $el.find('.reviewer-name, .author').text().trim(),
              date: $el.find('.review-date, .date').text().trim(),
              title: $el.find('.review-title, h3').text().trim(),
              url: request.url
            });
          });

          return reviews;
        }
      `
    }
  };
} else if (sourceName.toLowerCase().includes('trustradius')) {
  // TrustRadius Reviews
  actorConfig = {
    actorId: actorId || 'apify/web-scraper',
    input: {
      startUrls: startUrls.map(url => ({ url })),
      maxRequestsPerCrawl: maxItems
    }
  };
} else if (sourceName.toLowerCase().includes('reddit') || actorId?.includes('reddit-scraper')) {
  // Reddit Scraper Lite (trudax/reddit-scraper-lite)
  // Extract subreddit name from URL (e.g., "SaaS" from "https://www.reddit.com/r/SaaS/")
  let subredditName = '';
  if (startUrls.length > 0) {
    const url = startUrls[0].url || startUrls[0];
    const match = url.match(/reddit\.com\/r\/([^\/]+)/);
    if (match) {
      subredditName = match[1];
    }
  }

  actorConfig = {
    actorId: actorId || 'trudax/reddit-scraper-lite',
    input: {
      // Use searches + searchCommunityName instead of startUrls
      // The Reddit Scraper Lite doesn't accept subreddit URLs in startUrls
      searches: ['*'],  // Broad search to get all posts
      searchCommunityName: subredditName,
      sort: 'new',
      maxItems: maxItems,
      maxPostCount: maxItems,
      skipComments: true,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
      }
    }
  };
} else {
  // Generic web scraper
  actorConfig = {
    actorId: actorId || 'apify/web-scraper',
    input: {
      startUrls: startUrls.map(url => ({ url })),
      maxRequestsPerCrawl: maxItems
    }
  };
}

// Return config for Apify HTTP call
// The actual API call will be made by an HTTP Request node
return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    apify_actor_id: actorConfig.actorId,
    apify_input: actorConfig.input,
    _action: 'run_apify_actor'
  }
}];
