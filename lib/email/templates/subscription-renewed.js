import { baseLayout, ctaButton, heading, para, infoBox, divider, note } from './base.js';

export function subscriptionRenewedEmail({ username, planName, renewalDate, dashboardUrl = 'https://qlynk.site/dashboard', preferencesUrl }) {
  const content = `
    ${heading(`You're all set, ${username}`)}
    ${para(`Your Qlynk subscription has been renewed successfully. Your agent stays live and your page keeps running.`)}
    ${infoBox('Plan', planName)}
    ${renewalDate ? infoBox('Next renewal', renewalDate) : ''}
    ${divider()}
    ${ctaButton('Go to Dashboard', dashboardUrl)}
    ${note(`To manage your subscription, visit <a href="https://qlynk.site/dashboard/settings" style="color:#f46530;text-decoration:none;">dashboard settings</a>.`)}
  `;
  return {
    subject: `Qlynk subscription renewed`,
    html: baseLayout(content, { preferencesUrl }),
  };
}
