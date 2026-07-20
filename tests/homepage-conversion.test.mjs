import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const homepagePath = new URL('../app/page.jsx', import.meta.url);
const demoPath = new URL('../components/HomepageAgentDemo.jsx', import.meta.url);

test('homepage keeps the outcome-led hero, live demo, trust controls, comparison, and FAQ', async () => {
  const source = await readFile(homepagePath, 'utf8');

  assert.match(source, /Answer Routine Questions Instantly/);
  assert.match(source, /What is “approved knowledge”\?/);
  assert.match(source, /id="live-demo"/);
  assert.match(source, /TRUST IS A WORKFLOW/);
  assert.match(source, /WHY NOT JUST USE A GENERAL AI CHAT\?/);
  assert.match(source, /<HomepageFAQ \/>/);
  assert.match(source, /'@type': 'FAQPage'/);
  assert.doesNotMatch(source, /Trusted by 2,000|68%|12 hours\/week|95% response accuracy/);
});

test('homepage conversion points and demo interactions expose measurement hooks', async () => {
  const [homepageSource, demoSource] = await Promise.all([
    readFile(homepagePath, 'utf8'),
    readFile(demoPath, 'utf8'),
  ]);

  assert.match(homepageSource, /homepage_signup_click/);
  assert.match(homepageSource, /homepage_demo_click/);
  assert.match(demoSource, /homepage_demo_question_submitted/);
  assert.match(demoSource, /homepage_demo_answer_received/);
});
