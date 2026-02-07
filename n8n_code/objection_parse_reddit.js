// Objection Tracker: Parse Reddit API Response
// Transforms Reddit JSON into standardized objection items

const httpResponse = $input.first().json;
const fetchData = $('Prepare Reddit Fetch').first().json;

const sourceId = fetchData.source_id;
const sourceName = fetchData.source_name;
const sourceType = fetchData.source_type;
const subreddit = fetchData.subreddit;

// Parse Reddit response
const posts = httpResponse?.data?.children || [];
const items = [];

for (const post of posts) {
  const data = post.data;

  // Skip if no text content
  const title = data.title || '';
  const selftext = data.selftext || '';
  const fullText = `${title}\n\n${selftext}`.trim();

  if (!fullText || fullText.length < 20) continue;

  // Skip removed/deleted posts
  if (data.removed_by_category || data.selftext === '[removed]' || data.selftext === '[deleted]') continue;

  items.push({
    external_id: `reddit-${data.id}`,
    raw_text: fullText,
    source_url: `https://reddit.com${data.permalink}`,
    source_author: data.author || 'anonymous',
    source_date: new Date(data.created_utc * 1000).toISOString(),
    meta: {
      subreddit: data.subreddit,
      score: data.score,
      num_comments: data.num_comments,
      upvote_ratio: data.upvote_ratio,
      flair: data.link_flair_text,
      is_self: data.is_self,
      platform: 'reddit'
    }
  });
}

// Return standardized structure
return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    items: items,
    fetch_stats: {
      total_fetched: posts.length,
      valid_items: items.length,
      subreddit: subreddit
    }
  }
}];
