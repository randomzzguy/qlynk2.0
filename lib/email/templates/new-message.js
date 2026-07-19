import { baseLayout, ctaButton, heading, para, infoBox, divider, note } from './base.js';

export function newMessageEmail({ visitorName, visitorEmail, messagePreview, conversationsUrl, preferencesUrl }) {
  const displayName = visitorName || visitorEmail || 'Someone';
  const preview = messagePreview
    ? messagePreview.length > 120
      ? messagePreview.slice(0, 120) + '…'
      : messagePreview
    : null;

  const infoRows = [
    infoBox('From', displayName),
    visitorEmail && visitorEmail !== displayName ? infoBox('Email', visitorEmail) : '',
    preview ? infoBox('Message', `"${preview}"`) : '',
  ].filter(Boolean).join('');

  const url = conversationsUrl || 'https://qlynk.site/dashboard/conversations';

  const content = `
    ${heading('New conversation started')}
    ${para(`Someone just started a conversation with your AI agent on your Qlynk page.`)}
    ${infoRows}
    ${divider()}
    ${ctaButton('View Conversation', url)}
    ${note(`Open the conversation from your dashboard whenever you're ready to reply.`)}
  `;

  return {
    subject: `${displayName} started a conversation with your agent`,
    html: baseLayout(content, { preferencesUrl }),
  };
}
