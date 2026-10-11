import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { getProductUpdatePreview, getQlynkProductRuleUpdate, PRODUCT_PACK_KEY, isObsoleteQlynkProductSource } from '@/lib/qlynk-product-update';
import { rateLimitResponse } from '@/lib/rate-limit';

async function loadOwner() {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from('profiles').select('username').eq('id', user.id).maybeSingle();
  if (profileError) return { error: 'Unable to verify account', status: 500 };
  if (profile?.username !== 'qlynk') return { error: 'This pack is for the Qlynk product account', status: 403 };
  const { data: knowledge, error: knowledgeError } = await admin.from('agent_knowledge').select('*').eq('user_id', user.id).order('id');
  if (knowledgeError) return { error: 'Unable to review knowledge', status: 500 };
  const { data: backup, error: backupError } = await admin.from('qlynk_product_update_backups').select('pack_key').eq('user_id', user.id).maybeSingle();
  if (backupError) return { error: 'Apply the product-update migration before using this tool', status: 503 };
  const { data: currentRules, error: rulesError } = await admin.from('agent_rule_configs').select('*').eq('user_id', user.id).maybeSingle();
  if (rulesError || !currentRules) return { error: 'Unable to review the product agent instructions', status: 503 };
  const updatedRules = getQlynkProductRuleUpdate(currentRules);
  if (!backup && isObsoleteQlynkProductSource({ content: JSON.stringify(updatedRules) })) return { error: 'Some outdated instructions need manual review in Agent Setup before applying this pack', status: 409 };
  const preview = { ...getProductUpdatePreview(knowledge || []), currentRules, updatedRules };
  const reviewToken = createHash('sha256').update(JSON.stringify(preview)).digest('hex');
  return { admin, user, preview: { ...preview, reviewToken }, canUndo: Boolean(backup) };
}

export async function GET(request) {
  const limited = await rateLimitResponse(request, 'product-facts-preview', 30, 60_000);
  if (limited) return limited;
  const owner = await loadOwner();
  if (owner.error) return Response.json({ error: owner.error }, { status: owner.status });
  return Response.json({ ...owner.preview, canUndo: owner.canUndo });
}

export async function POST(request) {
  const limited = await rateLimitResponse(request, 'product-facts-update', 5, 60_000);
  if (limited) return limited;
  const owner = await loadOwner();
  if (owner.error) return Response.json({ error: owner.error }, { status: owner.status });
  const body = await request.json().catch(() => null);
  if (!body || body.packKey !== PRODUCT_PACK_KEY || !['apply', 'undo'].includes(body.action)) {
    return Response.json({ error: 'Review the current product pack before applying it' }, { status: 400 });
  }
  if (body.action === 'apply' && owner.canUndo) return Response.json({ error: 'The pack is already applied. Undo it before replacing it.' }, { status: 409 });
  if (body.action === 'apply' && body.reviewToken !== owner.preview.reviewToken) return Response.json({ error: 'The sources or instructions changed. Review the product update again.' }, { status: 409 });
  const result = body.action === 'undo'
    ? await owner.admin.rpc('undo_qlynk_product_facts', { p_owner_id: owner.user.id })
    : await owner.admin.rpc('apply_qlynk_product_facts', {
      p_owner_id: owner.user.id, p_pack_key: PRODUCT_PACK_KEY,
      p_archive_ids: owner.preview.staleSources.map(item => item.id), p_facts: owner.preview.facts,
      p_rules: owner.preview.updatedRules, p_expected_version: owner.preview.currentRules.prompt_version,
    });
  if (result.error) {
    console.error('[Product facts] Update failed:', result.error.code);
    return Response.json({ error: 'Unable to update product facts. No partial changes were applied.' }, { status: 500 });
  }
  return Response.json({ success: true, action: body.action });
}
