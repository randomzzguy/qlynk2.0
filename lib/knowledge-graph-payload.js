export const KNOWLEDGE_GRAPH_ENTITY_TYPES = new Set([
  'person',
  'organization',
  'service',
  'product',
  'place',
  'event',
  'policy',
  'concept',
  'date',
  'other',
]);

const MAX_GRAPH_ITEMS = 16;
const TEMP_ID_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function confidence(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0.5;
}

function normalizePredicate(value) {
  return cleanText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function sourceContains(sourceText, excerpt) {
  return sourceText.toLocaleLowerCase().includes(excerpt.toLocaleLowerCase());
}

export function validateKnowledgeGraphExtraction(payload, sourceContent = '') {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Knowledge graph output must be an object');
  }

  const rawEntities = Array.isArray(payload.entities) ? payload.entities : null;
  const rawClaims = Array.isArray(payload.claims) ? payload.claims : null;
  if (!rawEntities || !rawClaims || rawEntities.length > MAX_GRAPH_ITEMS || rawClaims.length > MAX_GRAPH_ITEMS) {
    throw new Error('Knowledge graph output has invalid collection sizes');
  }

  const boundedSource = cleanText(sourceContent, 4_000);
  const entityIds = new Set();
  const entities = rawEntities.map((entity) => {
    const id = cleanText(entity?.id, 50);
    const name = cleanText(entity?.name, 200);
    const type = cleanText(entity?.type, 30).toLowerCase();
    const aliases = [...new Set(
      (Array.isArray(entity?.aliases) ? entity.aliases : [])
        .map((alias) => cleanText(alias, 200))
        .filter(Boolean)
        .slice(0, 8)
    )];

    if (!TEMP_ID_PATTERN.test(id) || entityIds.has(id) || !name || !KNOWLEDGE_GRAPH_ENTITY_TYPES.has(type)) {
      throw new Error('Knowledge graph output contains an invalid entity');
    }
    if (boundedSource && !sourceContains(boundedSource, name)) {
      throw new Error('Knowledge graph entity is not grounded in the source chunk');
    }
    entityIds.add(id);

    return {
      id,
      name,
      type,
      aliases: aliases.filter((alias) => sourceContains(boundedSource, alias)),
      description: cleanText(entity?.description, 500),
      confidence: confidence(entity?.confidence),
    };
  });

  const claims = rawClaims.map((claim) => {
    const subjectId = cleanText(claim?.subject_id, 50);
    const objectEntityId = cleanText(claim?.object_entity_id, 50);
    const objectValue = cleanText(claim?.object_value, 500);
    const predicate = normalizePredicate(claim?.predicate);
    const statement = cleanText(claim?.statement, 600);
    const excerpt = cleanText(claim?.excerpt, 500);

    if (!entityIds.has(subjectId)
        || Boolean(objectEntityId) === Boolean(objectValue)
        || (objectEntityId && (!entityIds.has(objectEntityId) || objectEntityId === subjectId))
        || !predicate
        || !statement
        || !excerpt
        || !sourceContains(boundedSource, excerpt)) {
      throw new Error('Knowledge graph output contains an invalid or ungrounded claim');
    }

    return {
      subject_id: subjectId,
      predicate,
      object_entity_id: objectEntityId,
      object_value: objectValue,
      statement,
      excerpt,
      confidence: confidence(claim?.confidence),
    };
  });

  return { entities, claims };
}
