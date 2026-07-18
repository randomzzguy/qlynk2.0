const AUTH_USERS_PER_PAGE = 1_000;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function authEmailExists(supabaseAdmin, email) {
  const normalizedEmail = normalizeEmail(email);
  let page = 1;

  while (page) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PER_PAGE,
    });

    if (error) return { exists: false, error };

    if ((data?.users || []).some((user) => normalizeEmail(user.email) === normalizedEmail)) {
      return { exists: true, error: null };
    }

    const nextPage = Number(data?.nextPage);
    page = Number.isInteger(nextPage) && nextPage > page ? nextPage : 0;
  }

  return { exists: false, error: null };
}

export function isDuplicateSignupResult(data, error) {
  const errorCode = String(error?.code || '').toLowerCase();
  const errorMessage = String(error?.message || '').toLowerCase();
  const identities = data?.user?.identities;

  return errorCode === 'user_already_exists'
    || errorMessage.includes('already registered')
    || errorMessage.includes('already exists')
    || (Array.isArray(identities) && identities.length === 0);
}
