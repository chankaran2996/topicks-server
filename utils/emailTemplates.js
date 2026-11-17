const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const layout = (heading, body, link, cta, footnote) => `
<div style="background:#fff8f2;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #eee">
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;color:#a80c13">${heading}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px">${body}</p>
    <a href="${link}" style="display:inline-block;background:#e3121b;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold">${cta}</a>
    <p style="font-size:13px;color:#4a4446;line-height:1.6;margin:24px 0 0">${footnote}</p>
    <p style="font-size:12px;color:#888;word-break:break-all;margin:16px 0 0">Or paste this link into your browser:<br>${link}</p>
  </div>
</div>`;

export const resetPasswordEmail = (name, link, minutes) => ({
  subject: 'Reset your Topicks password',
  html: layout(
    'Reset your password',
    `Hi ${escape(name)}, we received a request to reset your Topicks password. Click below to choose a new one.`,
    link,
    'Set new password',
    `This link expires in ${minutes} minutes and can be used once. If you didn't ask for this, you can ignore this email — your password won't change.`
  ),
  text: `Hi ${name},\n\nReset your Topicks password here (expires in ${minutes} minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
});

export const setPasswordInviteEmail = (name, link, hours) => ({
  subject: 'Set up your Topicks account',
  html: layout(
    'Welcome to Topicks',
    `Hi ${escape(name)}, an account has been created for you. Click below to choose your password and sign in.`,
    link,
    'Set my password',
    `This link expires in ${hours} hours and can be used once.`
  ),
  text: `Hi ${name},\n\nAn account has been created for you. Set your password here (expires in ${hours} hours):\n${link}`,
});
