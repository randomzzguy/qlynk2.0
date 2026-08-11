import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const canonicalSkill = readFileSync('skills/build-qlynk-agent/SKILL.md', 'utf8');
const pluginSkill = readFileSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/skills/build-qlynk-agent/SKILL.md', 'utf8');
const standaloneSkill = readFileSync('distribution/qlynk-agent-builder/standalone/build-qlynk-agent/SKILL.md', 'utf8');
const plugin = JSON.parse(readFileSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/.codex-plugin/plugin.json', 'utf8'));
const claudePlugin = JSON.parse(readFileSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/.claude-plugin/plugin.json', 'utf8'));
const marketplace = JSON.parse(readFileSync('distribution/qlynk-agent-builder/.agents/plugins/marketplace.json', 'utf8'));
const claudeMarketplace = JSON.parse(readFileSync('distribution/qlynk-agent-builder/.claude-plugin/marketplace.json', 'utf8'));
const landingPage = readFileSync('app/agent-builder/page.jsx', 'utf8');
const installTabs = readFileSync('components/AgentBuilderInstallTabs.jsx', 'utf8');

const references = ['discovery.md', 'qlynk-fields.md', 'launch-quality.md'];

test('distributed Qlynk Agent Builder copies match the validated canonical skill', () => {
  assert.equal(pluginSkill, canonicalSkill);
  assert.equal(standaloneSkill, canonicalSkill);
  for (const reference of references) {
    const canonical = readFileSync(`skills/build-qlynk-agent/references/${reference}`, 'utf8');
    assert.equal(readFileSync(`distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/skills/build-qlynk-agent/references/${reference}`, 'utf8'), canonical);
    assert.equal(readFileSync(`distribution/qlynk-agent-builder/standalone/build-qlynk-agent/references/${reference}`, 'utf8'), canonical);
  }
});

test('plugin and marketplace expose the intended versioned package', () => {
  assert.equal(plugin.name, 'qlynk-agent-builder');
  assert.equal(plugin.version, '1.1.1');
  assert.equal(plugin.license, 'MIT');
  assert.equal(plugin.skills, './skills/');
  assert.equal(plugin.interface.websiteURL, 'https://www.qlynk.site/agent-builder');
  assert.equal(marketplace.name, 'qlynk');
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].source.path, './plugins/qlynk-agent-builder');
  assert.equal(claudePlugin.name, plugin.name);
  assert.equal(claudePlugin.version, plugin.version);
  assert.equal(claudePlugin.license, 'MIT');
  assert.equal(claudeMarketplace.name, 'qlynk');
  assert.equal(claudeMarketplace.plugins[0].name, plugin.name);
  assert.equal(claudeMarketplace.plugins[0].source, './plugins/qlynk-agent-builder');
});

test('landing page points to a real versioned download and public repository', () => {
  assert.match(landingPage, /1\.1\.1/);
  assert.match(landingPage, /github\.com\/randomzzguy\/qlynk-agent-builder/);
  assert.match(landingPage, /chatgpt\.com\/plugins\/plugins_6a7a8eef28608191869f04ead95cd5b2/);
  assert.match(landingPage, /Official Codex plugin/);
  assert.match(landingPage, /Claude community directory review pending/);
  assert.match(installTabs, /Official plugin · Live/);
  assert.match(installTabs, /Community directory · Under review/);
  assert.match(installTabs, /claude plugin marketplace add randomzzguy\/qlynk-agent-builder/);
  assert.match(installTabs, /qlynk-agent-builder:build-qlynk-agent/);
  assert.ok(existsSync('distribution/qlynk-agent-builder/LICENSE'));
  assert.ok(existsSync('public/downloads/qlynk-agent-builder-skill-v1.1.1.zip'));
  assert.ok(existsSync('public/downloads/qlynk-agent-builder-plugin-v1.1.1.zip'));
});

test('plugin directory artwork uses exact square PNG assets', () => {
  assert.equal(plugin.interface.composerIcon, './assets/icon.png');
  assert.equal(plugin.interface.logo, './assets/logo.png');
  assert.equal(plugin.interface.logoDark, './assets/logo-dark.png');
  assert.ok(existsSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/assets/icon.png'));
  assert.ok(existsSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/assets/logo.png'));
  assert.ok(existsSync('distribution/qlynk-agent-builder/plugins/qlynk-agent-builder/assets/logo-dark.png'));
});
