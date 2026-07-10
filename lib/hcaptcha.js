const VERIFY_URL = 'https://hcaptcha.com/siteverify';

/**
 * Verify hCaptcha on the server. The local bypass is deliberately limited to
 * development builds so a forged token can never disable captcha in production.
 */
export async function verifyHCaptchaToken(token) {
  const isDevelopmentBypass =
    process.env.NODE_ENV === 'development' && token === 'local-bypass';

  if (isDevelopmentBypass) {
    return { ok: true };
  }

  const secret = process.env.HCAPTCHA_SECRET_KEY || process.env.HCAPTCHA_SECRET;

  if (!secret) {
    console.error('[hCaptcha] Server secret is not configured.');
    return {
      ok: false,
      status: 503,
      message: 'Human verification is temporarily unavailable.',
    };
  }

  if (!token || token === 'local-bypass') {
    return {
      ok: false,
      status: 400,
      message: 'Please complete the human verification challenge.',
    };
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
    });

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: params,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[hCaptcha] Verification service returned:', response.status);
      return {
        ok: false,
        status: 503,
        message: 'Human verification is temporarily unavailable.',
      };
    }

    const result = await response.json();

    if (!result.success) {
      console.warn('[hCaptcha] Challenge rejected:', result['error-codes'] || []);
      return {
        ok: false,
        status: 400,
        message: 'Human verification failed. Please try again.',
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('[hCaptcha] Verification request failed:', error?.message || 'Unknown error');
    return {
      ok: false,
      status: 503,
      message: 'Human verification is temporarily unavailable.',
    };
  }
}
