import test from 'node:test';
import assert from 'node:assert/strict';

import { authorityArticles } from '../lib/authority-articles.js';
import { comparisonPages } from '../lib/comparison-pages.js';
import { solutionClusters, solutionPages } from '../lib/solution-pages.js';

const solutions = Object.values(solutionPages);
const articles = Object.values(authorityArticles);

test('all 27 requested solution pages have complete, unique content', () => {
  assert.equal(solutions.length, 27);
  assert.equal(new Set(solutions.map((page) => page.slug)).size, 27);
  assert.equal(new Set(solutions.map((page) => page.title)).size, 27);
  assert.equal(new Set(solutions.map((page) => page.description)).size, 27);

  const clusterKeys = new Set(solutionClusters.map((cluster) => cluster.key));
  for (const page of solutions) {
    assert.ok(clusterKeys.has(page.cluster), `${page.slug} has a valid cluster`);
    assert.ok(page.what.length >= 100, `${page.slug} explains what it is`);
    assert.ok(page.audience.length >= 70, `${page.slug} defines its audience`);
    assert.equal(page.benefits.length, 3, `${page.slug} has three benefits`);
    assert.equal(page.steps.length, 3, `${page.slug} has three workflow steps`);
    assert.ok(page.example.question && page.example.answer, `${page.slug} has an example conversation`);
    assert.ok(page.faqs.length >= 3, `${page.slug} has at least three FAQs`);
    assert.ok(page.related.length >= 3, `${page.slug} has related internal links`);
    assert.ok(page.keywords.length >= 3, `${page.slug} has target keywords`);
    for (const slug of page.related) {
      assert.ok(solutionPages[slug] || authorityArticles[slug], `${page.slug} links to a real related route: ${slug}`);
    }
  }
});

test('all five requested topic clusters are represented', () => {
  assert.deepEqual(
    [...new Set(solutions.map((page) => page.cluster))].sort(),
    ['business', 'core', 'operations', 'people', 'places'],
  );
});

test('authority cluster contains 27 substantive, unique guides and product updates', () => {
  assert.equal(articles.length, 27);
  assert.equal(new Set(articles.map((item) => item.title)).size, 27);
  assert.equal(new Set(articles.map((item) => item.description)).size, 27);

  for (const slug of ['qlynk-agent-understands-questions-better', 'embed-ai-agent-on-website', 'how-to-change-qlynk-username']) {
    assert.ok(authorityArticles[slug], `${slug} has an indexable article route`);
    assert.equal(authorityArticles[slug].category, 'Product update');
    assert.equal(authorityArticles[slug].datePublished, '2026-08-02');
  }

  for (const item of articles) {
    assert.ok(item.sections.length >= 5, `${item.shortTitle} has at least five sections`);
    assert.ok(item.faqs.length >= 3, `${item.shortTitle} has FAQs`);
    assert.ok(item.relatedSolutions.length >= 3, `${item.shortTitle} links to solutions`);
    for (const slug of item.relatedSolutions) assert.ok(solutionPages[slug], `${item.shortTitle} links to ${slug}`);
  }
});

test('Smol Hunt recognition is represented as a factual, internally linked milestone', () => {
  const item = authorityArticles['qlynk-project-of-the-day-smol-hunt'];
  assert.ok(item, 'the recognition has an indexable article route');
  assert.equal(item.category, 'Milestone');
  assert.equal(item.datePublished, '2026-08-26');
  assert.match(JSON.stringify(item), /71 upvotes/);
  assert.match(JSON.stringify(item), /August 24, 2026/);
  assert.ok(item.relatedArticles.length >= 3);
});

test('search visibility cluster contains source-backed guides and a downloadable template', () => {
  const slugs = [
    'ai-model-retirement-migration-checklist',
    'ai-knowledge-base-template',
    'seo-aeo-geo-2026',
  ];

  for (const slug of slugs) {
    const item = authorityArticles[slug];
    assert.ok(item, `${slug} has an indexable article route`);
    assert.equal(item.datePublished, '2026-08-26');
    assert.equal(item.dateModified, '2026-08-26');
    assert.ok(item.quickAnswer.length >= 180, `${slug} leads with a substantive direct answer`);
    assert.ok(item.keywords.length >= 4, `${slug} defines focused search terms`);
    assert.ok(item.sources.length >= 3, `${slug} cites supporting sources`);
    assert.ok(item.relatedArticles.length >= 3, `${slug} links to related resources`);
    for (const relatedSlug of item.relatedArticles) {
      assert.ok(authorityArticles[relatedSlug], `${slug} links to a real resource: ${relatedSlug}`);
    }
  }

  assert.equal(authorityArticles['ai-knowledge-base-template'].download.href, '/downloads/qlynk-ai-knowledge-base-template.md');
});

test('knowledge fabric SEO cluster explains connected retrieval, graphs, temporal memory, and their differences', () => {
  const slugs = [
    'qlynk-knowledge-fabric',
    'what-is-ai-knowledge-graph',
    'ai-agent-memory-patterns',
    'rag-vs-knowledge-graph-ai-memory',
  ];

  for (const slug of slugs) {
    const item = authorityArticles[slug];
    assert.ok(item, `${slug} has an indexable article route`);
    assert.equal(item.datePublished, '2026-08-14');
    assert.ok(item.sections.length >= 6, `${slug} has substantive sections`);
    assert.ok(item.faqs.length >= 4, `${slug} answers distinct search questions`);
    assert.ok(item.relatedArticles.some((relatedSlug) => slugs.includes(relatedSlug)), `${slug} links within the knowledge fabric cluster`);
  }

  const combinedText = slugs.map((slug) => JSON.stringify(authorityArticles[slug])).join(' ');
  assert.match(combinedText, /raw conversations/i);
  assert.match(combinedText, /owner review|reviewed|approval/i);
  assert.match(combinedText, /source evidence/i);
  assert.match(combinedText, /expiry|expires|expired/i);
});

test('freelancer growth guides cover sales, pricing, discovery, testing, and knowledge preparation', () => {
  for (const slug of [
    'how-to-sell-ai-agents-to-small-businesses',
    'how-much-to-charge-for-ai-agent-setup',
    'ai-agent-client-discovery-questionnaire',
    'ai-agent-testing-checklist',
    'how-to-train-ai-agent-on-company-documents',
  ]) {
    assert.ok(authorityArticles[slug], `${slug} has an indexable article route`);
    assert.equal(authorityArticles[slug].datePublished, '2026-08-14');
    assert.equal(authorityArticles[slug].ctaHref, '/agent-builder');
  }
});

test('comparison cluster contains three complete, source-backed platform reviews', () => {
  assert.deepEqual(Object.keys(comparisonPages).sort(), ['qlynk-vs-customgpt', 'qlynk-vs-docsbot', 'qlynk-vs-sitegpt']);

  for (const [slug, comparison] of Object.entries(comparisonPages)) {
    assert.ok(comparison.summary.length >= 150, `${slug} has a substantive summary`);
    assert.equal(comparison.qlynkBestFor.length, 3, `${slug} has Qlynk fit criteria`);
    assert.equal(comparison.vendorBestFor.length, 3, `${slug} has competitor fit criteria`);
    assert.ok(comparison.rows.length >= 8, `${slug} compares at least eight areas`);
    assert.ok(comparison.sources.length >= 2, `${slug} cites official sources`);
    assert.ok(comparison.sources.every(([, href]) => href.startsWith('https://')), `${slug} uses secure source links`);
  }
});
