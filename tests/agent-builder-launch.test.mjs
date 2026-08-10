import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const canonicalSkill = readFileSync('skills/build-qlynk-agent/SKILL.md', 'utf8');
const pluginSkill = readFileSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/skills/build-qlynk-agent/SKILL.md', 'utf8');
const standaloneSkill = readFileSync('distribution/qlynk-agent-builder/standalone/build-qlynk-agent/SKILL.md', 'utf8');
const plugin = JSON.parse(readFileSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/.codex-plugin/plugin.json', 'utf8'));
const marketplace = JSON.parse(readFileSync('distribution/qlynk-agent-builder/.agents/plugins/marketplace.json', 'utf8'));
const landingPage = readFileSync('app/agent-builder/page.jsx', 'utf8');

test('distributed Qlynk Agent Builder copies match the validated canonical skill', () => {
  assert.equal(pluginSkill, canonicalSkill);
  assert.equal(standaloneSkill, canonicalSkill);
});

test('plugin and marketplace expose the intended versioned package', () => {
  assert.equal(plugin.name, 'qlynk-agent-builder');
  assert.equal(plugin.version, '1.0.1');
  assert.equal(plugin.license, 'MIT');
  assert.equal(plugin.skills, './skills/');
  assert.equal(plugin.interface.websiteURL, 'https://www.qlynk.site/agent-builder');
  assert.equal(marketplace.name, 'qlynk');
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].source.path, './plugins/qlynk-agent-builder');
});

test('landing page points to a real versioned download and public repository', () => {
  assert.match(landingPage, /qlynk-agent-builder-skill-v1\.0\.1\.zip/);
  assert.match(landingPage, /github\.com\/randomzzguy\/qlynk-agent-builder/);
  assert.ok(existsSync('distribution/qlynk-agent-builder/LICENSE'));
  assert.ok(existsSync('public/downloads/qlynk-agent-builder-skill-v1.0.1.zip'));
});
