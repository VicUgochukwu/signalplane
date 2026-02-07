// Objection Tracker: Parse Apify Actor Response
// Transforms Apify scraping results into standardized objection items

const httpResponse = $input.first().json;
const fetchData = $('Prepare Apify Fetch').first().json;

const sourceId = fetchData.source_id;
const sourceName = fetchData.source_name;
const sourceType = fetchData.source_type;
const actorId = fetchData.apify_actor_id;

// Apify returns results in various formats depending on actor
// Most return array of items or object with items array
let rawItems = [];

if (Array.isArray(httpResponse)) {
  rawItems = httpResponse;
} else if (httpResponse?.items && Array.isArray(httpResponse.items)) {
  rawItems = httpResponse.items;
} else if (httpResponse?.data && Array.isArray(httpResponse.data)) {
  rawItems = httpResponse.data;
} else if (httpResponse?.results && Array.isArray(httpResponse.results)) {
  rawItems = httpResponse.results;
}

const items = [];

for (const raw of rawItems) {
  // Extract text content - reviews typically have these fields
  const textParts = [];

  // Review title
  if (raw.title || raw.reviewTitle) {
    textParts.push(raw.title || raw.reviewTitle);
  }

  // Main review text
  const reviewText = raw.text || raw.reviewText || raw.body || raw.content ||
    raw.pros_and_cons || raw.review || raw.comment || '';
  if (reviewText) {
    textParts.push(reviewText);
  }

  // Pros/Cons if separate
  if (raw.pros) {
    textParts.push(`Pros: ${raw.pros}`);
  }
  if (raw.cons) {
    textParts.push(`Cons: ${raw.cons}`);
  }

  const fullText = textParts.join('\n\n').trim();

  // Skip if no meaningful text
  if (!fullText || fullText.length < 20) continue;

  // Extract rating
  let rating = raw.rating || raw.score || raw.stars || raw.overallRating || null;
  if (typeof rating === 'string') {
    rating = parseFloat(rating.replace(/[^0-9.]/g, '')) || null;
  }

  // Extract date
  let sourceDate = raw.date || raw.reviewDate || raw.createdAt || raw.publishedAt || raw.datePublished;
  if (sourceDate) {
    try {
      sourceDate = new Date(sourceDate).toISOString();
    } catch {
      sourceDate = new Date().toISOString();
    }
  } else {
    sourceDate = new Date().toISOString();
  }

  // Build external ID
  const externalId = raw.id || raw.reviewId ||
    `${sourceName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  items.push({
    external_id: externalId,
    raw_text: fullText,
    source_url: raw.url || raw.reviewUrl || raw.link || null,
    source_author: raw.author || raw.reviewerName || raw.userName || raw.user?.name || 'anonymous',
    source_date: sourceDate,
    meta: {
      platform: detectPlatform(sourceName, actorId),
      rating: rating,
      verified_purchase: raw.verifiedPurchase || raw.verified || false,
      helpful_votes: raw.helpfulVotes || raw.helpful || raw.upvotes || 0,
      // G2/Capterra specific
      reviewer_title: raw.reviewerTitle || raw.jobTitle || null,
      reviewer_company: raw.reviewerCompany || raw.company || null,
      company_size: raw.companySize || null,
      industry: raw.industry || null,
      use_case: raw.useCase || null,
      product_name: raw.productName || raw.product || null,
      // Review specific
      review_type: raw.reviewType || null,
      recommendation: raw.recommendation || raw.wouldRecommend || null,
      // Original for debugging
      _raw_keys: Object.keys(raw)
    }
  });
}

function detectPlatform(name, actor) {
  const lower = (name + actor).toLowerCase();
  if (lower.includes('g2')) return 'g2';
  if (lower.includes('capterra')) return 'capterra';
  if (lower.includes('trustradius')) return 'trustradius';
  if (lower.includes('gartner')) return 'gartner';
  if (lower.includes('software')) return 'software_advice';
  return 'review_site';
}

// Return standardized structure
return [{
  json: {
    source_id: sourceId,
    source_name: sourceName,
    source_type: sourceType,
    items: items,
    fetch_stats: {
      total_fetched: rawItems.length,
      valid_items: items.length,
      actor_id: actorId
    }
  }
}];
