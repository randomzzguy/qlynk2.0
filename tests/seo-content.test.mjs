import test from 'node:test';
import assert from 'node:assert/strict';

import { authorityArticles } from '../lib/authority-articles.js';
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

test('initial authority cluster contains 11 substantive, unique guides', () => {
  assert.equal(articles.length, 11);
  assert.equal(new Set(articles.map((item) => item.title)).size, 11);
  assert.equal(new Set(articles.map((item) => item.description)).size, 11);

  for (const item of articles) {
    assert.ok(item.sections.length >= 5, `${item.shortTitle} has at least five sections`);
    assert.ok(item.faqs.length >= 3, `${item.shortTitle} has FAQs`);
    assert.ok(item.relatedSolutions.length >= 3, `${item.shortTitle} links to solutions`);
    for (const slug of item.relatedSolutions) assert.ok(solutionPages[slug], `${item.shortTitle} links to ${slug}`);
  }
});
