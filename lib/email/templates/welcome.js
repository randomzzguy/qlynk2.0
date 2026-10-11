import { baseLayout, ctaButton, heading, para, note } from './base.js';

export function welcomeEmail({ username, dashboardUrl = 'https://qlynk.site/dashboard', preferencesUrl }) {
  const content = `
    ${heading(`Welcome to Qlynk, ${username}!`)}
    ${para(`Your account is live. You're on Creator, free with no expiry and 5,000 messages per month. Set up your agent, add the information it may use, define its limits, and test the questions people ask you repeatedly.`)}
    ${ctaButton('Go to Dashboard', dashboardUrl)}
    ${note(`No credit card required. Agency is optional for higher usage and removal of Qlynk branding.`)}
  `;
  return {
    subject: `Welcome to Qlynk, ${username}!`,
    html: baseLayout(content, { preferencesUrl }),
  };
}
