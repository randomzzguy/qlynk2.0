import { baseLayout, ctaButton, heading, para, note } from './base.js';

export function trialExpiredEmail({ username, upgradeUrl = 'https://qlynk.site/pricing', preferencesUrl }) {
  const content = `
    ${heading(`Your trial has ended, ${username}`)}
    ${para(`Your 14-day Qlynk trial is over and your AI agent is now offline. Upgrade to a paid plan to bring it back online and continue building your digital presence.`)}
    ${ctaButton('Upgrade to Keep Going', upgradeUrl)}
    ${note(`All your data, conversations, and settings are still saved. Upgrade anytime to restore access.`)}
  `;
  return {
    subject: `Your Qlynk trial has ended`,
    html: baseLayout(content, { preferencesUrl }),
  };
}
