export function baseLayout(content, { preferencesUrl } = {}) {
  const preferencesLink = preferencesUrl
    ? `&nbsp;·&nbsp;
                <a href="${String(preferencesUrl).replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" style="color:#555555;text-decoration:none;">Manage email preferences</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;">
          <tr>
            <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #1a1a1a;">
              <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">qlynk</span><span style="font-size:26px;font-weight:800;color:#f46530;">.</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1a1a1a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                © ${new Date().getFullYear()} Qlynk. All rights reserved.<br/>
                <a href="https://qlynk.site" style="color:#f46530;text-decoration:none;">qlynk.site</a>
                ${preferencesLink}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(text, url) {
  return `<table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;padding:14px 36px;background-color:#f46530;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function heading(text) {
  return `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${text}</h1>`;
}

export function para(text) {
  return `<p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">${text}</p>`;
}

export function note(text) {
  return `<p style="margin:28px 0 0;font-size:13px;color:#555555;line-height:1.6;text-align:center;">${text}</p>`;
}

export function divider() {
  return `<hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;" />`;
}

export function infoBox(label, value) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
    <tr>
      <td style="font-size:13px;color:#555555;padding:10px 14px;background:#0a0a0a;border-radius:6px;border:1px solid #1a1a1a;">
        <span style="color:#888888;">${label}:</span>&nbsp;&nbsp;<span style="color:#ffffff;font-weight:600;">${value}</span>
      </td>
    </tr>
  </table>`;
}
