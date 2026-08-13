const DEFAULT_CHUNK_CHARS = 1_600;
const DEFAULT_CHUNK_OVERLAP = 180;

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'because', 'been', 'before',
  'being', 'between', 'could', 'does', 'from', 'have', 'into', 'just', 'more',
  'most', 'other', 'over', 'please', 'should', 'tell', 'than', 'that', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'under',
  'very', 'want', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
  'your', 'you', 'who', 'why', 'how',
]);

function cleanText(value, maxLength = 250_000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function tokenize(value) {
  return [...new Set(
    cleanText(value, 12_000)
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9'-]{2,}/g)
      ?.filter((word) => !STOP_WORDS.has(word)) || []
  )];
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1 && count < 5) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function findChunkBoundary(text, start, proposedEnd, minimumEnd) {
  const candidate = text.slice(start, proposedEnd);
  const minimumOffset = Math.max(1, minimumEnd - start);
  const paragraphBreak = candidate.lastIndexOf('\n\n');
  if (paragraphBreak >= minimumOffset) return start + paragraphBreak;

  const sentenceBoundary = Math.max(
    candidate.lastIndexOf('. '),
    candidate.lastIndexOf('? '),
    candidate.lastIndexOf('! '),
    candidate.lastIndexOf('; '),
  );
  if (sentenceBoundary >= minimumOffset) return start + sentenceBoundary + 1;

  const wordBoundary = candidate.lastIndexOf(' ');
  return wordBoundary >= minimumOffset ? start + wordBoundary : proposedEnd;
}

export function chunkKnowledgeText(value, options = {}) {
  const text = cleanText(value);
  if (!text) return [];

  const maxChars = Math.max(400, Math.min(Number(options.maxChars) || DEFAULT_CHUNK_CHARS, 4_000));
  const overlapChars = Math.max(0, Math.min(Number(options.overlapChars) || DEFAULT_CHUNK_OVERLAP, Math.floor(maxChars / 3)));
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const proposedEnd = Math.min(text.length, start + maxChars);
    const end = proposedEnd < text.length
      ? findChunkBoundary(text, start, proposedEnd, start + Math.floor(maxChars * 0.6))
      : proposedEnd;
    const content = text.slice(start, end).trim();

    if (content) {
      chunks.push({
        content,
        char_start: start,
        char_end: end,
      });
    }

    if (end >= text.length) break;
    const nextStart = Math.max(start + 1, end - overlapChars);
    const nextWhitespace = text.indexOf(' ', nextStart);
    start = nextWhitespace !== -1 && nextWhitespace < end ? nextWhitespace + 1 : nextStart;
  }

  return chunks;
}

function sourceKey(item, index) {
  return String(
    item?.source_id
      || item?.knowledge_id
      || item?.document_id
      || `${item?.source_type || 'manual'}:${item?.source_title || item?.title || index}`
  );
}

export function buildKnowledgeChunks(knowledge = [], options = {}) {
  return (Array.isArray(knowledge) ? knowledge : []).flatMap((item, sourceIndex) => {
    const chunks = chunkKnowledgeText(item?.content, options);
    const key = sourceKey(item, sourceIndex);
    const sourceTitle = cleanText(item?.source_title || item?.title, 300) || 'Knowledge item';

    return chunks.map((chunk, chunkIndex) => ({
      ...item,
      title: sourceTitle,
      source_title: sourceTitle,
      source_key: key,
      content: chunk.content,
      chunk_index: Number.isInteger(item?.chunk_index) ? item.chunk_index : chunkIndex,
      char_start: Number.isInteger(item?.char_start) ? item.char_start : chunk.char_start,
      char_end: Number.isInteger(item?.char_end) ? item.char_end : chunk.char_end,
    }));
  });
}

function isCurrentlyUsable(item, now) {
  const evidenceStatus = item?.evidence_status || 'verified';
  if (evidenceStatus !== 'verified') return false;

  const validFrom = item?.valid_from ? Date.parse(item.valid_from) : null;
  const validUntil = item?.valid_until ? Date.parse(item.valid_until) : null;
  if (Number.isFinite(validFrom) && validFrom > now) return false;
  if (Number.isFinite(validUntil) && validUntil <= now) return false;
  return true;
}

