import { baseLayout, ctaButton, heading, para, infoBox, divider, note } from './base.js';

export function paymentFailedEmail({
  username,
  planName,
  invoiceUrl = 'https://qlynk.site/dashboard/billing',
  amountDue = null,
  preferencesUrl,
}) {
  const content = `
    ${heading(`Payment issue for your Qlynk subscription`)}
    ${para(`Hi ${username}, we couldn't process your latest subscription payment. Your agent may be restricted until the payment issue is resolved.`)}
    ${infoBox('Plan', planName)}
    ${amountDue ? infoBox('Amount due', amountDue) : ''}
    ${divider()}
    ${ctaButton('Fix Payment Method', invoiceUrl)}
    ${note(`If you already updated your card, Stripe may retry automatically. You can also manage billing from your dashboard.`)}
  `;

  return {
    subject: 'Qlynk payment failed',
    html: baseLayout(content, { preferencesUrl }),
  };
}
