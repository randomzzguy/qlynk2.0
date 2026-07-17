const DAY_MS = 24 * 60 * 60 * 1000;

async function runQuery(resultPromise, label) {
  const { data, error } = await resultPromise;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return data;
}

async function deleteStorageFolder(supabaseAdmin, bucket, folderPrefix) {
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(bucket)
    .list(folderPrefix, { limit: 1000 });

  if (listError) {
    throw listError;
  }

  const paths = (files || [])
    .map((file) => file.name)
    .filter(Boolean)
    .map((name) => `${folderPrefix}/${name}`);

  if (paths.length > 0) {
    const { error: removeError } = await supabaseAdmin.storage
      .from(bucket)
      .remove(paths);

    if (removeError) {
      throw removeError;
    }
  }
}

export async function deleteAccountData({ supabaseAdmin, stripe, userId }) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { data: conversations, error: conversationsError } = await supabaseAdmin
    .from('agent_conversations')
    .select('id')
    .eq('agent_owner_id', userId);

  if (conversationsError) {
    throw conversationsError;
  }

  const { data: pages, error: pagesError } = await supabaseAdmin
    .from('pages')
    .select('id')
    .eq('user_id', userId);

  if (pagesError) {
    throw pagesError;
  }

  const conversationIds = (conversations || []).map((row) => row.id);
  const pageIds = (pages || []).map((row) => row.id);

  await Promise.all([
    deleteStorageFolder(supabaseAdmin, 'avatars', userId),
    deleteStorageFolder(supabaseAdmin, 'agent-documents', userId),
  ]);

  if (conversationIds.length > 0) {
    await runQuery(
      supabaseAdmin
        .from('agent_messages')
        .delete()
        .in('conversation_id', conversationIds),
      'agent_messages delete'
    );
  }

  await Promise.all([
    runQuery(
      supabaseAdmin.from('page_views').delete().eq('page_owner_id', userId),
      'page_views delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_conversations').delete().eq('agent_owner_id', userId),
      'agent_conversations delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_knowledge').delete().eq('user_id', userId),
      'agent_knowledge delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_documents').delete().eq('user_id', userId),
      'agent_documents delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_rule_config_versions').delete().eq('user_id', userId),
      'agent_rule_config_versions delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_rule_configs').delete().eq('user_id', userId),
      'agent_rule_configs delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_security_events').delete().eq('agent_owner_id', userId),
      'agent_security_events delete'
    ),
    runQuery(
      supabaseAdmin.from('agent_configs').delete().eq('user_id', userId),
      'agent_configs delete'
    ),
    runQuery(
      supabaseAdmin.from('subscriptions').delete().eq('user_id', userId),
      'subscriptions delete'
    ),
    pageIds.length > 0
      ? runQuery(
          supabaseAdmin.from('social_links').delete().in('page_id', pageIds),
          'social_links delete'
        )
      : Promise.resolve(null),
    pageIds.length > 0
      ? runQuery(
          supabaseAdmin.from('custom_links').delete().in('page_id', pageIds),
          'custom_links delete'
        )
      : Promise.resolve(null),
    runQuery(
      supabaseAdmin.from('pages').delete().eq('user_id', userId),
      'pages delete'
    ),
  ]);

  if (subscription?.stripe_subscription_id && stripe) {
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch (stripeError) {
      console.warn('[Account Delete] Stripe subscription cancel failed:', stripeError.message);
    }
  }

  if (subscription?.stripe_customer_id && stripe) {
    try {
      await stripe.customers.del(subscription.stripe_customer_id);
    } catch (stripeError) {
      console.warn('[Account Delete] Stripe customer delete failed:', stripeError.message);
    }
  }

  await runQuery(
    supabaseAdmin.auth.admin.deleteUser(userId),
    'auth user delete'
  );

  await runQuery(
    supabaseAdmin.from('profiles').delete().eq('id', userId),
    'profiles delete'
  );

  return {
    username: profile?.username || null,
    deleted_user_id: userId,
  };
}

export async function scheduleAccountDeletion({ supabaseAdmin, userId, days = 7 }) {
  const requestedAt = new Date().toISOString();
  const scheduledFor = new Date(Date.now() + days * DAY_MS).toISOString();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      account_deletion_requested_at: requestedAt,
      account_deletion_scheduled_for: scheduledFor,
    })
    .eq('id', userId)
    .select('account_deletion_requested_at, account_deletion_scheduled_for')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function cancelScheduledAccountDeletion({ supabaseAdmin, userId }) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      account_deletion_requested_at: null,
      account_deletion_scheduled_for: null,
    })
    .eq('id', userId)
    .select('account_deletion_requested_at, account_deletion_scheduled_for')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getDueScheduledAccountDeletions({ supabaseAdmin, beforeIso }) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, account_deletion_requested_at, account_deletion_scheduled_for')
    .not('account_deletion_scheduled_for', 'is', null)
    .lte('account_deletion_scheduled_for', beforeIso);

  if (error) {
    throw error;
  }

  return data || [];
}
