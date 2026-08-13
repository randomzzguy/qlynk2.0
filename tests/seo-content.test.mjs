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

test('authority cluster contains 19 substantive, unique guides and product updates', () => {
  assert.equal(articles.length, 19);
  assert.equal(new Set(articles.map((item) => item.title)).size, 19);
  assert.equal(new Set(articles.map((item) => item.description)).size, 19);

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
