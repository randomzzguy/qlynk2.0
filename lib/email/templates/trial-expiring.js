import { baseLayout, ctaButton, heading, para, note } from './base.js';

export function trialExpiringEmail({ username, daysLeft, upgradeUrl = 'https://qlynk.site/pricing' }) {
  const content = `
    ${heading(`Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`)}
    ${para(`Hey ${username}, your Qlynk free trial is almost up. Upgrade now to keep your AI agent live, retain all your conversations, and unlock your full page.`)}
    ${ctaButton('Upgrade Now', upgradeUrl)}
    ${note(`After your trial ends, your agent will go offline until you upgrade. Your data is always safe.`)}
  `;
  return {
    subject: `Your Qlynk trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: baseLayout(content),
  };
}
