import { featurePages } from '@/lib/marketing-pages';
import { authorityArticles } from '@/lib/authority-articles';
import { isSubscriptionLive } from '@/lib/plans';
import { SITE_URL } from '@/lib/seo';
import { solutionPages } from '@/lib/solution-pages';
import { createAdminClient } from '@/utils/supabase/server';

export const revalidate = 3600;

const routes = [
  ['/', 'weekly', 1],
  ['/pricing', 'monthly', 0.9],
  ['/ai-clone', 'monthly', 0.9],
  ['/personal-ai', 'monthly', 0.9],
  ['/ai-agent', 'monthly', 0.9],
  ['/digital-twin', 'monthly', 0.8],
  ['/for-business', 'monthly', 0.8],
  ['/for-freelancers', 'monthly', 0.8],
  ['/for-founders', 'monthly', 0.8],
  ['/for-creators', 'monthly', 0.8],
  ['/for-job-seekers', 'monthly', 0.7],
  ['/faq', 'monthly', 0.8],
  ['/blog', 'weekly', 0.8],
  ['/blog/what-is-an-ai-clone', 'monthly', 0.7],
  ['/blog/how-to-create-ai-clone', 'monthly', 0.7],
  ['/blog/ai-clone-vs-chatbot', 'monthly', 0.7],
  ['/blog/ai-clone-vs-chatgpt', 'monthly', 0.7],
  ['/solutions', 'weekly', 0.9],
  ['/docs', 'monthly', 0.8],
  ['/compare', 'monthly', 0.7],
  ['/compare/qlynk-vs-chatbase', 'monthly', 0.8],
  ['/about', 'monthly', 0.6],
  ['/press', 'monthly', 0.5],
  ['/privacy', 'yearly', 0.3],
  ['/terms', 'yearly', 0.3],
  ...Object.keys(featurePages).map((slug) => [`/features/${slug}`, 'monthly', 0.7]),
  ...Object.keys(solutionPages).map((slug) => [`/solutions/${slug}`, 'monthly', 0.8]),
  ...Object.keys(authorityArticles).map((slug) => [`/blog/${slug}`, 'monthly', 0.7]),
];

const marketingLastModified = new Date('2026-07-21T00:00:00.000Z');

async function getLiveAgentRoutes() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  try {
    const supabase = createAdminClient();
    const [profilesResult, configsResult, subscriptionsResult] = await Promise.all([
      supabase.from('profiles_public').select('id, username, created_at').not('username', 'is', null),
      supabase.from('agent_configs').select('user_id, is_enabled, access_level').eq('is_enabled', true),
      supabase.from('subscriptions').select('user_id, tier, status, trial_ends_at'),
    ]);

    if (profilesResult.error || configsResult.error || subscriptionsResult.error) {
      console.error('Unable to include live Qlynk Agent pages in sitemap');
      return [];
    }

    const publicAgentIds = new Set(
      configsResult.data
        .filter((config) => !config.access_level || config.access_level === 'public')
        .map((config) => config.user_id),
    );
    const liveSubscriptionIds = new Set(
      subscriptionsResult.data
        .filter((subscription) => isSubscriptionLive(subscription))
        .map((subscription) => subscription.user_id),
    );

    return profilesResult.data
      .filter((profile) => profile.username && publicAgentIds.has(profile.id) && liveSubscriptionIds.has(profile.id))
      .map((profile) => ({
        url: new URL(`/${encodeURIComponent(profile.username)}`, SITE_URL).toString(),
        lastModified: profile.created_at ? new Date(profile.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
  } catch (error) {
    console.error('Unable to build live Qlynk Agent sitemap entries', error);
    return [];
  }
}

export default async function sitemap() {
  const marketingRoutes = routes.map(([path, changeFrequency, priority]) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified: marketingLastModified,
    changeFrequency,
    priority,
  }));

  return [...marketingRoutes, ...(await getLiveAgentRoutes())];
}
