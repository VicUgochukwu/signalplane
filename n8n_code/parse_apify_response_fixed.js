// Parse Apify response
const fetchData = $('Prepare Apify Fetch').first().json;
const sourceId = fetchData.source_id;
const sourceName = fetchData.source_name;
const sourceType = fetchData.source_type;
const actorId = fetchData.apify_actor_id;

// Get ALL items - Apify returns each result as separate item
const allInputItems = $input.all().map(i => i.json);
let rawItems = [];

// Check if direct results (Reddit) or wrapped format
const first = allInputItems[0];
if (first && (first.id || first.parsedId || first.body)) {
  rawItems = allInputItems;
} else if (first?.items) {
  rawItems = first.items;
} else if (first?.data) {
  rawItems = first.data;
} else if (first?.results) {
  rawItems = first.results;
} else {
  rawItems = allInputItems;
}

const items = [];
for (const raw of rawItems) {
  const textParts = [];
  if (raw.title || raw.reviewTitle) textParts.push(raw.title || raw.reviewTitle);
  const text = raw.body || raw.text || raw.reviewText || raw.content || '';
  if (text) textParts.push(text);
  if (raw.pros) textParts.push('Pros: ' + raw.pros);
  if (raw.cons) textParts.push('Cons: ' + raw.cons);
  const fullText = textParts.join('\n\n').trim();
  if (!fullText || fullText.length < 20) continue;

  let rating = raw.rating || raw.score || raw.stars || null;
  if (typeof rating === 'string') rating = parseFloat(rating.replace(/[^0-9.]/g, '')) || null;

  let sourceDate = raw.createdAt || raw.date || raw.reviewDate || raw.publishedAt;
  try { sourceDate = new Date(sourceDate).toISOString(); } catch { sourceDate = new Date().toISOString(); }

  const externalId = raw.parsedId || raw.id || raw.reviewId || sourceName.replace(/[^a-z0-9]/gi, '-') + '-' + Date.now();

  items.push({
    external_id: externalId,
    raw_text: fullText,
    source_url: raw.url || raw.reviewUrl || null,
    source_author: raw.username || raw.author || raw.reviewerName || 'anonymous',
    source_date: sourceDate,
    meta: {
      platform: (sourceName + actorId).toLowerCase().includes('reddit') ? 'reddit' :
               (sourceName + actorId).toLowerCase().includes('g2') ? 'g2' : 'review_site',
      rating: rating,
      subreddit: raw.communityName || null,
      num_comments: raw.numberOfComments || null,
      helpful_votes: raw.upvotes || raw.numberOfUpvotes || 0
    }
  });
}

return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    items: items,
    fetch_stats: { total_fetched: rawItems.length, valid_items: items.length, actor_id: actorId }
  }
}];
