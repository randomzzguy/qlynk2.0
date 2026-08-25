import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [homepage, pressPage, socialPack, conversionAudit] = await Promise.all([
  readFile(new URL('../app/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../app/press/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../docs/growth/linkedin-content-plan-2026-08.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/growth/homepage-conversion-audit-2026-08-26.md', import.meta.url), 'utf8'),
]);

test('homepage exposes factual recognition and a no-signup demo path', () => {
  assert.match(homepage, /#1 Project of the Day/);
  assert.match(homepage, /\/blog\/qlynk-project-of-the-day-smol-hunt/);
  assert.match(homepage, /href="#live-demo"/);
  assert.match(homepage, /id="live-demo"/);
  assert.match(homepage, /Build Your Agent Free/);
});

test('press kit records the dated Smol Hunt result without unsupported customer claims', () => {
  assert.match(pressPage, /August 24, 2026/);
  assert.match(pressPage, /71 upvotes/);
  assert.match(pressPage, /Read the milestone note/);
});

test('LinkedIn pack contains twelve ready-to-post drafts and a tracked link', () => {
  assert.equal((socialPack.match(/^### Post \d+ —/gm) || []).length, 12);
  assert.match(socialPack, /utm_source=linkedin/);
  assert.match(socialPack, /projectOfTheDay\.png/);
});

test('conversion audit separates implemented changes from recommendations', () => {
  assert.match(conversionAudit, /Implemented change:/);
  assert.match(conversionAudit, /These names are recommendations, not claims/);
  assert.match(conversionAudit, /Do not add anonymous testimonials/);
});
