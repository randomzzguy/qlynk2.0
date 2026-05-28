import { baseLayout, ctaButton, heading, para, note } from './base.js';

export function welcomeEmail({ username, dashboardUrl = 'https://qlynk.site/dashboard' }) {
  const content = `
    ${heading(`Welcome to Qlynk, ${username}!`)}
    ${para(`Your account is live. You're now on a 14-day free trial — everything is unlocked. Set up your AI agent, build your page, and start sharing your digital twin with the world.`)}
    ${ctaButton('Go to Dashboard', dashboardUrl)}
    ${note(`Your trial lasts 14 days. No credit card required to get started.`)}
  `;
  return {
    subject: `Welcome to Qlynk, ${username}!`,
    html: baseLayout(content),
  };
}