export function selectRelevantKnowledge(knowledge = [], query = '', options = {}) {
  const maxItems = options.maxItems || 8;
  const maxItemChars = options.maxItemChars || 2_000;
  const maxTotalChars = options.maxTotalChars || 12_000;
  const maxChunksPerSource = options.maxChunksPerSource || 2;
  const queryTokens = tokenize(query);
  const normalizedQuery = cleanText(query, 12_000).toLowerCase();
  const now = options.now ? new Date(options.now).getTime() : Date.now();

  const normalized = (Array.isArray(knowledge) ? knowledge : [])
    .map((item, index) => {
      if (!isCurrentlyUsable(item, now)) return null;

      const title = cleanText(item?.title || item?.source_title, 300);
      const sourceTitle = cleanText(item?.source_title || title, 300);
      const category = cleanText(item?.category, 100);
      const content = cleanText(item?.content, Math.max(maxItemChars * 3, maxItemChars));
      if (!content) return null;

      const titleLower = title.toLowerCase();
      const sourceTitleLower = sourceTitle.toLowerCase();
      const categoryLower = category.toLowerCase();
      const contentLower = content.toLowerCase();
      let matchScore = 0;

      for (const token of queryTokens) {
        if (titleLower.includes(token)) matchScore += 8;
        if (sourceTitleLower !== titleLower && sourceTitleLower.includes(token)) matchScore += 5;
        if (categoryLower.includes(token)) matchScore += 3;
        matchScore += Math.min(countOccurrences(contentLower, token), 3);
      }

      if (normalizedQuery.length >= 4) {
        if (titleLower.includes(normalizedQuery)) matchScore += 14;
        if (contentLower.includes(normalizedQuery)) matchScore += 12;
      }

      if (queryTokens.length > 1) {
        const phrase = queryTokens.join(' ');
        if (contentLower.includes(phrase)) matchScore += 10;
      }

      const retrievalRank = Math.max(0, Number(item?.retrieval_rank) || 0);
      const priority = Math.max(1, Math.min(5, Number(item?.priority) || 1));
      const priorityBoost = matchScore > 0 || retrievalRank > 0 ? (priority - 1) * 1.5 : 0;
      const sourceBoost = item?.source_type !== 'file' ? 0.25 : 0;
      const score = matchScore + retrievalRank + priorityBoost + sourceBoost;

      return {
        ...item,
        title,
        source_title: sourceTitle,
        content,
        priority,
        matchScore,
        retrieval_rank: retrievalRank,
        score,
        index,
        source_key: item?.source_key || sourceKey(item, index),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.priority - a.priority || a.index - b.index);

  const hasRelevantMatch = normalized.some((item) => item.matchScore >= 1 || Number(item.retrieval_rank) > 0);
  const candidateLimit = hasRelevantMatch
    ? maxItems
    : Math.min(options.fallbackItems || 3, maxItems);
  const selected = [];
  const perSourceCounts = new Map();
  let usedCharacters = 0;

  for (const item of normalized) {
    if (selected.length >= candidateLimit || usedCharacters >= maxTotalChars) break;
    if (hasRelevantMatch && item.matchScore < 1 && item.retrieval_rank <= 0) continue;

    const sourceCount = perSourceCounts.get(item.source_key) || 0;
    if (sourceCount >= maxChunksPerSource) continue;

    const remaining = maxTotalChars - usedCharacters;
    const content = item.content.slice(0, Math.min(maxItemChars, remaining));
    if (!content) continue;

    selected.push({
      title: item.title || 'Knowledge item',
      content,
      source_type: item.source_type || 'manual',
      source_title: item.source_title || item.title || 'Knowledge item',
      source_url: item.source_url || null,
      source_id: item.source_id || item.knowledge_id || item.document_id || null,
      chunk_index: Number.isInteger(item.chunk_index) ? item.chunk_index : 0,
      category: item.category || null,
      priority: item.priority,
      verified_at: item.verified_at || null,
      knowledge_kind: item.knowledge_kind || 'source_chunk',
      graph_subject: item.graph_subject || null,
      graph_predicate: item.graph_predicate || null,
      graph_object: item.graph_object || null,
      graph_depth: Number.isInteger(item.graph_depth) ? item.graph_depth : null,
      evidence_count: Math.max(0, Number(item.evidence_count) || 0),
      supporting_sources: Array.isArray(item.supporting_sources)
        ? item.supporting_sources.slice(0, 8).map((source) => cleanText(source, 300)).filter(Boolean)
        : [],
      temporal_kind: item.temporal_kind || null,
      temporal_entity: item.temporal_entity || null,
      occurred_at: item.occurred_at || null,
      expires_at: item.expires_at || null,
      support_count: Math.max(0, Number(item.support_count) || 0),
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
      consent_basis: item.consent_basis || null,
    });
    perSourceCounts.set(item.source_key, sourceCount + 1);
    usedCharacters += content.length;
  }

  return selected;
}
