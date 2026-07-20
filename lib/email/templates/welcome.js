import { baseLayout, ctaButton, heading, para, note } from './base.js';

export function welcomeEmail({ username, dashboardUrl = 'https://qlynk.site/dashboard', preferencesUrl }) {
  const content = `
    ${heading(`Welcome to Qlynk, ${username}!`)}
    ${para(`Your account is live. You're now on a 14-day free trial — everything is unlocked. Set up your agent, add the information it may use, define its limits, and test the questions people ask you repeatedly.`)}
    ${ctaButton('Go to Dashboard', dashboardUrl)}
    ${note(`Your trial lasts 14 days. No credit card required to get started.`)}
  `;
  return {
    subject: `Welcome to Qlynk, ${username}!`,
    html: baseLayout(content, { preferencesUrl }),
  };
}
